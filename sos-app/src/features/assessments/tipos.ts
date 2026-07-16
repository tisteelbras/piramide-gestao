// Tipos compartilhados entre servidor e cliente para as avaliações.
export type Nivel = "visao" | "tatico" | "processos" | "resultados";
export type StatusResposta = "nao_iniciada" | "em_andamento" | "revisada";

export type AnexoInfo = { id: string; nomeOriginal: string; tamanhoBytes: number | null };

export type CriterioAvaliado = {
  id: string;
  nivel: Nivel;
  grupo: string;
  titulo: string;
  peso: number;
  nota: number | null;
  status: StatusResposta;
  observacao: string | null;
  // Checks nomeados da etapa (ex.: politica_comercial: true). null = nenhum.
  checks: Record<string, boolean> | null;
  anexos: AnexoInfo[];
};

/** Resultado consolidado da maturidade NEXO de um setor (serializável). */
export type MaturidadeDTO = {
  porNivel: Record<Nivel, number>;
  geral: number;
  detalhe: {
    visao: { revisadas: number; total: number };
    tatico: { rh: number | null; sistemico: number | null; estrutural: number | null };
    processos: { porProcesso: { nome: string; media: number | null }[] };
    resultados: { itens: { titulo: string; nota: number | null }[] };
  };
  pendencias: number;
};

/** Metadados dos 4 níveis para exibição (rótulo, cor, ordem). */
export const NIVEIS: {
  id: Nivel;
  n: string;
  titulo: string;
  tag: string;
  cor: string;
  corDark: string;
}[] = [
  { id: "visao", n: "1º", titulo: "Visão", tag: "Estratégico", cor: "#0068a9", corDark: "#004e80" },
  { id: "tatico", n: "2º", titulo: "Recursos", tag: "Tático", cor: "#47ad4b", corDark: "#33853a" },
  { id: "processos", n: "3º", titulo: "Processos", tag: "Operacional", cor: "#0068a9", corDark: "#004e80" },
  { id: "resultados", n: "4º", titulo: "Resultado", tag: "Indicadores", cor: "#47ad4b", corDark: "#33853a" },
];
