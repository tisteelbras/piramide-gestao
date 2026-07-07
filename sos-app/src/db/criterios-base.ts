// ————————————————————————————————————————————————
// Biblioteca base de critérios dos 4 níveis da pirâmide.
// Fonte única — usada pelo seed e pelo reseed de critérios.
// ————————————————————————————————————————————————
type Nivel = "visao" | "tatico" | "processos" | "resultados";
type Grupo =
  | "geral" | "rh" | "sistemico" | "estrutural"
  | "indicadores" | "governanca" | "monitoramento" | "desempenho";

export const CRITERIOS_BASE: Array<{ nivel: Nivel; grupo: Grupo; titulo: string }> = [
  // ———————————— N1 · VISÃO (estratégico) ————————————
  { nivel: "visao", grupo: "geral", titulo: "Identidade e propósito do setor definidos" },
  { nivel: "visao", grupo: "geral", titulo: "Estratégia clara e comunicada à equipe" },
  { nivel: "visao", grupo: "geral", titulo: "Cultura e valores disseminados" },
  { nivel: "visao", grupo: "geral", titulo: "Responsabilidades e papéis mapeados" },
  { nivel: "visao", grupo: "geral", titulo: "Organograma atualizado" },
  { nivel: "visao", grupo: "geral", titulo: "Metas do setor alinhadas às da empresa" },
  { nivel: "visao", grupo: "geral", titulo: "Pilares (qualidade, prazo, eficiência) definidos" },

  // ———————————— N2 · TÁTICO (recursos) ————————————
  // Humanos
  { nivel: "tatico", grupo: "rh", titulo: "Equipe com fit cultural avaliado" },
  { nivel: "tatico", grupo: "rh", titulo: "Plano de capacitação e treinamento ativo" },
  { nivel: "tatico", grupo: "rh", titulo: "Desempenho da equipe acompanhado" },
  // Sistêmicos
  { nivel: "tatico", grupo: "sistemico", titulo: "ERP em uso e adequado à operação" },
  { nivel: "tatico", grupo: "sistemico", titulo: "Ferramentas de gestão/planejamento disponíveis" },
  { nivel: "tatico", grupo: "sistemico", titulo: "Sistemas integrados entre si" },
  // Estruturais
  { nivel: "tatico", grupo: "estrutural", titulo: "Estrutura física adequada" },
  { nivel: "tatico", grupo: "estrutural", titulo: "Máquinas e equipamentos em boas condições" },
  { nivel: "tatico", grupo: "estrutural", titulo: "Hardware e infraestrutura de TI suficientes" },

  // ———————————— N3 · PROCESSOS (operacional) ————————————
  { nivel: "processos", grupo: "geral", titulo: "Rotinas definidas e seguidas" },
  { nivel: "processos", grupo: "geral", titulo: "Processos padronizados e documentados" },
  { nivel: "processos", grupo: "geral", titulo: "Planejamento e cronograma sob controle" },
  { nivel: "processos", grupo: "geral", titulo: "Cumprimento de prazos monitorado" },
  { nivel: "processos", grupo: "geral", titulo: "Ritmo de reuniões e alinhamento" },
  { nivel: "processos", grupo: "geral", titulo: "Nível de automação dos processos" },

  // ———————————— N4 · RESULTADOS (indicadores) ————————————
  { nivel: "resultados", grupo: "indicadores", titulo: "KPIs definidos para o setor" },
  { nivel: "resultados", grupo: "indicadores", titulo: "Indicadores acompanhados periodicamente" },
  { nivel: "resultados", grupo: "governanca", titulo: "Governança e controles internos" },
  { nivel: "resultados", grupo: "monitoramento", titulo: "Monitoramento contínuo dos resultados" },
  { nivel: "resultados", grupo: "desempenho", titulo: "Avaliação de desempenho aplicada" },
];
