"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { etapaProcesso } from "@/db/schema";
import { auth } from "@/auth";

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
}

const refresh = (setorId: string) => {
  revalidatePath(`/setor/${setorId}/mapa`, "page");
  revalidatePath("/setor/[id]", "page");
};

/** Acrescenta uma etapa ao fim do fluxo do processo. */
export async function addEtapa(input: {
  setorId: string;
  processoId: string;
  titulo: string;
}) {
  await guard();
  const titulo = input.titulo.trim();
  if (!titulo) return { ok: false as const, erro: "Descreva o passo." };

  // Próxima posição no fluxo.
  const [{ prox }] = await db
    .select({ prox: sql<number>`coalesce(max(${etapaProcesso.ordem}) + 1, 0)` })
    .from(etapaProcesso)
    .where(eq(etapaProcesso.processoId, input.processoId));

  await db.insert(etapaProcesso).values({
    processoId: input.processoId,
    ordem: prox,
    titulo,
  });
  refresh(input.setorId);
  return { ok: true as const };
}

/** Atualiza um campo da etapa (instrução, responsável, entrega, título). */
export async function atualizarEtapa(input: {
  setorId: string;
  id: string;
  titulo?: string;
  descricao?: string | null;
  responsavelId?: string | null;
  entrega?: string | null;
}) {
  await guard();
  const patch: Record<string, unknown> = { atualizadoEm: new Date() };
  if (input.titulo !== undefined) {
    const t = input.titulo.trim();
    if (!t) return { ok: false as const, erro: "Descreva o passo." };
    patch.titulo = t;
  }
  if (input.descricao !== undefined) patch.descricao = input.descricao?.trim() || null;
  if (input.entrega !== undefined) patch.entrega = input.entrega?.trim() || null;
  if (input.responsavelId !== undefined) patch.responsavelId = input.responsavelId || null;

  await db.update(etapaProcesso).set(patch).where(eq(etapaProcesso.id, input.id));
  refresh(input.setorId);
  return { ok: true as const };
}

/** Remove a etapa e reordena as seguintes, para não deixar buracos. */
export async function removerEtapa(setorId: string, id: string) {
  await guard();
  const alvo = await db.query.etapaProcesso.findFirst({ where: eq(etapaProcesso.id, id) });
  if (!alvo) return { ok: true as const };

  await db.delete(etapaProcesso).where(eq(etapaProcesso.id, id));
  await db
    .update(etapaProcesso)
    .set({ ordem: sql`${etapaProcesso.ordem} - 1` })
    .where(
      and(
        eq(etapaProcesso.processoId, alvo.processoId),
        sql`${etapaProcesso.ordem} > ${alvo.ordem}`,
      ),
    );

  refresh(setorId);
  return { ok: true as const };
}

/** Move a etapa uma posição para cima ou para baixo no fluxo. */
export async function moverEtapa(setorId: string, id: string, direcao: "cima" | "baixo") {
  await guard();
  const alvo = await db.query.etapaProcesso.findFirst({ where: eq(etapaProcesso.id, id) });
  if (!alvo) return { ok: false as const };

  const novaOrdem = direcao === "cima" ? alvo.ordem - 1 : alvo.ordem + 1;
  const vizinho = await db.query.etapaProcesso.findFirst({
    where: and(
      eq(etapaProcesso.processoId, alvo.processoId),
      eq(etapaProcesso.ordem, novaOrdem),
    ),
  });
  if (!vizinho) return { ok: true as const }; // já está na ponta

  // Troca as posições.
  await db.update(etapaProcesso).set({ ordem: alvo.ordem }).where(eq(etapaProcesso.id, vizinho.id));
  await db.update(etapaProcesso).set({ ordem: novaOrdem }).where(eq(etapaProcesso.id, alvo.id));

  refresh(setorId);
  return { ok: true as const };
}
