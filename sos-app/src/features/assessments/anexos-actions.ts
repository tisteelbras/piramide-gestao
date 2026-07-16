"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { anexo, resposta } from "@/db/schema";
import { auth } from "@/auth";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB por arquivo

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
}
const refresh = () => revalidatePath("/setor/[id]/avaliar", "page");

/** Salva/atualiza a descrição de uma etapa (campo observacao da resposta). */
export async function salvarObservacaoEtapa(input: {
  avaliacaoId: string;
  criterioId: string;
  observacao: string;
}) {
  await guard();
  const { avaliacaoId, criterioId } = input;
  const observacao = input.observacao.trim() || null;
  const existente = await db.query.resposta.findFirst({
    where: and(eq(resposta.avaliacaoId, avaliacaoId), eq(resposta.criterioId, criterioId)),
  });
  if (existente) {
    await db.update(resposta).set({ observacao, atualizadoEm: new Date() }).where(eq(resposta.id, existente.id));
  } else {
    await db.insert(resposta).values({ avaliacaoId, criterioId, observacao, status: "nao_iniciada" });
  }
  refresh();
  return { ok: true as const };
}

/** Marca/desmarca um check nomeado da etapa (ex.: "politica_comercial").
 *  Checks são itens obrigatórios que a etapa verifica — o desmarcado gera
 *  aviso na tela e pendência no diagnóstico, mas não trava a revisão. */
export async function salvarCheckEtapa(input: {
  avaliacaoId: string;
  criterioId: string;
  check: string;
  valor: boolean;
}) {
  await guard();
  const { avaliacaoId, criterioId, check, valor } = input;
  const existente = await db.query.resposta.findFirst({
    where: and(eq(resposta.avaliacaoId, avaliacaoId), eq(resposta.criterioId, criterioId)),
  });
  if (existente) {
    const checks = { ...(existente.checks ?? {}), [check]: valor };
    await db.update(resposta).set({ checks, atualizadoEm: new Date() }).where(eq(resposta.id, existente.id));
  } else {
    await db.insert(resposta).values({ avaliacaoId, criterioId, checks: { [check]: valor }, status: "nao_iniciada" });
  }
  refresh();
  return { ok: true as const };
}

/** Recebe um arquivo (FormData) e anexa a uma etapa. */
export async function uploadAnexo(formData: FormData) {
  await guard();
  const avaliacaoId = String(formData.get("avaliacaoId") ?? "");
  const criterioId = String(formData.get("criterioId") ?? "");
  const arquivo = formData.get("arquivo");
  if (!avaliacaoId || !criterioId || !(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false as const, erro: "Arquivo inválido." };
  }
  if (arquivo.size > MAX_BYTES) {
    return { ok: false as const, erro: "Arquivo maior que 12 MB." };
  }

  const ext = path.extname(arquivo.name).slice(0, 12);
  const nomeArquivo = `${randomUUID()}${ext}`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, nomeArquivo), Buffer.from(await arquivo.arrayBuffer()));

  await db.insert(anexo).values({
    avaliacaoId,
    criterioId,
    nomeOriginal: arquivo.name,
    nomeArquivo,
    mimeType: arquivo.type || null,
    tamanhoBytes: arquivo.size,
  });
  refresh();
  return { ok: true as const };
}

export async function removeAnexo(id: string) {
  await guard();
  const a = await db.query.anexo.findFirst({ where: eq(anexo.id, id) });
  if (a) {
    await db.delete(anexo).where(eq(anexo.id, id));
    await unlink(path.join(UPLOADS_DIR, a.nomeArquivo)).catch(() => {
      /* arquivo já ausente no disco — segue */
    });
  }
  refresh();
  return { ok: true as const };
}
