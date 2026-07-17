import "server-only";
import { cache } from "react";
import { eq, asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { fluxograma, noFluxograma, processo } from "@/db/schema";
import type { FluxogramaComNos, NoFluxo, ProcessoDisponivel } from "./tipos";

/**
 * Todos os fluxogramas de um setor, com seus nós (na ordem), e a lista de
 * processos do setor disponíveis para virar nó. Sem N+1.
 */
export const fluxogramasDoSetor = cache(async (setorId: string): Promise<{
  fluxogramas: FluxogramaComNos[];
  processos: ProcessoDisponivel[];
}> => {
  const [flx, procs] = await Promise.all([
    db.query.fluxograma.findMany({
      where: eq(fluxograma.setorId, setorId),
      orderBy: [asc(fluxograma.nome)],
    }),
    db.query.processo.findMany({
      where: eq(processo.setorId, setorId),
      orderBy: [asc(processo.nome)],
    }),
  ]);

  const ids = flx.map((f) => f.id);
  const nos = ids.length
    ? await db.query.noFluxograma.findMany({
        where: inArray(noFluxograma.fluxogramaId, ids),
        orderBy: [asc(noFluxograma.ordem)],
      })
    : [];

  const nomePorProcesso = new Map(procs.map((p) => [p.id, p.nome]));
  const nosPorFlux = new Map<string, NoFluxo[]>();
  for (const n of nos) {
    const lista = nosPorFlux.get(n.fluxogramaId) ?? [];
    lista.push({
      id: n.id,
      ordem: n.ordem,
      tipo: n.tipo,
      processoId: n.processoId,
      processoNome: n.processoId ? nomePorProcesso.get(n.processoId) ?? null : null,
      rotulo: n.rotulo,
      pergunta: n.pergunta,
      destinoNaoId: n.destinoNaoId,
    });
    nosPorFlux.set(n.fluxogramaId, lista);
  }

  return {
    fluxogramas: flx.map((f) => ({
      id: f.id,
      nome: f.nome,
      descricao: f.descricao,
      nos: nosPorFlux.get(f.id) ?? [],
    })),
    processos: procs.map((p) => ({ id: p.id, nome: p.nome, tipo: p.tipo })),
  };
});
