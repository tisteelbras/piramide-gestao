// ————————————————————————————————————————————————
// Motor de recomendações por REGRA (determinístico).
// Recebe um retrato do setor e devolve recomendações priorizadas.
// Quando a IA real entrar, ela ACRESCENTA recomendações (origem 'ia'),
// sem substituir estas regras.
//
// Prioridade: 1 = mais urgente ... 5 = menos.
// ————————————————————————————————————————————————
import type { Nivel } from "@/features/assessments/tipos";

export type RecomendacaoGerada = {
  titulo: string;
  detalhe: string;
  prioridade: number;
  impactoEsperado: string;
};

export type RetratoSetor = {
  // Maturidade (preenchimento 0–100) por nível.
  maturidadePorNivel: Record<Nivel, number>;
  // Sistemas marcados como necessidade (não existem, mas são precisos).
  sistemasFaltantes: string[];
  // KPIs marcados como ausentes (a área reconhece que precisa, mas não tem).
  kpisAusentes: string[];
  // KPIs declarados cujo PROCESSO de execução ainda não foi avaliado
  // (não se sabe se a área executa o que leva ao indicador).
  kpisSemProcessoAvaliado: string[];
  // KPIs declarados cujo processo de execução tem maturidade baixa:
  // { nome, media } — a execução que persegue o indicador está fraca.
  kpisProcessoFraco: { nome: string; media: number }[];
  // Processos com média baixa: { nome, media }.
  processosFracos: { nome: string; media: number }[];
  // Colaboradores com média baixa: nomes.
  colaboradoresBaixaMedia: string[];
  // Check obrigatório da Estrutura Organizacional ainda não confirmado.
  politicaComercialFaltante?: boolean;
};

const ROTULO_NIVEL: Record<Nivel, string> = {
  visao: "Visão",
  tatico: "Recursos",
  processos: "Processos",
  resultados: "Resultados",
};

export function gerarRecomendacoes(r: RetratoSetor): RecomendacaoGerada[] {
  const recs: RecomendacaoGerada[] = [];

  // Regra 0: Política Comercial é obrigatória — sem o check confirmado,
  // vira a recomendação mais prioritária do setor.
  if (r.politicaComercialFaltante) {
    recs.push({
      titulo: "Formalizar a Política Comercial",
      detalhe: "A Política Comercial é obrigatória e ainda não foi confirmada na etapa Estrutura Organizacional. Sem ela, regras de preço, desconto e atendimento ficam no improviso.",
      prioridade: 1,
      impactoEsperado: "Padronização das decisões comerciais e conformidade da estrutura.",
    });
  }

  // Regra 1: sistema necessário ausente → implementar (alta prioridade).
  for (const s of r.sistemasFaltantes) {
    recs.push({
      titulo: `Implementar sistema: ${s}`,
      detalhe: `O setor indicou "${s}" como necessário, mas ele não está em uso. A ausência limita a eficiência e o controle.`,
      prioridade: 1,
      impactoEsperado: "Ganho de eficiência operacional e redução de retrabalho.",
    });
  }

  // Regra 2: KPI ausente cruzado com sistema faltante.
  for (const k of r.kpisAusentes) {
    const temSistemaRelacionado = r.sistemasFaltantes.length > 0;
    recs.push({
      titulo: `Definir o indicador: ${k}`,
      detalhe: temSistemaRelacionado
        ? `O indicador "${k}" está ausente. Como há sistemas faltantes, provavelmente falta a fonte de dados — priorize a ferramenta que o alimenta.`
        : `O indicador "${k}" está ausente. Defina o KPI, a fonte do dado e o processo que a área executa para atingi-lo.`,
      prioridade: 2,
      impactoEsperado: "Visibilidade de desempenho e decisão baseada em dados.",
    });
  }

  // Regra 2b: KPI declarado, mas o PROCESSO que o executa ainda não foi
  // avaliado — não se sabe se a área faz o que leva ao indicador.
  for (const k of r.kpisSemProcessoAvaliado) {
    recs.push({
      titulo: `Avaliar a execução do KPI: ${k}`,
      detalhe: `O indicador "${k}" está declarado, mas o processo que a área executa para atingi-lo ainda não foi avaliado em Processos. Avalie os 5 eixos desse processo para que ele produza o Resultado de KPI.`,
      prioridade: 2,
      impactoEsperado: "O KPI passa a gerar resultado e entra no nível Resultados.",
    });
  }

  // Regra 2c: KPI declarado, mas o processo de execução está fraco — é aqui
  // que o resultado dói: a área tem o indicador, mas não executa bem o que
  // leva até ele.
  for (const k of r.kpisProcessoFraco) {
    recs.push({
      titulo: `Fortalecer a execução do KPI: ${k.nome}`,
      detalhe: `O processo que persegue o indicador "${k.nome}" está com maturidade ${k.media}. Padronize, planeje e monitore essa execução — o número do KPI só melhora quando o processo que leva a ele melhora.`,
      prioridade: k.media < 25 ? 1 : 2,
      impactoEsperado: "Resultado de KPI mais alto por trás de uma execução consistente.",
    });
  }

  // Regra 3: nível com maturidade baixa (<40) → foco estratégico.
  for (const nivel of Object.keys(r.maturidadePorNivel) as Nivel[]) {
    const m = r.maturidadePorNivel[nivel];
    if (m < 40) {
      recs.push({
        titulo: `Elevar a maturidade de ${ROTULO_NIVEL[nivel]}`,
        detalhe: `O nível ${ROTULO_NIVEL[nivel]} está em ${Math.round(m)}% — abaixo do mínimo saudável. Concentre um plano de ação neste nível.`,
        prioridade: m < 20 ? 1 : 3,
        impactoEsperado: "Base mais sólida para os demais níveis da pirâmide.",
      });
    }
  }

  // Regra 4: processos fracos.
  for (const p of r.processosFracos) {
    recs.push({
      titulo: `Revisar o processo: ${p.nome}`,
      detalhe: `O processo "${p.nome}" tem média ${p.media}. Padronize, documente e defina responsáveis.`,
      prioridade: 3,
      impactoEsperado: "Menos variação e mais previsibilidade na operação.",
    });
  }

  // Regra 5: pessoas com baixa média.
  if (r.colaboradoresBaixaMedia.length > 0) {
    recs.push({
      titulo: "Plano de desenvolvimento para a equipe",
      detalhe: `Colaboradores com avaliação baixa: ${r.colaboradoresBaixaMedia.join(", ")}. Estruture treinamento e acompanhamento.`,
      prioridade: 2,
      impactoEsperado: "Aumento de desempenho e engajamento da equipe.",
    });
  }

  // Ordena por prioridade (1 primeiro).
  return recs.sort((a, b) => a.prioridade - b.prioridade);
}
