// Tipos puros do plano de ação por setor — seguros para o cliente.
import type { SituacaoPrazo, ResumoPlano, StatusAcao } from "@/domain/plano-acao";

export type { SituacaoPrazo, ResumoPlano, StatusAcao };

export type AcaoDoPlano = {
  id: string;
  planoId: string;
  planoTitulo: string;
  oQue: string;
  quem: string | null;
  prazo: string | null; // ISO "YYYY-MM-DD"
  status: StatusAcao;
  concluidaEm: string | null;
  situacao: SituacaoPrazo;
  diasParaPrazo: number | null;
  // De qual recomendação do diagnóstico esta ação nasceu (se nasceu).
  recomendacaoTitulo: string | null;
};

export type PlanoDoSetor = {
  acoes: AcaoDoPlano[];
  resumo: ResumoPlano;
};
