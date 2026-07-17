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
export type TipoProcesso =
  | "desempenho"
  | "governanca"
  | "monitoramento"
  | "kpi"
  | "disciplina_operacional"
  | "gestao_objetivos"
  | "outro";

export const TIPOS_PROCESSO: { id: TipoProcesso; label: string; resultado: string | null }[] = [
  { id: "desempenho", label: "Avaliação de desempenho aplicada", resultado: "Resultado da Avaliação de desempenho" },
  { id: "governanca", label: "Governança e controles internos", resultado: "Resultado de Governança e controles" },
  { id: "monitoramento", label: "Monitoramento contínuo dos resultados", resultado: "Resultado do Monitoramento contínuo" },
  // KPI: NÃO se cria solto aqui — nasce ao declarar o indicador na etapa
  // Indicadores da Visão. Este processo é "a execução que a área faz para
  // atingir o KPI"; medi-lo (5 eixos) é o que forma o Resultado de KPI.
  { id: "kpi", label: "Execução de KPI (nasce do indicador)", resultado: "Resultado de KPI" },
  // Disciplina Operacional: mede a EXECUÇÃO do que a Visão concebeu —
  // aderência, cumprimento, controles, monitoramento e melhoria. É onde
  // vive a pergunta "estamos executando com disciplina?".
  { id: "disciplina_operacional", label: "Disciplina Operacional (execução dos processos)", resultado: "Resultado da Disciplina Operacional" },
  // Gestão por Objetivos: só se faz DEPOIS que os processos estão
  // alinhados — por isso é resultado, não visão. Responde "o que
  // precisamos entregar?" com os processos já de pé.
  { id: "gestao_objetivos", label: "Gestão por Objetivos (o que precisamos entregar?)", resultado: "Resultado da Gestão por Objetivos" },
  { id: "outro", label: "Outros (só conta em Processos)", resultado: null },
];

/** Tipos que alimentam o N4, na ordem em que aparecem em Resultados.
 *  Fonte única: o motor de maturidade deriva daqui, para que cadastrar
 *  um tipo novo nunca mais exija editar o cálculo em outro arquivo. */
export const TIPOS_COM_RESULTADO = TIPOS_PROCESSO.filter(
  (t): t is { id: TipoProcesso; label: string; resultado: string } => t.resultado !== null,
);

export type ProcessoComEixos = {
  id: string;
  nome: string;
  tipo: TipoProcesso;
  eixos: Record<string, number | null>;
  media: number | null;
};
