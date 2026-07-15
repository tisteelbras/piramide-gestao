import "server-only";
import { cache } from "react";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { plano5w2h, acao5w2h, recomendacao } from "@/db/schema";
import { situacaoPrazo, diasParaPrazo, resumoPlano } from "@/domain/plano-acao";
import type { AcaoDoPlano, PlanoDoSetor } from "./tipos";

export type { AcaoDoPlano, PlanoDoSetor } from "./tipos";

// Todas as ações de todos os planos 5W2H de um setor, achatadas numa lista
// única com a situação de prazo já calculada. É a visão de "o que este
// setor precisa fazer" — o outro lado do diagnóstico.
export const carregarPlanoDoSetor = cache(async (setorId: string): Promise<PlanoDoSetor> => {
  const planos = await db.query.plano5w2h.findMany({
    where: eq(plano5w2h.setorId, setorId),
    with: {
      acoes: { orderBy: (a, { asc }) => [asc(a.criadoEm)] },
    },
    orderBy: [desc(plano5w2h.criadoEm)],
  });

  // Recomendações do setor, para nomear a origem de cada ação.
  const recs = await db.query.recomendacao.findMany({ where: eq(recomendacao.setorId, setorId) });
  const tituloRec = new Map(recs.map((r) => [r.id, r.titulo]));

  const hoje = new Date();
  const acoes: AcaoDoPlano[] = planos.flatMap((p) =>
    p.acoes.map((a): AcaoDoPlano => {
      const base = { status: a.status, prazo: a.prazo, concluidaEm: a.concluidaEm };
      return {
        id: a.id,
        planoId: p.id,
        planoTitulo: p.titulo,
        oQue: a.oQue,
        quem: a.quem,
        prazo: a.prazo,
        status: a.status,
        concluidaEm: a.concluidaEm ? a.concluidaEm.toISOString() : null,
        situacao: situacaoPrazo(base, hoje),
        diasParaPrazo: diasParaPrazo(a.prazo, hoje),
        recomendacaoTitulo: a.recomendacaoId ? tituloRec.get(a.recomendacaoId) ?? null : null,
      };
    }),
  );

  // Ordena por urgência: atrasadas primeiro, depois vencendo, no prazo, sem
  // prazo, concluídas por último.
  const peso: Record<string, number> = { atrasada: 0, vence_em_breve: 1, no_prazo: 2, sem_prazo: 3, concluida: 4 };
  acoes.sort((a, b) => peso[a.situacao] - peso[b.situacao]);

  return {
    acoes,
    resumo: resumoPlano(planos.flatMap((p) => p.acoes.map((a) => ({ status: a.status, prazo: a.prazo, concluidaEm: a.concluidaEm })))),
  };
});
