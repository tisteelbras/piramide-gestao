// Tipos puros do N4 — seguros para o cliente.
export type IndicadorItem = {
  id: string;
  nome: string;
  unidade: string | null;
  meta: number | null;
  valorAtual: number | null;
  ehAusencia: boolean;
};

export type RecomendacaoItem = {
  id: string;
  titulo: string;
  detalhe: string | null;
  prioridade: number;
  impactoEsperado: string | null;
};

export type ResultadosDoSetor = {
  indicadores: IndicadorItem[];
  recomendacoes: RecomendacaoItem[];
};
