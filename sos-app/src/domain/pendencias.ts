// ————————————————————————————————————————————————
// "O que fazer hoje" — regra pura que consolida os sinais que já existem
// (situação dos ciclos de avaliação + ações atrasadas) numa lista única,
// ordenada por urgência. Não cria dado novo: junta o que estava espalhado
// por telas diferentes para a home responder "por onde começar?".
//
// Sem banco, sem React.
// ————————————————————————————————————————————————
export type TipoPendencia = "avaliacao_vencida" | "avaliacao_vencendo" | "acoes_atrasadas";

export type Pendencia = {
  tipo: TipoPendencia;
  setorId: string;
  setorNome: string;
  texto: string; // frase pronta para exibir
  // Para onde o clique leva (rota relativa).
  href: string;
  // Ordenação: menor = mais urgente.
  peso: number;
};

// Entradas — exatamente os campos que a home já carrega.
export type CicloEntrada = {
  setorId: string;
  setorNome: string;
  estado: "em_dia" | "alerta" | "atrasada";
  diasRestantes: number;
};
export type SetorEntrada = {
  id: string;
  nome: string;
  acoesAtrasadas: number;
};

const plural = (n: number, sing: string, plur: string) => (n === 1 ? sing : plur);

/**
 * Monta a lista de pendências do dia a partir dos ciclos e dos setores.
 * Ordena: avaliação vencida → ações atrasadas → avaliação vencendo.
 * Dentro de cada tipo, o mais urgente/numeroso primeiro.
 */
export function montarPendencias(
  ciclos: CicloEntrada[],
  setores: SetorEntrada[],
): Pendencia[] {
  const out: Pendencia[] = [];

  for (const c of ciclos) {
    if (c.estado === "atrasada") {
      const dias = Math.abs(c.diasRestantes);
      out.push({
        tipo: "avaliacao_vencida",
        setorId: c.setorId,
        setorNome: c.setorNome,
        texto: `Avaliação vencida há ${dias} ${plural(dias, "dia", "dias")}`,
        href: `/setor/${c.setorId}/avaliar`,
        // Mais dias vencida = mais urgente (peso menor).
        peso: 0 - dias / 1000,
      });
    } else if (c.estado === "alerta") {
      out.push({
        tipo: "avaliacao_vencendo",
        setorId: c.setorId,
        setorNome: c.setorNome,
        texto:
          c.diasRestantes <= 0
            ? "Avaliação vence hoje"
            : `Avaliação vence em ${c.diasRestantes} ${plural(c.diasRestantes, "dia", "dias")}`,
        href: `/setor/${c.setorId}/avaliar`,
        // Menos dias restantes = mais urgente.
        peso: 200 + c.diasRestantes,
      });
    }
  }

  for (const s of setores) {
    if (s.acoesAtrasadas > 0) {
      out.push({
        tipo: "acoes_atrasadas",
        setorId: s.id,
        setorNome: s.nome,
        texto: `${s.acoesAtrasadas} ${plural(s.acoesAtrasadas, "ação atrasada", "ações atrasadas")} no plano`,
        href: `/setor/${s.id}/plano`,
        // Mais ações atrasadas = mais urgente.
        peso: 100 - s.acoesAtrasadas / 1000,
      });
    }
  }

  return out.sort((a, b) => a.peso - b.peso);
}

export const COR_PENDENCIA: Record<TipoPendencia, string> = {
  avaliacao_vencida: "#c0392b",
  acoes_atrasadas: "#c0392b",
  avaliacao_vencendo: "#d98a00",
};

export const ICONE_PENDENCIA: Record<TipoPendencia, string> = {
  avaliacao_vencida: "⏰",
  avaliacao_vencendo: "⏳",
  acoes_atrasadas: "🔴",
};
