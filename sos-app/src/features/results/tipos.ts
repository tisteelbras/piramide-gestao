// Tipos puros do N4 — seguros para o cliente.
import type { RetratoEvolucao } from "@/domain/evolucao";

export type { RetratoEvolucao };

export type IndicadorItem = {
  id: string;
  nome: string;
  /** A área tem este KPI? ehAusencia = reconhece que precisa, mas ainda não
   *  o tem. O valor do KPI em si é medido fora do NEXO — o Resultado de KPI
   *  (N4) vem da maturidade do PROCESSO que persegue o indicador, não daqui. */
  ehAusencia: boolean;
  /** Processo de execução (N3) criado ao declarar o indicador. null nos
   *  indicadores antigos, criados antes desse vínculo. */
  processoId: string | null;
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
