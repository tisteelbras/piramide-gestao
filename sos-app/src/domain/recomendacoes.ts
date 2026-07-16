// ————————————————————————————————————————————————
// Motor de recomendações por REGRA (determinístico).
// Recebe um retrato do setor e devolve recomendações priorizadas.
// Quando a IA real entrar, ela ACRESCENTA recomendações (origem 'ia'),
// sem substituir estas regras.
//
// Prioridade: 1 = mais urgente ... 5 = menos.
// ————————————————————————————————————————————————
import type { Nivel } from "@/features/assessments/tipos";

export type RecomendacaoGerada = {
  titulo: string;
  detalhe: string;
  prioridade: number;
  impactoEsperado: string;
};

export type RetratoSetor = {
  // Maturidade (preenchimento 0–100) por nível.
  maturidadePorNivel: Record<Nivel, number>;
  // Sistemas marcados como necessidade (não existem, mas são precisos).
  sistemasFaltantes: string[];
  // KPIs marcados como ausentes.
  kpisAusentes: string[];
  // KPIs cadastrados sem meta ou sem valor atual — declarados, mas sem medição.
  kpisSemMedicao: string[];
  // KPIs medidos longe da meta: { nome, atingimento }.
  kpisAbaixoDaMeta: { nome: string; atingimento: number }[];
  // Processos com média baixa: { nome, media }.
  processosFracos: { nome: string; media: number }[];
  // Colaboradores com média baixa: nomes.
  colaboradoresBaixaMedia: string[];
  // Check obrigatório da Estrutura Organizacional ainda não confirmado.
  politicaComercialFaltante?: boolean;
};

const ROTULO_NIVEL: Record<Nivel, string> = {
  visao: "Visão",
  tatico: "Recursos",
  processos: "Processos",
  resultados: "Resultados",
};

export function gerarRecomendacoes(r: RetratoSetor): RecomendacaoGerada[] {
  const recs: RecomendacaoGerada[] = [];

  // Regra 0: Política Comercial é obrigatória — sem o check confirmado,
  // vira a recomendação mais prioritária do setor.
  if (r.politicaComercialFaltante) {
    recs.push({
      titulo: "Formalizar a Política Comercial",
      detalhe: "A Política Comercial é obrigatória e ainda não foi confirmada na etapa Estrutura Organizacional. Sem ela, regras de preço, desconto e atendimento ficam no improviso.",
      prioridade: 1,
      impactoEsperado: "Padronização das decisões comerciais e conformidade da estrutura.",
    });
  }

  // Regra 1: sistema necessário ausente → implementar (alta prioridade).
  for (const s of r.sistemasFaltantes) {
    recs.push({
      titulo: `Implementar sistema: ${s}`,
      detalhe: `O setor indicou "${s}" como necessário, mas ele não está em uso. A ausência limita a eficiência e o controle.`,
      prioridade: 1,
      impactoEsperado: "Ganho de eficiência operacional e redução de retrabalho.",
    });
  }

  // Regra 2: KPI ausente cruzado com sistema faltante.
  for (const k of r.kpisAusentes) {
    const temSistemaRelacionado = r.sistemasFaltantes.length > 0;
    recs.push({
      titulo: `Definir e medir o indicador: ${k}`,
      detalhe: temSistemaRelacionado
        ? `O indicador "${k}" está ausente. Como há sistemas faltantes, provavelmente falta a fonte de dados — priorize a ferramenta que o alimenta.`
        : `O indicador "${k}" está ausente. Defina meta, fonte e periodicidade de medição.`,
      prioridade: 2,
      impactoEsperado: "Visibilidade de desempenho e decisão baseada em dados.",
    });
  }

  // Regra 2b: KPI declarado mas sem medição (falta meta ou valor atual).
  // Diferente do ausente: aqui a área SABE o que medir e ainda não mede.
  for (const k of r.kpisSemMedicao) {
    recs.push({
      titulo: `Medir o indicador: ${k}`,
      detalhe: `O indicador "${k}" está cadastrado, mas sem meta ou sem valor atual — então ele não mede nada. Defina a meta, a fonte do dado e a periodicidade.`,
      prioridade: 2,
      impactoEsperado: "O indicador passa a gerar resultado e entra no nível Resultados.",
    });
  }

  // Regra 2c: KPI medido, mas longe da meta → é aqui que o resultado dói.
  for (const k of r.kpisAbaixoDaMeta) {
    recs.push({
      titulo: `Recuperar o indicador: ${k.nome}`,
      detalhe: `"${k.nome}" está em ${k.atingimento}% da meta. Investigue a causa raiz antes de mudar a meta — o número é sintoma, não doença.`,
      prioridade: k.atingimento < 50 ? 1 : 2,
      impactoEsperado: "Resultado de KPI mais alto e meta ao alcance.",
    });
  }

  // Regra 3: nível com maturidade baixa (<40) → foco estratégico.
  for (const nivel of Object.keys(r.maturidadePorNivel) as Nivel[]) {
    const m = r.maturidadePorNivel[nivel];
    if (m < 40) {
      recs.push({
        titulo: `Elevar a maturidade de ${ROTULO_NIVEL[nivel]}`,
        detalhe: `O nível ${ROTULO_NIVEL[nivel]} está em ${Math.round(m)}% — abaixo do mínimo saudável. Concentre um plano de ação neste nível.`,
        prioridade: m < 20 ? 1 : 3,
        impactoEsperado: "Base mais sólida para os demais níveis da pirâmide.",
      });
    }
  }

  // Regra 4: processos fracos.
  for (const p of r.processosFracos) {
    recs.push({
      titulo: `Revisar o processo: ${p.nome}`,
      detalhe: `O processo "${p.nome}" tem média ${p.media}. Padronize, documente e defina responsáveis.`,
      prioridade: 3,
      impactoEsperado: "Menos variação e mais previsibilidade na operação.",
    });
  }

  // Regra 5: pessoas com baixa média.
  if (r.colaboradoresBaixaMedia.length > 0) {
    recs.push({
      titulo: "Plano de desenvolvimento para a equipe",
      detalhe: `Colaboradores com avaliação baixa: ${r.colaboradoresBaixaMedia.join(", ")}. Estruture treinamento e acompanhamento.`,
      prioridade: 2,
      impactoEsperado: "Aumento de desempenho e engajamento da equipe.",
    });
  }

  // Ordena por prioridade (1 primeiro).
  return recs.sort((a, b) => a.prioridade - b.prioridade);
}
