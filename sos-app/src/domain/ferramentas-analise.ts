// ————————————————————————————————————————————————
// Catálogo das FERRAMENTAS DA ANÁLISE — as ferramentas atreladas às etapas
// da Visão que o gestor pode habilitar ao iniciar a avaliação do setor.
//
// A escolha é por avaliação: "análise completa" liga todas; "análise
// parcial" liga só as escolhidas. Ferramenta desabilitada não aparece nas
// etapas (o link some). O Organograma fica fora do catálogo de propósito —
// é estrutural demais para ser opcional.
//
// Sem banco, sem React.
// ————————————————————————————————————————————————
export type FerramentaAnalise =
  | "objetivos"
  | "swot"
  | "bsc"
  | "indicadores"
  | "raci"
  | "mapa"
  | "controles"
  | "sucessao";

export const FERRAMENTAS_ANALISE: {
  id: FerramentaAnalise;
  nome: string;
  etapa: string; // prefixo do título da etapa da Visão onde ela aparece
  descricao: string;
  icone: string;
}[] = [
  { id: "objetivos", nome: "Objetivos Estratégicos", etapa: "Direcionamento Estratégico", icone: "🎯",
    descricao: "Objetivos com meta, prazo e status — o \"para onde vamos\"." },
  { id: "swot", nome: "Análise SWOT", etapa: "Direcionamento Estratégico", icone: "⚡",
    descricao: "Forças, Fraquezas, Oportunidades e Ameaças da área." },
  { id: "bsc", nome: "Mapa Estratégico (BSC)", etapa: "Direcionamento Estratégico", icone: "🗺️",
    descricao: "Os objetivos nas 4 perspectivas do Balanced Scorecard." },
  { id: "indicadores", nome: "Indicadores de Desempenho", etapa: "Indicadores de Desempenho", icone: "📊",
    descricao: "KPIs que viram processo e alimentam o Resultado." },
  { id: "raci", nome: "Matriz RACI", etapa: "Governança Operacional", icone: "⊞",
    descricao: "Quem executa, aprova, é consultado e informado." },
  { id: "mapa", nome: "Mapa de Processos", etapa: "Governança Operacional", icone: "⇉",
    descricao: "A forma oficial de executar o trabalho." },
  { id: "controles", nome: "Controles Operacionais", etapa: "Governança Operacional", icone: "☑",
    descricao: "Checklist do que acompanha a execução." },
  { id: "sucessao", nome: "Matriz de Sucessão", etapa: "Governança Operacional", icone: "🔑",
    descricao: "Quem domina o quê — risco de continuidade (bus factor)." },
];

export const TODAS_FERRAMENTAS: FerramentaAnalise[] = FERRAMENTAS_ANALISE.map((f) => f.id);

/** Normaliza a lista vinda do banco: só ids válidos, sem duplicatas. */
export function normalizaFerramentas(lista: unknown): FerramentaAnalise[] {
  if (!Array.isArray(lista)) return [];
  const validas = new Set(TODAS_FERRAMENTAS);
  return [...new Set(lista.filter((x): x is FerramentaAnalise => typeof x === "string" && validas.has(x as FerramentaAnalise)))];
}

/**
 * A ferramenta está habilitada nesta análise?
 * `habilitadas = null` → escolha ainda não feita: mostramos TUDO
 * (compatibilidade com avaliações antigas, de antes desta funcionalidade).
 */
export function ferramentaAtiva(
  habilitadas: FerramentaAnalise[] | null,
  ferramenta: FerramentaAnalise,
): boolean {
  if (habilitadas === null) return true;
  return habilitadas.includes(ferramenta);
}
