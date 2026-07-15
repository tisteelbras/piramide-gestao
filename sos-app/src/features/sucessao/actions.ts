"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { sucessaoGovernanca } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import { riscoPorQuem } from "./tipos";

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  return getEmpresa();
}
const refresh = (setorId: string) => {
  revalidatePath(`/setor/${setorId}/sucessao`, "page");
  revalidatePath("/setor/[id]/avaliar", "page");
  revalidatePath("/setor/[id]", "page");
};

export async function addSucessao(setorId: string, atividade: string) {
  const emp = await guard();
  if (!atividade.trim()) return { ok: false as const };
  await db.insert(sucessaoGovernanca).values({ empresaId: emp.id, setorId, atividade: atividade.trim() });
  refresh(setorId);
  return { ok: true as const };
}

/** Salva quem domina e RECALCULA o risco a partir disso — o risco não é
 *  digitado, é derivado (o gestor não subestima o bus factor). */
export async function setQuemDomina(setorId: string, id: string, quemDomina: string) {
  await guard();
  const texto = quemDomina.trim() || null;
  await db.update(sucessaoGovernanca)
    .set({ quemDomina: texto, risco: riscoPorQuem(texto), atualizadoEm: new Date() })
    .where(eq(sucessaoGovernanca.id, id));
  refresh(setorId);
  return { ok: true as const };
}

export async function removerSucessao(setorId: string, id: string) {
  await guard();
  await db.delete(sucessaoGovernanca).where(eq(sucessaoGovernanca.id, id));
  refresh(setorId);
  return { ok: true as const };
}
