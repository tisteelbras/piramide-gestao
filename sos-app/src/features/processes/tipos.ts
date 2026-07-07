// Tipos e constantes puros do N3 — sem banco, seguros para o cliente.
export const EIXOS_PROCESSO = [
  { id: "rotinas", label: "Rotinas" },
  { id: "padronizacao", label: "Padronização" },
  { id: "planejamento", label: "Planejamento" },
  { id: "prazo", label: "Cumprimento de prazo" },
  { id: "cronograma", label: "Cronograma" },
  { id: "reunioes", label: "Reuniões" },
  { id: "documentacao", label: "Documentação" },
  { id: "automacao", label: "Automação" },
] as const;

export type ProcessoComEixos = {
  id: string;
  nome: string;
  eixos: Record<string, number | null>;
  media: number | null;
};
