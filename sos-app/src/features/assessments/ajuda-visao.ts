// Conteúdo de ajuda da Visão — exibido no popup do "?" de cada etapa,
// e na introdução do nível.
//
// Princípio que organiza tudo isto: a VISÃO nunca pergunta "isso está
// dando certo?", e sim "isso foi concebido e estruturado?". A execução é
// medida em Processos; a capacidade, em Recursos; o impacto, em Resultados.

export type BlocoAjuda =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "lista"; titulo?: string; itens: string[] }
  | { tipo: "destaque"; texto: string };

export type AjudaEtapa = {
  prefixo: string; // casa pelo início do título (que vem do banco)
  titulo: string;
  perguntaChave: string;
  blocos: BlocoAjuda[];
};

// ————————————— Introdução do nível Visão —————————————
export const INTRO_VISAO: { titulo: string; blocos: BlocoAjuda[] } = {
  titulo: "O que a Visão mede",
  blocos: [
    {
      tipo: "destaque",
      texto:
        "A Visão nunca pergunta “isso está dando certo?”. Ela pergunta “isso foi concebido e estruturado?”.",
    },
    {
      tipo: "paragrafo",
      texto:
        "Cada nível da pirâmide faz uma pergunta diferente. É essa separação que impede as dimensões de se contaminarem:",
    },
    {
      tipo: "lista",
      itens: [
        "Visão pergunta: “Isso foi concebido e estruturado?”",
        "Recursos perguntam: “Temos capacidade para executar?”",
        "Processos perguntam: “Estamos executando com disciplina?”",
        "Resultados perguntam: “Estamos gerando o impacto esperado?”",
      ],
    },
    {
      tipo: "paragrafo",
      texto:
        "Por isso a Visão é um checklist de concepção: cada etapa é marcada como revisada quando a capacidade está definida e estruturada — não quando está funcionando bem. O funcionamento é medido adiante.",
    },
  ],
};

