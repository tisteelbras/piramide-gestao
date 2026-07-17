// ————————————————————————————————————————————————
// Motor de recomendações por IA — o que a regra fixa não enxerga.
//
// A regra determinística (domain/recomendacoes.ts) pega os gatilhos óbvios,
// um por um. A IA recebe o MESMO retrato do setor e é instruída a CRUZAR os
// quatro níveis: achar a causa raiz provável quando vários sinais apontam
// para o mesmo lugar ("OTIF baixo + sem rastreamento + expedição nota 40 →
// o gargalo é a expedição"). As recomendações da IA SOMAM às da regra
// (origem 'ia'); nunca as substituem.
//
// Sem banco, sem React. Recebe o retrato + a config, devolve recomendações
// já validadas. Qualquer falha (rede, JSON inválido, lixo) devolve [] — o
// diagnóstico por regra continua intacto.
// ————————————————————————————————————————————————
import type { RetratoSetor, RecomendacaoGerada } from "@/domain/recomendacoes";
import { chamarIA, type ConfigIA } from "./provedor";

const ROTULO_NIVEL: Record<string, string> = {
  visao: "Visão", tatico: "Recursos", processos: "Processos", resultados: "Resultados",
};

/** Monta a descrição textual do setor que a IA vai analisar. Só fatos —
 *  nada de nomes de pessoas identificáveis além do que já está no retrato. */
export function montarContexto(r: RetratoSetor): string {
  const linhas: string[] = [];
  linhas.push("MATURIDADE POR NÍVEL (0–100):");
  for (const [nivel, v] of Object.entries(r.maturidadePorNivel)) {
    linhas.push(`- ${ROTULO_NIVEL[nivel] ?? nivel}: ${Math.round(v)}%`);
  }
  const bloco = (titulo: string, itens: string[]) => {
    if (itens.length) linhas.push(`${titulo}: ${itens.join("; ")}`);
  };
  bloco("SISTEMAS NECESSÁRIOS QUE FALTAM", r.sistemasFaltantes);
  bloco("KPIs AUSENTES (a área reconhece que precisa, mas não tem)", r.kpisAusentes);
  bloco("KPIs SEM PROCESSO DE EXECUÇÃO AVALIADO", r.kpisSemProcessoAvaliado);
  if (r.kpisProcessoFraco.length) {
    bloco("KPIs COM EXECUÇÃO FRACA", r.kpisProcessoFraco.map((k) => `${k.nome} (processo em média ${k.media})`));
  }
  if (r.processosFracos.length) {
    bloco("PROCESSOS FRACOS", r.processosFracos.map((p) => `${p.nome} (média ${p.media})`));
  }
  bloco("COLABORADORES COM AVALIAÇÃO BAIXA", r.colaboradoresBaixaMedia);
  return linhas.join("\n");
}

const SYSTEM = `Você é um consultor de gestão analisando um setor de uma empresa pelo método NEXO, que mede a coerência entre quatro níveis encadeados: Visão → Recursos → Processos → Resultados.

Sua tarefa: cruzar os sinais dos quatro níveis e apontar CAUSAS RAIZ prováveis e recomendações que uma regra fixa (que olha um sinal por vez) não veria. Priorize conexões entre níveis — por exemplo, um KPI ruim + um sistema faltante + um processo fraco que apontam para o mesmo gargalo.

Responda APENAS com um objeto JSON válido, sem markdown, no formato:
{"recomendacoes": [{"titulo": "...", "detalhe": "...", "prioridade": 1, "impactoEsperado": "..."}]}

Regras:
- prioridade é inteiro de 1 (mais urgente) a 5 (menos).
- No máximo 4 recomendações, as mais valiosas.
- "titulo" curto e acionável; "detalhe" explica a conexão entre níveis que levou à conclusão; "impactoEsperado" descreve o ganho.
- Escreva em português do Brasil.
- Se os dados forem insuficientes para uma análise útil, devolva {"recomendacoes": []}.`;

/** Parse tolerante: modelos às vezes embrulham o JSON em markdown ou texto.
 *  Extrai o primeiro objeto {...} e valida cada recomendação. Qualquer
 *  coisa fora do formato é descartada, não quebra. */
export function parseRecomendacoesIA(texto: string): RecomendacaoGerada[] {
  // Isola o primeiro bloco {...} (tolera ```json ... ``` e texto ao redor).
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio < 0 || fim <= inicio) return [];
  let obj: unknown;
  try {
    obj = JSON.parse(texto.slice(inicio, fim + 1));
  } catch {
    return [];
  }
  const lista = (obj as { recomendacoes?: unknown })?.recomendacoes;
  if (!Array.isArray(lista)) return [];

  const limpaPrioridade = (p: unknown): number => {
    const n = Math.round(Number(p));
    return Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 3;
  };
  const texto0a300 = (v: unknown): string | null => {
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t ? t.slice(0, 300) : null;
  };

  const out: RecomendacaoGerada[] = [];
  for (const item of lista) {
    if (typeof item !== "object" || item === null) continue;
    const it = item as Record<string, unknown>;
    const titulo = texto0a300(it.titulo);
    if (!titulo) continue; // título é obrigatório
    out.push({
      titulo,
      detalhe: texto0a300(it.detalhe) ?? "",
      prioridade: limpaPrioridade(it.prioridade),
      impactoEsperado: texto0a300(it.impactoEsperado) ?? "",
    });
    if (out.length >= 4) break;
  }
  return out;
}

/**
 * Gera recomendações por IA para o setor. Nunca lança: qualquer erro (sem
 * config, rede, timeout, JSON inválido) vira lista vazia, e o diagnóstico
 * por regra segue. Retorna também um motivo quando não rodou, para a UI
 * poder avisar.
 */
export async function gerarRecomendacoesIA(
  retrato: RetratoSetor,
  cfg: ConfigIA | null,
): Promise<{ recomendacoes: RecomendacaoGerada[]; motivo: "ok" | "sem_config" | "falha" }> {
  if (!cfg) return { recomendacoes: [], motivo: "sem_config" };
  try {
    const texto = await chamarIA(
      cfg,
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Analise este setor:\n\n${montarContexto(retrato)}` },
      ],
      { json: true, timeoutMs: 30_000 },
    );
    return { recomendacoes: parseRecomendacoesIA(texto), motivo: "ok" };
  } catch {
    return { recomendacoes: [], motivo: "falha" };
  }
}
