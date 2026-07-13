// Tipos e constantes puros do N3 — sem banco, seguros para o cliente.
// As 5 etapas de avaliação de cada processo (modelo NEXO),
// nomeadas como capacidades do ciclo de gestão do processo.
export const EIXOS_PROCESSO = [
  { id: "padronizacao", label: "Padronização" },
  { id: "execucao", label: "Execução" },
  { id: "planejamento", label: "Planejamento" },
  { id: "monitoramento", label: "Monitoramento" },
  { id: "melhoria_continua", label: "Melhoria Contínua" },
] as const;

/** Tipos de processo. Os 4 primeiros alimentam o nível RESULTADOS
 *  ("resultado de processo aplicado"); "outro" conta só em Processos. */
export type TipoProcesso = "desempenho" | "governanca" | "monitoramento" | "kpi" | "outro";

export const TIPOS_PROCESSO: { id: TipoProcesso; label: string; resultado: string | null }[] = [
  { id: "desempenho", label: "Avaliação de desempenho aplicada", resultado: "Resultado da Avaliação de desempenho" },
  { id: "governanca", label: "Governança e controles internos", resultado: "Resultado de Governança e controles" },
  { id: "monitoramento", label: "Monitoramento contínuo dos resultados", resultado: "Resultado do Monitoramento contínuo" },
  { id: "kpi", label: "KPI", resultado: "Resultado de KPI" },
  { id: "outro", label: "Outros (só conta em Processos)", resultado: null },
];

export type ProcessoComEixos = {
  id: string;
  nome: string;
  tipo: TipoProcesso;
  eixos: Record<string, number | null>;
  media: number | null;
};