// ————————————— Ajuda de cada etapa —————————————
export const AJUDA_ETAPAS: AjudaEtapa[] = [
  {
    prefixo: "Estrutura Organizacional",
    titulo: "Estrutura Organizacional",
    perguntaChave: "As pessoas sabem quem faz o quê?",
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "Avalia se a organização possui uma estrutura clara, com funções, responsabilidades e níveis de autoridade bem definidos, proporcionando organização e evitando sobreposição de atividades.",
      },
      {
        tipo: "lista",
        titulo: "O que considerar",
        itens: [
          "Organograma atualizado",
          "Papéis e responsabilidades definidos",
          "Hierarquia clara",
          "Gestão à vista ou mural",
        ],
      },
    ],
  },
  {
    prefixo: "Identidade Organizacional",
    titulo: "Identidade Organizacional",
    perguntaChave: "Todos entendem quem somos e por que existimos?",
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "Avalia se o setor possui propósito, valores e cultura claramente definidos e compartilhados entre as pessoas, criando alinhamento na forma de pensar e agir.",
      },
      {
        tipo: "lista",
        titulo: "O que considerar",
        itens: [
          "Propósito do setor — a equipe entende por que o setor existe e qual valor entrega",
          "Missão e valores — os princípios que orientam as decisões são claros e conhecidos",
          "Cultura organizacional — os comportamentos do dia a dia refletem os valores definidos",
        ],
      },
      {
        tipo: "destaque",
        texto:
          "No NEXO, apresente um documento que comprove a compreensão do time acerca da identidade.",
      },
    ],
  },
  {
    prefixo: "Direcionamento Estratégico",
    titulo: "Direcionamento Estratégico",
    perguntaChave: "Para onde queremos ir?",
    blocos: [
      {
        tipo: "paragrafo",
        texto: "É sobre visão de futuro: o rumo que a área persegue.",
      },
      {
        tipo: "lista",
        titulo: "Exemplos",
        itens: [
          "Crescer no agronegócio",
          "Ser referência em atendimento",
          "Expandir para o mercado internacional",
          "Tornar-se líder em determinado segmento",
        ],
      },
    ],
  },
  {
    prefixo: "Governança Operacional",
    titulo: "Governança Operacional",
    perguntaChave:
      "A operação está organizada para funcionar de forma consistente, independente das pessoas?",
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "A Governança Operacional representa a capacidade do setor de organizar, controlar e sustentar sua operação por meio de regras, responsabilidades, processos e mecanismos de acompanhamento. Seu objetivo é garantir que o trabalho seja executado de forma previsível, padronizada e com qualidade, reduzindo dependências individuais e aumentando a confiabilidade da operação.",
      },
      {
        tipo: "destaque",
        texto:
          "Não confunda com Processos. Processos pergunta “Como fazemos esta atividade?”. Governança pergunta “Como garantimos que esta atividade continuará sendo feita da forma correta?”.",
      },
      {
        tipo: "lista",
        titulo: "O que a Governança responde",
        itens: [
          "Quem é responsável por cada atividade?",
          "Como essa atividade deve ser executada?",
          "Quem acompanha se ela está sendo feita corretamente?",
          "O que acontece quando algo sai do padrão?",
          "Como garantimos que o processo continue funcionando mesmo quando as pessoas mudam?",
        ],
      },
      {
        tipo: "lista",
        titulo: "1. Responsabilidades — estão claramente definidas?",
        itens: [
          "Papéis claros",
          "Responsáveis por cada atividade",
          "Autonomia para decisão",
          "Prestação de contas",
        ],
      },
      {
        tipo: "lista",
        titulo: "2. Padronização — existe uma forma oficial de executar o trabalho?",
        itens: [
          "Procedimentos",
          "Instruções de trabalho",
          "Fluxos documentados",
          "Critérios de execução",
        ],
      },
      {
        tipo: "lista",
        titulo: "3. Controles operacionais — existe acompanhamento da execução?",
        itens: [
          "Checklists",
          "Auditorias",
          "Validações e revisões",
          "Controles preventivos",
        ],
      },
      {
        tipo: "lista",
        titulo: "4. Sustentabilidade — a operação depende das pessoas ou do sistema de gestão?",
        itens: [
          "Continuidade",
          "Transferência de conhecimento",
          "Documentação",
          "Sucessão e estabilidade",
        ],
      },
      {
        tipo: "destaque",
        texto:
          "Baixa maturidade soa assim: “ninguém sabe quem deveria resolver”. Alta maturidade: a empresa funciona mesmo quando alguém entra de férias.",
      },
    ],
  },
  // "Gestão por Objetivos" saiu da Visão: só se faz depois que os processos
  // estão alinhados, então é resultado, não concepção. Virou um tipo de
  // processo (gestao_objetivos) — ver features/processes/tipos.ts.
  {
    prefixo: "Indicadores de Desempenho",
    titulo: "Indicadores de Desempenho",
    perguntaChave: "Como medimos?",
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "Os indicadores (KPIs) que dizem se a área está entregando o que deve — OTIF, conversão, retrabalho, prazo. Cada indicador cadastrado aqui vira um processo mensurável e alimenta automaticamente o Resultado de KPI na pirâmide.",
      },
      {
        tipo: "lista",
        titulo: "O que considerar",
        itens: [
          "Cada indicador com sua meta e valor atual",
          "Sentido: quanto maior é melhor (OTIF) ou quanto menor (retrabalho)",
          "Poucos indicadores que realmente importam, não uma lista enorme",
        ],
      },
      {
        tipo: "destaque",
        texto:
          "É aqui que se define COMO a área se mede. O que você cadastra nesta etapa aparece sozinho em Processos e em Resultados.",
      },
    ],
  },
  {
    prefixo: "Gestão de Competências",
    titulo: "Gestão de Competências",
    perguntaChave: "As pessoas têm capacidade para entregar os resultados esperados?",
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "Avalia se os colaboradores possuem as competências técnicas e comportamentais necessárias para exercer suas funções e evoluir continuamente.",
      },
      {
        tipo: "lista",
        titulo: "O que considerar",
        itens: [
          "Competências técnicas",
          "Desenvolvimento",
          "Alinhamento cultural",
          "Performance",
        ],
      },
    ],
  },
];

/** Ajuda de uma etapa da Visão pelo título (que vem do banco), ou null. */
export function ajudaDaEtapa(titulo: string): AjudaEtapa | null {
  return AJUDA_ETAPAS.find((a) => titulo.startsWith(a.prefixo)) ?? null;
}
