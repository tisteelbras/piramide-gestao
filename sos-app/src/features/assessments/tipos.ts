// Tipos compartilhados entre servidor e cliente para as avaliações.
export type Nivel = "visao" | "tatico" | "processos" | "resultados";
export type StatusResposta = "nao_iniciada" | "em_andamento" | "revisada";

export type CriterioAvaliado = {
  id: string;
  nivel: Nivel;
  grupo: string;
  titulo: string;
  peso: number;
  nota: number | null;
  status: StatusResposta;
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
