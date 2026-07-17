"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { fluxograma, noFluxograma } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import type { TipoNoFluxograma } from "./tipos";

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  return getEmpresa();
}

const refresh = (setorId: string) => {
  revalidatePath(`/setor/${setorId}/fluxograma`, "page");
  revalidatePath("/setor/[id]", "page");
};

// ————— Fluxogramas —————

/** Cria um fluxograma do setor. Já nasce com os nós Início e Fim. */
export async function criarFluxograma(setorId: string, nome: string) {
  const emp = await guard();
  const limpo = nome.trim();
  if (!limpo) return { ok: false as const, erro: "Dê um nome ao fluxograma." };

  const [flx] = await db.insert(fluxograma)
    .values({ empresaId: emp.id, setorId, nome: limpo })
    .returning();
  // Início (ordem 0) e Fim (ordem 1) para o desenho já ter limites.
  await db.insert(noFluxograma).values([
    { fluxogramaId: flx.id, ordem: 0, tipo: "inicio", rotulo: "Início" },
    { fluxogramaId: flx.id, ordem: 1, tipo: "fim", rotulo: "Fim" },
  ]);
  refresh(setorId);
  return { ok: true as const, id: flx.id };
}

export async function renomearFluxograma(setorId: string, id: string, nome: string) {
  await guard();
  const limpo = nome.trim();
  if (!limpo) return { ok: false as const, erro: "O nome não pode ficar vazio." };
  await db.update(fluxograma).set({ nome: limpo, atualizadoEm: new Date() }).where(eq(fluxograma.id, id));
  refresh(setorId);
  return { ok: true as const };
}

export async function removerFluxograma(setorId: string, id: string) {
  await guard();
  await db.delete(fluxograma).where(eq(fluxograma.id, id)); // nós vão junto (cascade)
  refresh(setorId);
  return { ok: true as const };
}

// ————— Nós —————

/**
 * Insere um nó ANTES do "Fim" (ou no fim da sequência): assim o Fim sempre
 * fica por último. Processo → precisa de processoId; decisão → nasce com uma
 * pergunta em branco para o gestor preencher.
 */
export async function addNo(input: {
  setorId: string;
  fluxogramaId: string;
  tipo: TipoNoFluxograma;
  processoId?: string | null;
  rotulo?: string | null;
}) {
  await guard();
  const { setorId, fluxogramaId, tipo } = input;
  if (tipo === "processo" && !input.processoId) {
    return { ok: false as const, erro: "Escolha o processo." };
  }

  // Posição do nó "Fim", se existir — inserimos logo antes dele.
  const nos = await db.query.noFluxograma.findMany({
    where: eq(noFluxograma.fluxogramaId, fluxogramaId),
    orderBy: (n, { asc }) => [asc(n.ordem)],
  });
  const fim = nos.find((n) => n.tipo === "fim");
  const posicao = fim ? fim.ordem : nos.length;

  // Abre espaço: tudo em `posicao` ou depois desce uma casa.
  await db.update(noFluxograma)
    .set({ ordem: sql`${noFluxograma.ordem} + 1` })
    .where(and(eq(noFluxograma.fluxogramaId, fluxogramaId), sql`${noFluxograma.ordem} >= ${posicao}`));

  await db.insert(noFluxograma).values({
    fluxogramaId,
    ordem: posicao,
    tipo,
    processoId: tipo === "processo" ? input.processoId ?? null : null,
    rotulo: input.rotulo?.trim() || null,
  });
  refresh(setorId);
  return { ok: true as const };
}

/** Ajusta a decisão: a pergunta e para onde vai o caminho "Não". */
export async function editarDecisao(input: {
  setorId: string;
  id: string;
  pergunta?: string | null;
  destinoNaoId?: string | null;
}) {
  await guard();
  const patch: Record<string, unknown> = { atualizadoEm: new Date() };
  if (input.pergunta !== undefined) patch.pergunta = input.pergunta?.trim() || null;
  if (input.destinoNaoId !== undefined) patch.destinoNaoId = input.destinoNaoId || null;
  await db.update(noFluxograma).set(patch).where(eq(noFluxograma.id, input.id));
  refresh(input.setorId);
  return { ok: true as const };
}

/** Remove um nó e fecha o buraco na ordem. Início e Fim não se removem. */
export async function removerNo(setorId: string, id: string) {
  await guard();
  const alvo = await db.query.noFluxograma.findFirst({ where: eq(noFluxograma.id, id) });
  if (!alvo) return { ok: true as const };
  if (alvo.tipo === "inicio" || alvo.tipo === "fim") {
    return { ok: false as const, erro: "Início e Fim não podem ser removidos." };
  }

  await db.delete(noFluxograma).where(eq(noFluxograma.id, id));
  await db.update(noFluxograma)
    .set({ ordem: sql`${noFluxograma.ordem} - 1` })
    .where(and(eq(noFluxograma.fluxogramaId, alvo.fluxogramaId), sql`${noFluxograma.ordem} > ${alvo.ordem}`));
  // Qualquer decisão que apontava o "Não" para este nó perde o destino.
  await db.update(noFluxograma)
    .set({ destinoNaoId: null })
    .where(eq(noFluxograma.destinoNaoId, id));
  refresh(setorId);
  return { ok: true as const };
}

/** Move um nó uma posição para cima/baixo, sem passar de Início/Fim. */
export async function moverNo(setorId: string, id: string, direcao: "cima" | "baixo") {
  await guard();
  const alvo = await db.query.noFluxograma.findFirst({ where: eq(noFluxograma.id, id) });
  if (!alvo || alvo.tipo === "inicio" || alvo.tipo === "fim") return { ok: false as const };

  const novaOrdem = direcao === "cima" ? alvo.ordem - 1 : alvo.ordem + 1;
  const vizinho = await db.query.noFluxograma.findFirst({
    where: and(eq(noFluxograma.fluxogramaId, alvo.fluxogramaId), eq(noFluxograma.ordem, novaOrdem)),
  });
  // Não troca com Início/Fim: eles são âncoras do fluxo.
  if (!vizinho || vizinho.tipo === "inicio" || vizinho.tipo === "fim") return { ok: true as const };

  await db.update(noFluxograma).set({ ordem: alvo.ordem }).where(eq(noFluxograma.id, vizinho.id));
  await db.update(noFluxograma).set({ ordem: novaOrdem }).where(eq(noFluxograma.id, alvo.id));
  refresh(setorId);
  return { ok: true as const };
}
