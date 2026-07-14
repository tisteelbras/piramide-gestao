// ————————————————————————————————————————————————
// Biblioteca base de critérios do NEXO.
// No modelo NEXO só existem critérios em dois níveis:
//   VISÃO      → etapas do checklist (Revisado / Não revisado)
//   RESULTADOS → as 3 avaliações sinceras
// Recursos e Processos são medidos pelas entidades cadastradas
// (colaboradores/sistemas/ativos e processos), não por critérios.
// Cada etapa da Visão nomeia uma CAPACIDADE da organização,
// com a pergunta que ela responde.
// ————————————————————————————————————————————————
type Nivel = "visao" | "tatico" | "processos" | "resultados";
type Grupo =
  | "geral" | "rh" | "sistemico" | "estrutural"
  | "indicadores" | "governanca" | "monitoramento" | "desempenho";

export const CRITERIOS_BASE: Array<{ nivel: Nivel; grupo: Grupo; titulo: string }> = [
  // ———— N1 · VISÃO (checklist de etapas) ————
  { nivel: "visao", grupo: "geral", titulo: "Estrutura Organizacional (Quem faz o quê?)" },
  { nivel: "visao", grupo: "geral", titulo: "Identidade Organizacional (Quem somos?)" },
  { nivel: "visao", grupo: "geral", titulo: "Direcionamento Estratégico (Para onde vamos?)" },
  { nivel: "visao", grupo: "geral", titulo: "Modelo Operacional (Como funcionamos?)" },
  { nivel: "visao", grupo: "geral", titulo: "Gestão por Objetivos (O que precisamos entregar?)" },
  { nivel: "visao", grupo: "geral", titulo: "Diretrizes Operacionais (Quais padrões seguimos?)" },
  { nivel: "visao", grupo: "geral", titulo: "Gestão de Competências (Quem executa e como evolui?)" },

  // N4 · RESULTADOS não tem critérios: é calculado dos processos tipados
  // (desempenho, governanca, monitoramento, kpi) cadastrados no N3.
];
