"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { resposta, avaliacao } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  normalizaFerramentas,
  TODAS_FERRAMENTAS,
  ferramentasVinculadas,
  type FerramentaAnalise,
} from "@/domain/ferramentas-analise";
import type { StatusResposta } from "./tipos";

/** Salva (upsert) a resposta de um critério dentro de uma avaliação. */
export async function salvarResposta(input: {
  avaliacaoId: string;
  criterioId: string;
  nota: number | null;
  status: StatusResposta;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");

  const { avaliacaoId, criterioId, nota, status } = input;
  const notaStr = nota == null ? null : String(nota);

  const existente = await db.query.resposta.findFirst({
    where: and(eq(resposta.avaliacaoId, avaliacaoId), eq(resposta.criterioId, criterioId)),
  });

  if (existente) {
    await db
      .update(resposta)
      .set({ nota: notaStr, status, atualizadoEm: new Date() })
      .where(eq(resposta.id, existente.id));
  } else {
    await db.insert(resposta).values({ avaliacaoId, criterioId, nota: notaStr, status });
  }

  revalidatePath("/setor/[id]", "page");
  revalidatePath("/setor/[id]/avaliar", "page");
  return { ok: true as const };
}

/**
 * Liga/desliga UMA ferramenta desta análise, direto na etapa da Visão. O
 * gestor responsável (quem avalia o setor) decide caso a caso.
 *
 * `ferramentasHabilitadas === null` significa "escolha nunca feita" → todas
 * ligadas: no primeiro toggle materializamos a lista completa e então
 * aplicamos a mudança, para não desligar tudo sem querer.
 *
 * Vínculos: ferramentas que andam juntas (Objetivos ↔ BSC) ligam/desligam
 * em conjunto — a regra vive em ferramentasVinculadas().
 */
export async function toggleFerramentaAnalise(
  avaliacaoId: string,
  ferramenta: FerramentaAnalise,
  ligar: boolean,
) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");

  const aval = await db.query.avaliacao.findFirst({ where: eq(avaliacao.id, avaliacaoId) });
  if (!aval) throw new Error("Avaliação não encontrada.");

  // Base: null (nunca escolhida) = todas ligadas.
  const base = aval.ferramentasHabilitadas === null
    ? new Set<FerramentaAnalise>(TODAS_FERRAMENTAS)
    : new Set<FerramentaAnalise>(normalizaFerramentas(aval.ferramentasHabilitadas));

  // Aplica a ferramenta e todas as vinculadas a ela, no mesmo sentido.
  for (const f of ferramentasVinculadas(ferramenta)) {
    if (ligar) base.add(f); else base.delete(f);
  }
  // Preserva a ordem do catálogo.
  const lista = TODAS_FERRAMENTAS.filter((f) => base.has(f));

  await db.update(avaliacao)
    .set({ ferramentasHabilitadas: lista, atualizadoEm: new Date() })
    .where(eq(avaliacao.id, avaliacaoId));
  revalidatePath("/setor/[id]/avaliar", "page");
  revalidatePath("/setor/[id]", "page");
  return { ok: true as const, total: lista.length };
}
