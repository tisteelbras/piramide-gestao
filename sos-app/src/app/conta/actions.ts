"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { usuario } from "@/db/schema";
import { hashSenha, verificaSenha } from "@/domain/senha";

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
