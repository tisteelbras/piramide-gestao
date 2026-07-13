"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { usuario } from "@/db/schema";
import { auth } from "@/auth";

/** Marca que o usuário logado já viu o tutorial de boas-vindas. */
export async function marcarTutorialVisto() {
  const s = await auth();
  if (!s?.user?.id) return { ok: false as const };
  await db.update(usuario)
    .set({ tutorialVistoEm: new Date(), atualizadoEm: new Date() })
    .where(eq(usuario.id, s.user.id));
  revalidatePath("/", "page");
  return { ok: true as const };
}
