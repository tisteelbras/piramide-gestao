// ————————————————————————————————————————————————
// Biblioteca base de critérios do NEXO.
// No modelo NEXO só existem critérios em dois níveis:
//   VISÃO      → etapas do checklist (Revisado / Não revisado)
//   RESULTADOS → as 3 avaliações sinceras
// Recursos e Processos são medidos pelas entidades cadastradas
// (colaboradores/sistemas/ativos e processos), não por critérios.
// ————————————————————————————————————————————————
type Nivel = "visao" | "tatico" | "processos" | "resultados";
type Grupo =
  | "geral" | "rh" | "sistemico" | "estrutural"
  | "indicadores" | "governanca" | "monitoramento" | "desempenho";

export const CRITERIOS_BASE: Array<{ nivel: Nivel; grupo: Grupo; titulo: string }> = [
  // ———— N1 · VISÃO (checklist de etapas) ————
  { nivel: "visao", grupo: "geral", titulo: "Identidade e propósito do setor definidos" },
  { nivel: "visao", grupo: "geral", titulo: "Cultura e valores disseminados" },
  { nivel: "visao", grupo: "geral", titulo: "Responsabilidades e papéis mapeados" },
  { nivel: "visao", grupo: "geral", titulo: "Estratégia clara e comunicada à equipe" },
  { nivel: "visao", grupo: "geral", titulo: "Pilares (qualidade, prazo, eficiência) definidos" },
  { nivel: "visao", grupo: "geral", titulo: "Gestão de talentos e competências" },
  { nivel: "visao", grupo: "geral", titulo: "Organograma atualizado" },
  { nivel: "visao", grupo: "geral", titulo: "Metas do setor alinhadas às da empresa" },

  // ———— N4 · RESULTADOS (avaliações sinceras) ————
  { nivel: "resultados", grupo: "governanca", titulo: "Governança e controles internos" },
  { nivel: "resultados", grupo: "monitoramento", titulo: "Monitoramento contínuo dos resultados" },
  { nivel: "resultados", grupo: "desempenho", titulo: "Avaliação de desempenho aplicada" },
];
