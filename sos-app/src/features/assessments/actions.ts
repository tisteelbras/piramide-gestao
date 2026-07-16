"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { resposta, avaliacao } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { normalizaFerramentas, TODAS_FERRAMENTAS } from "@/domain/ferramentas-analise";
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
 * Salva a escolha de ferramentas da análise. "completa" liga todas;
 * "parcial" grava só as escolhidas (normalizadas contra o catálogo). A
 * escolha pode ser refeita a qualquer momento pelo mesmo painel.
 */
export async function salvarFerramentasAnalise(
  avaliacaoId: string,
  modo: "completa" | "parcial",
  escolhidas: string[] = [],
) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const lista = modo === "completa" ? [...TODAS_FERRAMENTAS] : normalizaFerramentas(escolhidas);
  await db.update(avaliacao)
    .set({ ferramentasHabilitadas: lista, atualizadoEm: new Date() })
    .where(eq(avaliacao.id, avaliacaoId));
  revalidatePath("/setor/[id]/avaliar", "page");
  revalidatePath("/setor/[id]", "page");
  return { ok: true as const, total: lista.length };
}
