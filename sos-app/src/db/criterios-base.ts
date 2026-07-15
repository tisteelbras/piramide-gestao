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
  // A ORDEM aqui é a ordem de apresentação na tela (campo `ordem` = índice).
  { nivel: "visao", grupo: "geral", titulo: "Identidade Organizacional (Quem somos?)" },
  { nivel: "visao", grupo: "geral", titulo: "Estrutura Organizacional (Quem faz o quê?)" },
  { nivel: "visao", grupo: "geral", titulo: "Direcionamento Estratégico (Para onde vamos?)" },
  { nivel: "visao", grupo: "geral", titulo: "Indicadores de Desempenho (Como medimos?)" },
  { nivel: "visao", grupo: "geral", titulo: "Governança Operacional (Como funcionamos?)" },
  { nivel: "visao", grupo: "geral", titulo: "Gestão de Competências (Quem executa e como evolui?)" },

  // "Gestão por Objetivos (O que precisamos entregar?)" NÃO está aqui de
  // propósito: ela só se faz DEPOIS que os processos estão alinhados, logo
  // é consequência, não concepção. Virou um TIPO DE PROCESSO
  // (gestao_objetivos) e sobe para o N4 como "Resultado da Gestão por
  // Objetivos". Ver features/processes/tipos.ts.

  // N4 · RESULTADOS não tem critérios: é calculado dos processos tipados
  // cadastrados no N3 + o atingimento dos KPIs (valor × meta).
];
