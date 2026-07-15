"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { usuario } from "@/db/schema";
import { hashSenha, verificaSenha } from "@/domain/senha";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const EXT_PERMITIDAS: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
};
const MAX_FOTO_BYTES = 4 * 1024 * 1024; // 4 MB

export type FotoState = { erro?: string; ok?: boolean };

/** Upload da foto de perfil do usuário logado. Aceita JPG/PNG/WebP até 4MB,
 *  salva em uploads/ com nome opaco e apaga a foto anterior. */
export async function salvarFoto(_prev: FotoState, formData: FormData): Promise<FotoState> {
  const session = await auth();
  if (!session?.user?.id) return { erro: "Sessão expirada. Entre novamente." };

  const arquivo = formData.get("foto");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: "Escolha uma imagem." };
  if (arquivo.size > MAX_FOTO_BYTES) return { erro: "A imagem deve ter no máximo 4 MB." };
  const ext = EXT_PERMITIDAS[arquivo.type];
  if (!ext) return { erro: "Formato inválido. Use JPG, PNG ou WebP." };

  const u = await db.query.usuario.findFirst({ where: eq(usuario.id, session.user.id) });
  if (!u) return { erro: "Usuário não encontrado." };

  const nomeArquivo = `foto-${randomUUID()}${ext}`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, nomeArquivo), Buffer.from(await arquivo.arrayBuffer()));

  // Apaga a foto anterior do disco (silencioso se já não existir).
  if (u.fotoArquivo) {
    await unlink(path.join(UPLOADS_DIR, path.basename(u.fotoArquivo))).catch(() => {});
  }

  await db.update(usuario).set({ fotoArquivo: nomeArquivo, atualizadoEm: new Date() }).where(eq(usuario.id, u.id));
  revalidatePath("/");
  revalidatePath("/conta");
  return { ok: true };
}

export async function removerFoto(): Promise<FotoState> {
  const session = await auth();
  if (!session?.user?.id) return { erro: "Sessão expirada." };
  const u = await db.query.usuario.findFirst({ where: eq(usuario.id, session.user.id) });
  if (u?.fotoArquivo) {
    await unlink(path.join(UPLOADS_DIR, path.basename(u.fotoArquivo))).catch(() => {});
    await db.update(usuario).set({ fotoArquivo: null, atualizadoEm: new Date() }).where(eq(usuario.id, u.id));
  }
  revalidatePath("/");
  revalidatePath("/conta");
  return { ok: true };
}

export type SenhaState = { erro?: string; ok?: boolean };

export async function trocarSenha(_prev: SenhaState, formData: FormData): Promise<SenhaState> {
  const session = await auth();
  if (!session?.user?.id) return { erro: "Sessão expirada. Entre novamente." };

  const atual = String(formData.get("atual") ?? "");
  const nova = String(formData.get("nova") ?? "");
  const confirma = String(formData.get("confirma") ?? "");

  if (nova.length < 6) return { erro: "A nova senha deve ter ao menos 6 caracteres." };
  if (nova !== confirma) return { erro: "A confirmação não confere com a nova senha." };

  const u = await db.query.usuario.findFirst({ where: eq(usuario.id, session.user.id) });
  if (!u) return { erro: "Usuário não encontrado." };

  const ok = await verificaSenha(atual, u.senhaHash);
  if (!ok) return { erro: "A senha atual está incorreta." };

  await db.update(usuario).set({ senhaHash: await hashSenha(nova), atualizadoEm: new Date() }).where(eq(usuario.id, u.id));
  return { ok: true };
}
