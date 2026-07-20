// ————————————————————————————————————————————————
// Cálculo da maturidade NEXO — a REGRA, separada do banco.
//
// Este módulo recebe o retrato do setor já carregado e devolve o
// MaturidadeDTO. Não importa Drizzle nem "server-only": é uma função
// pura, o que a torna testável sem subir banco.
//
// A busca dos dados continua em features/assessments/maturidade-setor.ts,
// que monta a entrada abaixo e delega o cálculo para cá. Cada nível tem
// sua própria mecânica — a documentação de cada uma está junto da regra.
// ————————————————————————————————————————————————
import type { Nivel, MaturidadeDTO } from "@/features/assessments/tipos";

export const arred = (n: number) => Math.round(n * 10) / 10;

/** Média simples; null quando não há nenhum valor (≠ zero). */
export const media = (vals: number[]): number | null =>
  vals.length ? arred(vals.reduce((a, b) => a + b, 0) / vals.length) : null;

/** Entrada do cálculo: o retrato do setor já carregado do banco.
 *  Tipos propositalmente mínimos — só o que a regra consome. */
export type EntradaMaturidade = {
  /** Critérios do nível "visao" e o status de cada um na avaliação corrente. */
  itensVisao: { id: string; status?: "nao_iniciada" | "em_andamento" | "revisada" | null; respondido: boolean }[];
  /** Colaboradores do setor com as notas dos 4 eixos (vazio = não avaliado). */
  colaboradores: { id: string; notas: number[] }[];
  /** Sistemas do setor. Necessidade (o que falta) não entra na média. */
  sistemas: { nota: number | null; ehNecessidade: boolean }[];
  /** Ativos do setor. */
  ativos: { nota: number | null }[];
  /** Processos do setor com o tipo e as notas dos 5 eixos. */
  processos: { id: string; nome: string; tipo: string; notas: number[] }[];
  /** Tipos que formam o N4 — injetados para o cálculo não depender do catálogo. */
  tiposComResultado: { id: string; resultado: string }[];
};

export function calculaMaturidade(e: EntradaMaturidade): MaturidadeDTO {
  // ——— VISÃO: checklist binário (revisada ou não) ———
  const revisadas = e.itensVisao.filter((i) => i.status === "revisada").length;
  const pctVisao = e.itensVisao.length ? arred((revisadas / e.itensVisao.length) * 100) : 0;

  // ——— RECURSOS: média dos 3 grupos que têm dados ———
  // RH: média por colaborador (4 eixos), depois média do time. Colaborador
  // sem nenhuma nota fica fora — não pesa como zero.
  const mediasColab = e.colaboradores
    .map((c) => media(c.notas))
    .filter((m): m is number => m !== null);
  const mediaRh = media(mediasColab);
  // Sistêmico: necessidades ficam de fora da média — viram recomendação,
  // não nota. Marcar o que falta não pode derrubar a maturidade.
  const mediaSist = media(
    e.sistemas.filter((s) => !s.ehNecessidade && s.nota != null).map((s) => Number(s.nota)),
  );
  const mediaEstr = media(e.ativos.filter((a) => a.nota != null).map((a) => Number(a.nota)));
  const gruposComDados = [mediaRh, mediaSist, mediaEstr].filter((m): m is number => m !== null);
  const pctTatico = media(gruposComDados) ?? 0;

  // ——— PROCESSOS: média das médias ———
  const porProcesso = e.processos.map((p) => ({ nome: p.nome, media: media(p.notas) }));
  const pctProcessos =
    media(porProcesso.map((p) => p.media).filter((m): m is number => m !== null)) ?? 0;

  // ——— RESULTADOS: resultado de processo aplicado ———
  // Um tópico por tipo com resultado. Processo tipado SEM notas conta como
  // 0 (existir sem ser executado derruba o resultado e provoca o
  // preenchimento); `nota` só é null quando não há processo algum do tipo.
  const itensResultado = e.tiposComResultado.map((t) => {
    const doTipo = e.processos.filter((p) => p.tipo === t.id).map((p) => media(p.notas) ?? 0);
    return { titulo: t.resultado, nota: media(doTipo) };
  });
  const pctResultados =
    media(itensResultado.map((i) => i.nota).filter((n): n is number => n !== null)) ?? 0;

  const porNivel: Record<Nivel, number> = {
    visao: pctVisao,
    tatico: pctTatico,
    processos: pctProcessos,
    resultados: pctResultados,
  };
  const geral = arred((pctVisao + pctTatico + pctProcessos + pctResultados) / 4);

  // Pendências: o que ainda não foi tocado, somado entre os níveis.
  const pendencias =
    e.itensVisao.filter((i) => !i.respondido).length +
    e.colaboradores.filter((c) => c.notas.length === 0).length +
    e.sistemas.filter((s) => !s.ehNecessidade && s.nota == null).length +
    e.ativos.filter((a) => a.nota == null).length +
    porProcesso.filter((p) => p.media === null).length +
    itensResultado.filter((i) => i.nota === null).length;

  return {
    porNivel,
    geral,
    detalhe: {
      visao: { revisadas, total: e.itensVisao.length },
      tatico: { rh: mediaRh, sistemico: mediaSist, estrutural: mediaEstr },
      processos: { porProcesso },
      resultados: { itens: itensResultado },
    },
    pendencias,
  };
}
