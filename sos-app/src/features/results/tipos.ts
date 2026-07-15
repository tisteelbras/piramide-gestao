// Tipos puros do N4 — seguros para o cliente.
import type { DirecaoIndicador } from "@/domain/indicadores";
import type { RetratoEvolucao } from "@/domain/evolucao";

export type { DirecaoIndicador };
export type { RetratoEvolucao };

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
  /** "regra" (determinística) ou "ia" (análise cruzada). A UI marca as de
   *  IA com um selo. */
  origem: "regra" | "ia";
  /** Frase "avisado há N ciclos" quando a recomendação persiste entre
   *  fechamentos. null quando é nova ou não há ciclo anterior. */
  persistencia: string | null;
};

export type ResultadosDoSetor = {
  indicadores: IndicadorItem[];
  recomendacoes: RecomendacaoItem[];
  /** Comparação com o último ciclo fechado. null = nunca houve fechamento
   *  (primeiro uso) — a UI mostra só o estado atual. */
  evolucao: RetratoEvolucao | null;
};
