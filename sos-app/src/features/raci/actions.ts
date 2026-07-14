"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { atribuicaoRaci } from "@/db/schema";
import { auth } from "@/auth";
import type { PapelRaci } from "./tipos";

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
}

const refresh = (setorId: string) => {
  revalidatePath(`/setor/${setorId}/raci`, "page");
  revalidatePath("/setor/[id]", "page");
};

/**
 * Define (ou limpa) o papel de uma pessoa numa atividade.
 * papel = null remove a atribuição. Como a célula é única por
 * (processo, colaborador), um novo papel substitui o anterior.
 */
export async function definirPapel(input: {
  setorId: string;
  processoId: string;
  colaboradorId: string;
  papel: PapelRaci | null;
}) {
  await guard();
  const { processoId, colaboradorId, papel } = input;

  const existente = await db.query.atribuicaoRaci.findFirst({
    where: and(
      eq(atribuicaoRaci.processoId, processoId),
      eq(atribuicaoRaci.colaboradorId, colaboradorId),
    ),
  });

  if (papel === null) {
    if (existente) {
      await db.delete(atribuicaoRaci).where(eq(atribuicaoRaci.id, existente.id));
    }
  } else if (existente) {
    await db
      .update(atribuicaoRaci)
      .set({ papel, atualizadoEm: new Date() })
      .where(eq(atribuicaoRaci.id, existente.id));
  } else {
    await db.insert(atribuicaoRaci).values({ processoId, colaboradorId, papel });
  }

  refresh(input.setorId);
  return { ok: true as const };
}
