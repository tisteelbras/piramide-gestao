"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { resposta } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
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
