"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { objetivoEstrategico } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import type { StatusObjetivo } from "./tipos";

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  return getEmpresa();
}
const refresh = (setorId: string) => {
  revalidatePath(`/setor/${setorId}/objetivos`, "page");
  revalidatePath("/setor/[id]/avaliar", "page");
  revalidatePath("/setor/[id]", "page");
};

export async function addObjetivo(setorId: string, titulo: string) {
  const emp = await guard();
  if (!titulo.trim()) return { ok: false as const };
  await db.insert(objetivoEstrategico).values({ empresaId: emp.id, setorId, titulo: titulo.trim() });
  refresh(setorId);
  return { ok: true as const };
}

export async function atualizarObjetivo(
  setorId: string,
  id: string,
  campos: Partial<{ titulo: string; meta: string | null; prazo: string | null; status: StatusObjetivo }>,
) {
  await guard();
  const patch: Record<string, unknown> = { atualizadoEm: new Date() };
  if ("titulo" in campos && campos.titulo?.trim()) patch.titulo = campos.titulo.trim();
  if ("meta" in campos) patch.meta = campos.meta?.trim() || null;
  if ("prazo" in campos) patch.prazo = campos.prazo || null;
  if ("status" in campos && campos.status) patch.status = campos.status;
  await db.update(objetivoEstrategico).set(patch).where(eq(objetivoEstrategico.id, id));
  refresh(setorId);
  return { ok: true as const };
}

export async function removerObjetivo(setorId: string, id: string) {
  await guard();
  await db.delete(objetivoEstrategico).where(eq(objetivoEstrategico.id, id));
  refresh(setorId);
  return { ok: true as const };
}
