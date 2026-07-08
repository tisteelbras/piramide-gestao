// Tipos e constantes puros do N3 — sem banco, seguros para o cliente.
// As 5 etapas de avaliação de cada processo (modelo NEXO).
export const EIXOS_PROCESSO = [
  { id: "rotinas", label: "Rotinas" },
  { id: "padronizacao", label: "Padronização" },
  { id: "planejamento", label: "Planejamento (atendimento ao prazo)" },
  { id: "cronograma", label: "Cronograma" },
  { id: "reunioes", label: "Reuniões" },
] as const;

export type ProcessoComEixos = {
  id: string;
  nome: string;
  eixos: Record<string, number | null>;
  media: number | null;
};
