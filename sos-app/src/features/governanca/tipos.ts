// Tipos e regras puras da governança de ciclos — sem banco, seguros
// para o cliente.

export type EstadoCiclo = "em_dia" | "alerta" | "atrasada";

export type PoliticaDTO = {
  periodicidadeDias: number;
  avisoDias: number;
  metaPadrao: number;
};

export const POLITICA_PADRAO: PoliticaDTO = {
  periodicidadeDias: 90,
  avisoDias: 15,
  metaPadrao: 80,
};

/** Situação do ciclo de avaliação de um setor (datas em ISO). */
export type CicloSetor = {
  setorId: string;
  setorNome: string;
  ultimoFechamento: string | null; // null = nunca fechou ciclo
  ultimoGeral: number | null;
  vencimento: string;
  diasRestantes: number;
  estado: EstadoCiclo;
  meta: number;
  geralAtual: number;
  /** Variação vs. último ciclo fechado (pontos percentuais). */
  tendencia: number | null;
};

export type PontoHistorico = { data: string; media: number };

export type GovernancaDTO = {
  politica: PoliticaDTO;
  ciclos: CicloSetor[];
  historico: PontoHistorico[];
};

const DIA_MS = 24 * 60 * 60 * 1000;

/** Vencimento e estado do ciclo: base = último fechamento (ou criação
 *  do setor, para o 1º ciclo) + periodicidade. */
export function situacaoCiclo(
  base: Date,
  periodicidadeDias: number,
  avisoDias: number,
  hoje: Date = new Date(),
): { vencimento: Date; diasRestantes: number; estado: EstadoCiclo } {
  const vencimento = new Date(base.getTime() + periodicidadeDias * DIA_MS);
  const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / DIA_MS);
  const estado: EstadoCiclo =
    diasRestantes < 0 ? "atrasada" : diasRestantes <= avisoDias ? "alerta" : "em_dia";
  return { vencimento, diasRestantes, estado };
}

export const ROTULO_ESTADO: Record<EstadoCiclo, string> = {
  em_dia: "Em dia",
  alerta: "Vence em breve",
  atrasada: "Atrasada",
};
