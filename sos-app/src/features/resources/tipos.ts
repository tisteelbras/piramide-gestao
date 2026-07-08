// Tipos e constantes puros do N2 — sem banco, seguros para o cliente.
// Os 3 passos de avaliação de cada colaborador (modelo NEXO).
export const EIXOS_RH = [
  { id: "cultura", label: "Cultura / Fit cultural" },
  { id: "treinamento", label: "Treinamento" },
  { id: "desempenho", label: "Desempenho" },
] as const;

export type ColaboradorComNotas = {
  id: string;
  nome: string;
  cargo: string | null;
  notas: Record<string, number | null>;
};

export type SistemaItem = { id: string; nome: string; nota: number | null; ehNecessidade: boolean; justificativa: string | null };
export type AtivoItem = { id: string; nome: string; nota: number | null; observacao: string | null };

export type RecursosDoSetor = {
  colaboradores: ColaboradorComNotas[];
  sistemas: SistemaItem[];
  ativos: AtivoItem[];
};
