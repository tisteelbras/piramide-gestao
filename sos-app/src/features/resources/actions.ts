"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  colaborador,
  sistema,
  ativo,
  avaliacaoColaborador,
  type eixoRh,
} from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";

type EixoRh = (typeof eixoRh.enumValues)[number];

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  return getEmpresa();
}
function refresh() {
  revalidatePath("/setor/[id]", "page");
}

// ————— Colaboradores —————
export async function addColaborador(setorId: string, nome: string, cargo?: string) {
  const emp = await guard();
  if (!nome.trim()) return { ok: false as const };
  await db.insert(colaborador).values({ empresaId: emp.id, setorId, nome: nome.trim(), cargo: cargo?.trim() || null });
  refresh();
  return { ok: true as const };
}
export async function removeColaborador(id: string) {
  await guard();
  await db.delete(colaborador).where(eq(colaborador.id, id));
  refresh();
  return { ok: true as const };
}
/** Salva a nota de um eixo de RH de um colaborador dentro de uma avaliação. */
export async function salvarNotaColaborador(input: {
  avaliacaoId: string;
  colaboradorId: string;
  eixo: EixoRh;
  nota: number;
}) {
  await guard();
  const { avaliacaoId, colaboradorId, eixo, nota } = input;
  const existente = await db.query.avaliacaoColaborador.findFirst({
    where: and(
      eq(avaliacaoColaborador.avaliacaoId, avaliacaoId),
      eq(avaliacaoColaborador.colaboradorId, colaboradorId),
      eq(avaliacaoColaborador.eixo, eixo),
    ),
  });
  if (existente) {
    await db.update(avaliacaoColaborador).set({ nota: String(nota), atualizadoEm: new Date() }).where(eq(avaliacaoColaborador.id, existente.id));
  } else {
    await db.insert(avaliacaoColaborador).values({ avaliacaoId, colaboradorId, eixo, nota: String(nota) });
  }
  refresh();
  return { ok: true as const };
}

// ————— Sistemas —————
export async function addSistema(setorId: string, nome: string, ehNecessidade = false) {
  const emp = await guard();
  if (!nome.trim()) return { ok: false as const };
  await db.insert(sistema).values({ empresaId: emp.id, setorId, nome: nome.trim(), ehNecessidade, nota: ehNecessidade ? "0" : null });
  refresh();
  return { ok: true as const };
}
export async function setNotaSistema(id: string, nota: number) {
  await guard();
  await db.update(sistema).set({ nota: String(nota), atualizadoEm: new Date() }).where(eq(sistema.id, id));
  refresh();
  return { ok: true as const };
}
export async function removeSistema(id: string) {
  await guard();
  await db.delete(sistema).where(eq(sistema.id, id));
  refresh();
  return { ok: true as const };
}

// ————— Ativos —————
export async function addAtivo(setorId: string, nome: string) {
  const emp = await guard();
  if (!nome.trim()) return { ok: false as const };
  await db.insert(ativo).values({ empresaId: emp.id, setorId, nome: nome.trim(), nota: null });
  refresh();
  return { ok: true as const };
}
export async function setNotaAtivo(id: string, nota: number) {
  await guard();
  await db.update(ativo).set({ nota: String(nota), atualizadoEm: new Date() }).where(eq(ativo.id, id));
  refresh();
  return { ok: true as const };
}
export async function removeAtivo(id: string) {
  await guard();
  await db.delete(ativo).where(eq(ativo.id, id));
  refresh();
  return { ok: true as const };
}
