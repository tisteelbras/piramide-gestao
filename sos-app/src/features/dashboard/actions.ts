"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { setor } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";

export async function addSetor(nome: string) {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  if (!nome.trim()) return { ok: false as const };
  const emp = await getEmpresa();
  await db.insert(setor).values({ empresaId: emp.id, nome: nome.trim() });
  revalidatePath("/");
  return { ok: true as const };
}
