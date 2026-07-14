// ————————————————————————————————————————————————
// Regra pura do KPI: transformar meta × valor atual em uma nota 0–100.
//
// No NEXO o KPI não é um enfeite: ele é a medida do resultado obtido.
// O atingimento é o quanto o valor real chegou perto da meta, respeitando
// o sentido do indicador — há KPI que quer subir (OTIF, conversão) e KPI
// que quer descer (retrabalho, atraso, custo).
//
// Sem banco, sem React — só a regra.
// ————————————————————————————————————————————————
export type DirecaoIndicador = "maior" | "menor";

export type IndicadorMedido = {
  meta: number | null;
  valorAtual: number | null;
  direcao: DirecaoIndicador;
  ehAusencia: boolean;
};

const limita = (n: number) => Math.max(0, Math.min(100, n));
const arred = (n: number) => Math.round(n * 10) / 10;

/**
 * Atingimento de um KPI, em 0–100.
 *
 * - Ausente → 0. Um indicador que a área reconhece que precisa ter, mas
 *   não mede, é resultado não obtido — não é "sem dado".
 * - Sem meta ou sem valor → null (ainda não medido; fica fora da média,
 *   e o motor conta como pendência).
 * - direcao "maior": valor ÷ meta. Bater a meta = 100; ultrapassar não
 *   passa de 100 (superar não compensa outro KPI ruim).
 * - direcao "menor": meta ÷ valor. Ficar abaixo da meta = 100.
 *
 * Metas em zero são tratadas com cuidado: em "menor", meta 0 só é atingida
 * com valor 0 (qualquer valor positivo = 0%). Em "maior", meta 0 não define
 * atingimento — devolve null em vez de dividir por zero.
 */
export function atingimentoKpi(i: IndicadorMedido): number | null {
  if (i.ehAusencia) return 0;
  if (i.meta == null || i.valorAtual == null) return null;

  const { meta, valorAtual, direcao } = i;

  if (direcao === "menor") {
    if (valorAtual <= meta) return 100; // dentro do teto (inclui 0 ≤ 0)
    if (meta <= 0) return 0; // teto zero e valor acima dele
    return arred(limita((meta / valorAtual) * 100));
  }

  if (meta <= 0) return null; // meta "maior é melhor" precisa de alvo > 0
  if (valorAtual <= 0) return 0;
  return arred(limita((valorAtual / meta) * 100));
}

/** Nota do tópico "Resultado de KPI" (N4): média dos KPIs que já têm
 *  medição — ou seja, os que devolvem atingimento. Sem nenhum medido,
 *  devolve null e o tópico não entra na média do nível. */
export function notaResultadoKpi(indicadores: IndicadorMedido[]): number | null {
  const notas = indicadores
    .map(atingimentoKpi)
    .filter((n): n is number => n !== null);
  if (!notas.length) return null;
  return arred(notas.reduce((a, b) => a + b, 0) / notas.length);
}
