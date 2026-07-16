"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { itemSwot } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import type { QuadranteSwot } from "./tipos";

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  return getEmpresa();
}
const refresh = (setorId: string) => {
  revalidatePath(`/setor/${setorId}/swot`, "page");
  revalidatePath("/setor/[id]/avaliar", "page");
  revalidatePath("/setor/[id]", "page");
};

export async function addItemSwot(setorId: string, quadrante: QuadranteSwot, descricao: string) {
  const emp = await guard();
  if (!descricao.trim()) return { ok: false as const };
  await db.insert(itemSwot).values({ empresaId: emp.id, setorId, quadrante, descricao: descricao.trim() });
  refresh(setorId);
  return { ok: true as const };
}

export async function removerItemSwot(setorId: string, id: string) {
  await guard();
  await db.delete(itemSwot).where(eq(itemSwot.id, id));
  refresh(setorId);
  return { ok: true as const };
}
