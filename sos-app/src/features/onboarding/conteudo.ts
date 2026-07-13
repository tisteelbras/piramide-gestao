// Conteúdo institucional do NEXO — fonte única usada pelo popup de
// boas-vindas (resumo), pela página /sobre (texto integral) e pelo
// banner da tela inicial.

export const TAGLINE = "Onde estratégia, execução e resultados se conectam.";

export const RESUMO_CONCEITO =
  "O NEXO mede a coerência entre Visão, Recursos, Processos e Resultados — a cadeia que sustenta a gestão — e mostra onde agir para a maturidade de cada setor evoluir de forma estruturada e mensurável.";

// ————— Texto integral (página /sobre) —————
export const MANIFESTO_ABERTURA: string[] = [
  "Toda organização produz exatamente os resultados que seu modelo de gestão é capaz de gerar. Quando há desalinhamento entre estratégia, recursos, processos e indicadores, surgem desperdícios, retrabalho, baixa performance e decisões pouco consistentes.",
  "O NEXO foi desenvolvido para tornar essas conexões visíveis.",
  "Mais do que uma ferramenta de diagnóstico, é uma metodologia de avaliação de maturidade que permite analisar organizações, departamentos, projetos ou iniciativas sob uma lógica única: verificar se existe coerência entre aquilo que se pretende alcançar e a capacidade real de entregar resultados.",
  "Seu modelo está estruturado sobre quatro dimensões fundamentais da gestão:",
];

export const DIMENSOES_NEXO: { nome: string; descricao: string }[] = [
  { nome: "Visão", descricao: "Define o propósito, a direção e os objetivos que orientam a organização." },
  { nome: "Recursos", descricao: "Avaliam se pessoas, estrutura, tecnologia, conhecimento e investimentos são compatíveis com os desafios propostos." },
  { nome: "Processos", descricao: "Transformam recursos em execução consistente por meio de métodos, governança e padronização." },
  { nome: "Resultados", descricao: "Mensuram o desempenho, validam a efetividade das ações e orientam a melhoria contínua." },
];

export const CADEIA_NEXO = "VISÃO → RECURSOS → PROCESSOS → RESULTADOS";

export const MANIFESTO_FECHAMENTO: string[] = [
  "Essas dimensões não funcionam de forma isolada. Formam uma cadeia lógica de dependência, na qual cada etapa sustenta a seguinte.",
  "É justamente dessa conexão que nasce o nome da metodologia.",
  "Derivada do latim nexus — ligação, elo ou conexão —, a palavra NEXO representa o princípio central da gestão: resultados consistentes são consequência da integração entre estratégia, capacidade de execução e disciplina operacional.",
  "Ao identificar rupturas nessa cadeia, o NEXO evidencia oportunidades de evolução, direciona prioridades e fortalece a tomada de decisão. O resultado é uma visão clara da maturidade organizacional, permitindo que o desenvolvimento ocorra de forma estruturada, mensurável e sustentável.",
];

// ————— Resumo do manifesto (popup de boas-vindas) —————
export const SECOES_SOBRE: { emoji: string; titulo: string; texto: string }[] = [
  {
    emoji: "🧭",
    titulo: "Onde tudo se conecta",
    texto:
      "Toda organização produz exatamente os resultados que seu modelo de gestão é capaz de gerar. O NEXO torna visíveis as conexões entre estratégia, recursos, processos e indicadores — e mostra onde elas se rompem, gerando desperdício, retrabalho e decisões inconsistentes.",
  },
  {
    emoji: "🔺",
    titulo: "As 4 dimensões da gestão",
    texto:
      "Visão define o propósito e a direção. Recursos avaliam se pessoas, estrutura e tecnologia são compatíveis com o desafio. Processos transformam recursos em execução consistente. Resultados mensuram o desempenho e orientam a melhoria contínua.",
  },
  {
    emoji: "🔗",
    titulo: "A cadeia que dá nome ao método",
    texto:
      "VISÃO → RECURSOS → PROCESSOS → RESULTADOS: cada etapa sustenta a seguinte. Do latim nexus (ligação, elo), o NEXO parte do princípio de que resultados consistentes são consequência da integração entre estratégia, capacidade de execução e disciplina operacional.",
  },
  {
    emoji: "⚡",
    titulo: "Diagnóstico que vira ação",
    texto:
      "Cada setor é avaliado nas 4 dimensões. O diagnóstico identifica as rupturas da cadeia e devolve recomendações priorizadas — que se transformam, com um clique, em planos de ação 5W2H ou análises de causa raiz (Ishikawa).",
  },
  {
    emoji: "📅",
    titulo: "Evolução estruturada e mensurável",
    texto:
      "A direção define o ritmo dos ciclos de avaliação e as metas de maturidade. Cada fechamento de ciclo fotografa a empresa e alimenta o histórico — assim o desenvolvimento acontece de forma estruturada, mensurável e sustentável.",
  },
];
