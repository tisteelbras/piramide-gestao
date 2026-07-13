// Tipos e constantes puros do N2 — sem banco, seguros para o cliente.
// Os 4 passos de avaliação de cada colaborador (modelo NEXO).
// Os ids "cultura", "treinamento" e "desempenho" são mantidos por
// compatibilidade com o enum do banco; os rótulos são os nomes atuais.
export const EIXOS_RH = [
  { id: "cultura", label: "Alinhamento Cultural" },
  { id: "treinamento", label: "Competência" },
  { id: "desempenho", label: "Performance" },
  { id: "potencial_evolucao", label: "Potencial de Evolução" },
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
