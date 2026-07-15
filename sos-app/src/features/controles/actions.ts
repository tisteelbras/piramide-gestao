"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { controleGovernanca } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import type { SituacaoControle } from "./tipos";

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  return getEmpresa();
}
const refresh = (setorId: string) => {
  revalidatePath(`/setor/${setorId}/controles`, "page");
  revalidatePath("/setor/[id]/avaliar", "page");
  revalidatePath("/setor/[id]", "page");
};

export async function addControle(setorId: string, nome: string) {
  const emp = await guard();
  if (!nome.trim()) return { ok: false as const };
  await db.insert(controleGovernanca).values({ empresaId: emp.id, setorId, nome: nome.trim() });
  refresh(setorId);
  return { ok: true as const };
}

export async function setSituacaoControle(setorId: string, id: string, situacao: SituacaoControle) {
  await guard();
  await db.update(controleGovernanca).set({ situacao, atualizadoEm: new Date() }).where(eq(controleGovernanca.id, id));
  refresh(setorId);
  return { ok: true as const };
}

export async function removerControle(setorId: string, id: string) {
  await guard();
  await db.delete(controleGovernanca).where(eq(controleGovernanca.id, id));
  refresh(setorId);
  return { ok: true as const };
}
