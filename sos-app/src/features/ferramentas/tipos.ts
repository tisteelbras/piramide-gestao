// Tipos e constantes puros do hub de Ferramentas — sem banco,
// seguros para o cliente.

// ————— Catálogo do hub —————
// O SOS (diagnóstico da pirâmide) É o NEXO — a ferramenta principal —
// e vive nas rotas existentes ("/"); por isso não entra neste catálogo.
// O hub reúne as ferramentas de APOIO, para a análise clínica de cada
// setor quando necessário. Todas moram em /ferramentas/*.
export const FERRAMENTAS = [
  {
    id: "5w2h",
    nome: "Plano de Ação 5W2H",
    pergunta: "O que fazer, quem faz e quanto custa?",
    descricao: "Transforma decisões em ações com responsável, prazo, método e custo definidos.",
    href: "/ferramentas/5w2h",
    emoji: "🗂️",
  },
  {
    id: "ishikawa",
    nome: "Ishikawa (Causa e Efeito)",
    pergunta: "Por que o problema acontece?",
    descricao: "Organiza as causas de um problema nos 6M para encontrar a causa raiz.",
    href: "/ferramentas/ishikawa",
    emoji: "🐟",
  },
  {
    id: "bcg",
    nome: "Matriz BCG",
    pergunta: "Onde investir o portfólio?",
    descricao: "Posiciona produtos/serviços por participação de mercado × crescimento.",
    href: "/ferramentas/bcg",
    emoji: "🎯",
  },
] as const;

// ————— 5W2H —————
export type StatusAcao = "pendente" | "em_andamento" | "concluida";

export const ROTULO_STATUS: Record<StatusAcao, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};
export const PROXIMO_STATUS: Record<StatusAcao, StatusAcao> = {
  pendente: "em_andamento",
  em_andamento: "concluida",
  concluida: "pendente",
};

export type Acao5w2hDTO = {
  id: string;
  oQue: string;
  porQue: string | null;
  onde: string | null;
  quando: string | null;
  quem: string | null;
  como: string | null;
  quantoCusta: string | null;
  status: StatusAcao;
};

export type PlanoComAcoes = {
  id: string;
  titulo: string;
  setorId: string | null;
  setorNome: string | null;
  acoes: Acao5w2hDTO[];
};

// ————— Ishikawa (6M) —————
export const CATEGORIAS_ISHIKAWA = [
  { id: "metodo", label: "Método" },
  { id: "maquina", label: "Máquina" },
  { id: "material", label: "Material" },
  { id: "mao_de_obra", label: "Mão de obra" },
  { id: "medicao", label: "Medição" },
  { id: "meio_ambiente", label: "Meio ambiente" },
] as const;

export type CategoriaIshikawa = (typeof CATEGORIAS_ISHIKAWA)[number]["id"];

export type CausaDTO = { id: string; categoria: CategoriaIshikawa; descricao: string };

export type IshikawaComCausas = {
  id: string;
  problema: string;
  setorId: string | null;
  setorNome: string | null;
  causas: CausaDTO[];
};

// ————— Matriz BCG —————
export type ItemBcgDTO = {
  id: string;
  nome: string;
  participacao: number | null;
  crescimento: number | null;
};

export type Quadrante = "estrela" | "interrogacao" | "vaca_leiteira" | "abacaxi";

export const ROTULO_QUADRANTE: Record<Quadrante, string> = {
  estrela: "Estrela",
  interrogacao: "Interrogação",
  vaca_leiteira: "Vaca leiteira",
  abacaxi: "Abacaxi",
};

/** Classifica um item na matriz (corte em 50 nos dois eixos). */
export function quadranteBcg(participacao: number, crescimento: number): Quadrante {
  const altaPart = participacao >= 50;
  const altoCresc = crescimento >= 50;
  if (altaPart && altoCresc) return "estrela";
  if (!altaPart && altoCresc) return "interrogacao";
  if (altaPart && !altoCresc) return "vaca_leiteira";
  return "abacaxi";
}

// ————— Comum —————
export type SetorOpcao = { id: string; nome: string };

/** Resumo agregado das ferramentas para o hub e o dashboard geral. */
export type ResumoFerramentas = {
  planos5w2h: number;
  acoes5w2h: number;
  acoesConcluidas: number;
  analisesIshikawa: number;
  causasIshikawa: number;
  itensBcg: number;
  porQuadrante: Record<Quadrante, number>;
};
