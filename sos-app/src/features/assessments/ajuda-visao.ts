// Explicação de cada etapa da Visão — texto de apoio ao gestor, exibido
// no ícone "?" ao lado do título. A chave casa pelo INÍCIO do título
// (o nome da capacidade), pois o título vem do banco e traz a pergunta
// entre parênteses.

const AJUDA: Array<{ prefixo: string; texto: string }> = [
  {
    prefixo: "Estrutura Organizacional",
    texto:
      "O organograma da área: quem responde a quem, quais são os cargos e como o time se organiza. Sem isso definido, ninguém sabe quem decide o quê.",
  },
  {
    prefixo: "Identidade Organizacional",
    texto:
      "O propósito e os valores do setor: por que a área existe e o que ela representa dentro da empresa. É a base cultural que orienta as decisões do dia a dia.",
  },
  {
    prefixo: "Direcionamento Estratégico",
    texto:
      "Para onde a área vai nos próximos ciclos: a estratégia definida e — o mais importante — comunicada à equipe, de forma que todos saibam o rumo.",
  },
  {
    prefixo: "Modelo Operacional",
    texto:
      "Como a área funciona na prática: as responsabilidades distribuídas e os processos mapeados. Define o funcionamento cotidiano, não a estratégia.",
  },
  {
    prefixo: "Gestão por Objetivos",
    texto:
      "As metas do setor, alinhadas às metas da empresa. Traduz a estratégia em entregas concretas e mensuráveis pelas quais a área responde.",
  },
  {
    prefixo: "Diretrizes Operacionais",
    texto:
      "Os padrões que a área segue — qualidade, prazo, eficiência. São os critérios que definem o que é um trabalho bem feito aqui.",
  },
  {
    prefixo: "Gestão de Competências",
    texto:
      "Quem executa e como evolui: o mapa de talentos e competências do time, com o desenvolvimento das pessoas que sustentam a operação.",
  },
];

/** Texto de ajuda de uma etapa da Visão, ou null se não houver. */
export function ajudaDaEtapa(titulo: string): string | null {
  const achado = AJUDA.find((a) => titulo.startsWith(a.prefixo));
  return achado?.texto ?? null;
}
