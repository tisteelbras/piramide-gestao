"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { plano5w2h, acao5w2h, ishikawa, causaIshikawa, itemBcg } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import type { CategoriaIshikawa, StatusAcao } from "./tipos";

/** Escala oficial: notas presas de 10 em 10, entre 0 e 100. */
const snap10 = (n: number) => Math.min(100, Math.max(0, Math.round(n / 10) * 10));

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  return getEmpresa();
}
const refresh = (rota: string) => {
  revalidatePath(rota, "page");
  revalidatePath("/ferramentas", "page");
  revalidatePath("/dashboard", "page");
};

// —————————————————— 5W2H ——————————————————
export async function criarPlano5w2h(titulo: string, setorId?: string | null) {
  const emp = await guard();
  if (!titulo.trim()) return { ok: false as const };
  await db.insert(plano5w2h).values({ empresaId: emp.id, titulo: titulo.trim(), setorId: setorId || null });
  refresh("/ferramentas/5w2h");
  return { ok: true as const };
}
export async function removerPlano5w2h(id: string) {
  await guard();
  await db.delete(plano5w2h).where(eq(plano5w2h.id, id));
  refresh("/ferramentas/5w2h");
  return { ok: true as const };
}
export async function addAcao5w2h(planoId: string, oQue: string) {
  await guard();
  if (!oQue.trim()) return { ok: false as const };
  await db.insert(acao5w2h).values({ planoId, oQue: oQue.trim() });
  refresh("/ferramentas/5w2h");
  return { ok: true as const };
}
/** Atualiza os campos textuais de uma ação (salvos no blur da UI). */
export async function atualizarAcao5w2h(
  id: string,
  campos: Partial<{ oQue: string; porQue: string; onde: string; quando: string; quem: string; como: string; quantoCusta: string }>,
) {
  await guard();
  const limpo = Object.fromEntries(
    Object.entries(campos).map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : v]),
  );
  // "O quê" é obrigatório — não deixa apagar por completo.
  if ("oQue" in limpo && !limpo.oQue) delete limpo.oQue;
  if (Object.keys(limpo).length === 0) return { ok: true as const };
  await db.update(acao5w2h).set({ ...limpo, atualizadoEm: new Date() }).where(eq(acao5w2h.id, id));
  refresh("/ferramentas/5w2h");
  return { ok: true as const };
}
export async function setStatusAcao5w2h(id: string, status: StatusAcao) {
  await guard();
  await db.update(acao5w2h).set({ status, atualizadoEm: new Date() }).where(eq(acao5w2h.id, id));
  refresh("/ferramentas/5w2h");
  return { ok: true as const };
}
export async function removerAcao5w2h(id: string) {
  await guard();
  await db.delete(acao5w2h).where(eq(acao5w2h.id, id));
  refresh("/ferramentas/5w2h");
  return { ok: true as const };
}

/** Recomendação do diagnóstico → plano 5W2H já vinculado ao setor,
 *  com a primeira ação preenchida a partir da recomendação. */
export async function criarPlanoDaRecomendacao(setorId: string, titulo: string, detalhe: string | null) {
  const emp = await guard();
  if (!titulo.trim()) return { ok: false as const };
  const [plano] = await db.insert(plano5w2h)
    .values({ empresaId: emp.id, titulo: titulo.trim(), setorId })
    .returning();
  await db.insert(acao5w2h).values({ planoId: plano.id, oQue: titulo.trim(), porQue: detalhe?.trim() || null });
  refresh("/ferramentas/5w2h");
  return { ok: true as const, planoId: plano.id };
}

// —————————————————— Ishikawa ——————————————————
export async function criarIshikawa(problema: string, setorId?: string | null) {
  const emp = await guard();
  if (!problema.trim()) return { ok: false as const };
  const [analise] = await db.insert(ishikawa)
    .values({ empresaId: emp.id, problema: problema.trim(), setorId: setorId || null })
    .returning();
  refresh("/ferramentas/ishikawa");
  return { ok: true as const, ishikawaId: analise.id };
}
export async function removerIshikawa(id: string) {
  await guard();
  await db.delete(ishikawa).where(eq(ishikawa.id, id));
  refresh("/ferramentas/ishikawa");
  return { ok: true as const };
}
export async function addCausaIshikawa(ishikawaId: string, categoria: CategoriaIshikawa, descricao: string) {
  await guard();
  if (!descricao.trim()) return { ok: false as const };
  await db.insert(causaIshikawa).values({ ishikawaId, categoria, descricao: descricao.trim() });
  refresh("/ferramentas/ishikawa");
  return { ok: true as const };
}
export async function removerCausaIshikawa(id: string) {
  await guard();
  await db.delete(causaIshikawa).where(eq(causaIshikawa.id, id));
  refresh("/ferramentas/ishikawa");
  return { ok: true as const };
}

/** Recomendação do diagnóstico → análise de causa raiz do problema,
 *  já vinculada ao setor. */
export async function criarIshikawaDaRecomendacao(setorId: string, problema: string) {
  const emp = await guard();
  if (!problema.trim()) return { ok: false as const };
  await db.insert(ishikawa).values({ empresaId: emp.id, problema: problema.trim(), setorId });
  refresh("/ferramentas/ishikawa");
  return { ok: true as const };
}

// —————————————————— Matriz BCG ——————————————————
export async function addItemBcg(nome: string) {
  const emp = await guard();
  if (!nome.trim()) return { ok: false as const };
  await db.insert(itemBcg).values({ empresaId: emp.id, nome: nome.trim() });
  refresh("/ferramentas/bcg");
  return { ok: true as const };
}
export async function setEixosItemBcg(id: string, participacao: number, crescimento: number) {
  await guard();
  await db.update(itemBcg)
    .set({ participacao: String(snap10(participacao)), crescimento: String(snap10(crescimento)), atualizadoEm: new Date() })
    .where(eq(itemBcg.id, id));
  refresh("/ferramentas/bcg");
  return { ok: true as const };
}
export async function removerItemBcg(id: string) {
  await guard();
  await db.delete(itemBcg).where(eq(itemBcg.id, id));
  refresh("/ferramentas/bcg");
  return { ok: true as const };
}
