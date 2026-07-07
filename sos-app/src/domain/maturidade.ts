// ————————————————————————————————————————————————
// Motor de cálculo de maturidade (regras determinísticas).
//
// Funções PURAS: recebem números, devolvem números. Sem banco, sem React.
// É aqui que hoje mora a "análise por regras"; quando a IA real (Claude)
// entrar, ela ACRESCENTA diagnóstico, sem substituir este cálculo.
//
// Convenção: todas as notas são normalizadas em 0–100.
// ————————————————————————————————————————————————

/** Faixas de maturidade a partir de um percentual 0–100. */
export type GrauMaturidade = "inicial" | "em_desenvolvimento" | "consolidado" | "referencia";

export function grauMaturidade(percentual: number): GrauMaturidade {
  if (percentual < 40) return "inicial";
  if (percentual < 65) return "em_desenvolvimento";
  if (percentual < 85) return "consolidado";
  return "referencia";
}

export const ROTULO_MATURIDADE: Record<GrauMaturidade, string> = {
  inicial: "Inicial",
  em_desenvolvimento: "Em desenvolvimento",
  consolidado: "Consolidado",
  referencia: "Referência",
};

/** Um item avaliado: nota (0–100 ou null se não respondido) e peso. */
export type ItemAvaliado = { nota: number | null; peso?: number };

/**
 * Média ponderada das notas respondidas.
 * Itens com nota null são ignorados na média (não pesam como zero).
 * Retorna null se nada foi respondido.
 */
export function mediaPonderada(itens: ItemAvaliado[]): number | null {
  let somaNotas = 0;
  let somaPesos = 0;
  for (const { nota, peso = 1 } of itens) {
    if (nota === null || Number.isNaN(nota)) continue;
    somaNotas += nota * peso;
    somaPesos += peso;
  }
  if (somaPesos === 0) return null;
  return arredonda(somaNotas / somaPesos);
}

/**
 * Percentual de conclusão: quantos itens foram respondidos (nota != null),
 * independente da nota. Alimenta o "quão preenchido" o nível fica.
 */
export function percentualConclusao(itens: ItemAvaliado[]): number {
  if (itens.length === 0) return 0;
  const respondidos = itens.filter((i) => i.nota !== null && !Number.isNaN(i.nota)).length;
  return arredonda((respondidos / itens.length) * 100);
}

/** Resultado consolidado de um nível da pirâmide. */
export type ResultadoNivel = {
  nota: number | null; // média ponderada das notas (0–100)
  conclusao: number; // % de itens respondidos (0–100)
  maturidade: GrauMaturidade; // faixa derivada da nota (ou 'inicial' se sem nota)
  preenchimento: number; // 0–100 usado para desenhar a pirâmide
};

/**
 * Consolida um nível. `preenchimento` combina nota e conclusão: um nível
 * com notas altas mas pouco respondido não deve aparecer "cheio".
 */
export function consolidaNivel(itens: ItemAvaliado[]): ResultadoNivel {
  const nota = mediaPonderada(itens);
  const conclusao = percentualConclusao(itens);
  const notaBase = nota ?? 0;
  // Preenchimento = nota descontada pela fração ainda não respondida.
  const preenchimento = arredonda((notaBase * conclusao) / 100);
  return {
    nota,
    conclusao,
    maturidade: grauMaturidade(notaBase),
    preenchimento,
  };
}

/**
 * Maturidade geral da área: média dos preenchimentos dos 4 níveis.
 * Recebe os quatro resultados na ordem visão→resultados.
 */
export function maturidadeGeral(niveis: ResultadoNivel[]): number {
  if (niveis.length === 0) return 0;
  const soma = niveis.reduce((a, n) => a + n.preenchimento, 0);
  return arredonda(soma / niveis.length);
}

/** Arredonda para 1 casa decimal, evitando ruído de ponto flutuante. */
function arredonda(n: number): number {
  return Math.round(n * 10) / 10;
}
