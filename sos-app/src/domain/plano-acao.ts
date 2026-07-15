// ————————————————————————————————————————————————
// Regras puras do PLANO DE AÇÃO — o que fecha o ciclo do NEXO.
//
// O diagnóstico aponta o problema e sugere a ação; o plano acompanha se a
// ação foi feita. Uma ação sem prazo é um desejo; com prazo, ela pode estar
// no prazo, vencendo ou atrasada — e é isso que faz o gestor voltar.
//
// Sem banco, sem React. "hoje" entra como parâmetro para ser testável e
// não depender do relógio da máquina.
// ————————————————————————————————————————————————
export type StatusAcao = "pendente" | "em_andamento" | "concluida";

/** Situação de prazo derivada — diferente do status de execução. Uma ação
 *  "em_andamento" pode estar "atrasada"; uma "concluida" nunca fica vermelha. */
export type SituacaoPrazo =
  | "concluida" // já foi feita — prazo não importa mais
  | "sem_prazo" // ninguém definiu quando — não dá para cobrar
  | "no_prazo" // tem folga
  | "vence_em_breve" // 3 dias ou menos
  | "atrasada"; // passou do prazo e não foi concluída

export type AcaoPlano = {
  status: StatusAcao;
  prazo: string | null; // ISO "YYYY-MM-DD" ou null
  concluidaEm: Date | string | null;
};

const DIA = 86_400_000;

/** Zera horas para comparar só a data (fuso local do servidor). */
function soData(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Dias até o prazo: negativo = atrasada, 0 = vence hoje. null sem prazo. */
export function diasParaPrazo(prazoIso: string | null, hoje = new Date()): number | null {
  if (!prazoIso) return null;
  const [a, m, d] = prazoIso.split("-").map(Number);
  if (!a || !m || !d) return null;
  const prazo = new Date(a, m - 1, d).getTime();
  return Math.round((prazo - soData(hoje)) / DIA);
}

export function situacaoPrazo(acao: AcaoPlano, hoje = new Date()): SituacaoPrazo {
  if (acao.status === "concluida" || acao.concluidaEm) return "concluida";
  const dias = diasParaPrazo(acao.prazo, hoje);
  if (dias === null) return "sem_prazo";
  if (dias < 0) return "atrasada";
  if (dias <= 3) return "vence_em_breve";
  return "no_prazo";
}

export type ResumoPlano = {
  total: number;
  pendentes: number;
  emAndamento: number;
  concluidas: number;
  atrasadas: number;
  vencendo: number;
  semPrazo: number;
  /** % de ações concluídas — o "quanto do plano saiu do papel". */
  progresso: number;
};

export function resumoPlano(acoes: AcaoPlano[], hoje = new Date()): ResumoPlano {
  const r: ResumoPlano = {
    total: acoes.length, pendentes: 0, emAndamento: 0, concluidas: 0,
    atrasadas: 0, vencendo: 0, semPrazo: 0, progresso: 0,
  };
  for (const a of acoes) {
    if (a.status === "pendente") r.pendentes++;
    else if (a.status === "em_andamento") r.emAndamento++;
    else if (a.status === "concluida") r.concluidas++;

    const sit = situacaoPrazo(a, hoje);
    if (sit === "atrasada") r.atrasadas++;
    else if (sit === "vence_em_breve") r.vencendo++;
    else if (sit === "sem_prazo") r.semPrazo++;
  }
  r.progresso = r.total ? Math.round((r.concluidas / r.total) * 100) : 0;
  return r;
}

export const ROTULO_SITUACAO: Record<SituacaoPrazo, string> = {
  concluida: "Concluída",
  sem_prazo: "Sem prazo",
  no_prazo: "No prazo",
  vence_em_breve: "Vence em breve",
  atrasada: "Atrasada",
};

/** Cores da situação — verde feito, cinza sem prazo, azul no prazo,
 *  âmbar vencendo, vermelho atrasada. Casam com a paleta do NEXO. */
export const COR_SITUACAO: Record<SituacaoPrazo, string> = {
  concluida: "#33853a",
  sem_prazo: "#8493a0",
  no_prazo: "#0068a9",
  vence_em_breve: "#d98a00",
  atrasada: "#c0392b",
};
