"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { processo, avaliacaoProcesso, type eixoProcesso } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import type { TipoProcesso } from "./tipos";

type EixoProcesso = (typeof eixoProcesso.enumValues)[number];

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  return getEmpresa();
}
const refresh = () => {
  revalidatePath("/setor/[id]", "page");
  revalidatePath("/setor/[id]/avaliar", "page");
};

export async function addProcesso(setorId: string, nome: string, tipo: TipoProcesso = "outro") {
  const emp = await guard();
  if (!nome.trim()) return { ok: false as const };
  await db.insert(processo).values({ empresaId: emp.id, setorId, nome: nome.trim(), tipo });
  refresh();
  return { ok: true as const };
}

export async function removeProcesso(id: string) {
  await guard();
  await db.delete(processo).where(eq(processo.id, id));
  refresh();
  return { ok: true as const };
}

/** Escala oficial: notas presas de 10 em 10, entre 0 e 100. */
const snap10 = (n: number) => Math.min(100, Math.max(0, Math.round(n / 10) * 10));

export async function setNotaEixoProcesso(processoId: string, eixo: EixoProcesso, notaBruta: number) {
  await guard();
  const nota = snap10(notaBruta);
  const existente = await db.query.avaliacaoProcesso.findFirst({
    where: and(eq(avaliacaoProcesso.processoId, processoId), eq(avaliacaoProcesso.eixo, eixo)),
  });
  if (existente) {
    await db.update(avaliacaoProcesso).set({ nota: String(nota), atualizadoEm: new Date() }).where(eq(avaliacaoProcesso.id, existente.id));
  } else {
    await db.insert(avaliacaoProcesso).values({ processoId, eixo, nota: String(nota) });
  }
  refresh();
  return { ok: true as const };
}
