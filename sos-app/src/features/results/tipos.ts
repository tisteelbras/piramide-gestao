// Tipos puros do N4 — seguros para o cliente.
import type { DirecaoIndicador } from "@/domain/indicadores";

export type { DirecaoIndicador };

export type IndicadorItem = {
  id: string;
  nome: string;
  unidade: string | null;
  meta: number | null;
  valorAtual: number | null;
  direcao: DirecaoIndicador;
  ehAusencia: boolean;
  /** Atingimento 0–100 calculado no servidor (valor × meta, respeitando a
   *  direção). null = ainda não medido. Alimenta "Resultado de KPI" no N4. */
  atingimento: number | null;
};

export type RecomendacaoItem = {
  id: string;
  titulo: string;
  detalhe: string | null;
  prioridade: number;
  impactoEsperado: string | null;
};

export type ResultadosDoSetor = {
  indicadores: IndicadorItem[];
  recomendacoes: RecomendacaoItem[];
};
