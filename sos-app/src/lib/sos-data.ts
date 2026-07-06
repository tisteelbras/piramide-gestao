// ————————————————————————————————————————————————
// SOS — Modelo de dados do protótipo (Etapa 0)
// Ainda em memória/localStorage. A partir da Etapa 1 isto
// passa a vir do Supabase; manter os tipos estáveis facilita
// essa migração.
// ————————————————————————————————————————————————

export const BRAND = {
  blue: "#0068a9",
  blueDark: "#004e80",
  green: "#47ad4b",
  greenDark: "#33853a",
  ink: "#0e1a24",
} as const;

export type Level = {
  id: string;
  n: string;
  title: string;
  tag: string;
  color: string;
  dark: string;
  desc: string;
  items: string[];
  sectors?: boolean;
};

export const LEVELS: Level[] = [
  {
    id: "visao",
    n: "1º",
    title: "Visão",
    tag: "Estratégico",
    color: BRAND.blue,
    dark: BRAND.blueDark,
    desc: "Contexto estratégico interno e externo. Onde a empresa define quem é e para onde vai.",
    items: [
      "Definição de identidade e propósito",
      "Cultura",
      "Responsabilidades",
      "Estratégia",
      "Pilares (Qualidade · Quantidade · Prazos · Eficiência)",
      "Gestão de talentos e competências",
      "Organograma",
    ],
  },
  {
    id: "tatico",
    n: "2º",
    title: "Recursos",
    tag: "Tático",
    color: BRAND.green,
    dark: BRAND.greenDark,
    desc: "Os recursos que sustentam a estratégia: pessoas, sistemas e estrutura.",
    items: [
      "Humanos — Fit cultural · Capacitação · Treinamento e desenvolvimento",
      "Sistêmicos — ERP · Ferramentas de gestão · Planner · MRP Local",
      "Estruturais — Estrutura predial · Logística · Hardware · Máquinas",
    ],
  },
  {
    id: "operacional",
    n: "3º",
    title: "Processos",
    tag: "Operacional",
    color: BRAND.blue,
    dark: BRAND.blueDark,
    desc: "O que fazer com a visão + recursos. É onde você age. Cada setor tem seu checklist operacional.",
    items: [],
    sectors: true,
  },
  {
    id: "resultados",
    n: "4º",
    title: "Resultado",
    tag: "Indicadores",
    color: BRAND.green,
    dark: BRAND.greenDark,
    desc: "A medição de tudo que foi construído acima.",
    items: [
      "Indicadores (métricas de desempenho)",
      "Governança",
      "Monitoramento",
      "Avaliação de desempenho",
    ],
  },
];

// As 6 etapas operacionais fixas que todo setor segue
export type Stage = { id: string; label: string; hint: string };

export const STAGES: Stage[] = [
  { id: "rotinas", label: "Rotinas", hint: "Cultura e comportamentos que fluem para o objetivo" },
  { id: "padronizacao", label: "Padronização", hint: "Qualidade" },
  { id: "mapeamento", label: "Mapeamento de processos", hint: "Organização e controle de eficiência" },
  { id: "planejamento", label: "Planejamento", hint: "Atendimento ao prazo" },
  { id: "cronograma", label: "Cronograma de fabricação", hint: "Sequência e datas de produção" },
  { id: "reunioes", label: "Reuniões", hint: "Ritmo e alinhamento" },
];

export const DEFAULT_SECTORS = [
  "Estoque AC",
  "PCP",
  "Compras",
  "Comercial",
  "Financeiro",
  "Estoque MT",
];

export type Sector = { id: string; name: string };
export type Task = { id: string; title: string; who: string; done: boolean };
// Checklist de um setor: { [stageId]: Task[] }
export type SectorChecklistData = Record<string, Task[]>;
// Todos os checklists: { [sectorId]: SectorChecklistData }
export type ChecklistsState = Record<string, SectorChecklistData>;

export const uid = () => Math.random().toString(36).slice(2, 9);
