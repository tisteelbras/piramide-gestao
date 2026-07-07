// Tipos e constantes puros do N2 — sem banco, seguros para o cliente.
export const EIXOS_RH = [
  { id: "cultura", label: "Cultura" },
  { id: "fit_cultural", label: "Fit cultural" },
  { id: "treinamento", label: "Treinamento" },
  { id: "desempenho", label: "Desempenho" },
] as const;

export type ColaboradorComNotas = {
  id: string;
  nome: string;
  cargo: string | null;
  notas: Record<string, number | null>;
};

export type SistemaItem = { id: string; nome: string; nota: number | null; ehNecessidade: boolean };
export type AtivoItem = { id: string; nome: string; nota: number | null };

export type RecursosDoSetor = {
  colaboradores: ColaboradorComNotas[];
  sistemas: SistemaItem[];
  ativos: AtivoItem[];
};
