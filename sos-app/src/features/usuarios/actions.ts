"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { usuario } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import { hashSenha } from "@/domain/senha";

export type Papel = "admin" | "direcao" | "lider";

/** Só ADMIN gerencia usuários — verificado no banco, não só no token. */
async function guardAdmin() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Não autenticado.");
  const u = await db.query.usuario.findFirst({ where: eq(usuario.id, s.user.id) });
  if (!u || u.papel !== "admin") throw new Error("Apenas administradores gerenciam usuários.");
  const emp = await getEmpresa();
  return { emp, admin: u };
}

const refresh = () => {
  revalidatePath("/usuarios");
  revalidatePath("/");
};

const norm = (s: unknown) => String(s ?? "").trim();

export type UsuarioState = { erro?: string; ok?: boolean };

/** Cria um usuário. Líder exige setor; admin/direção não têm setor. */
export async function criarUsuario(_prev: UsuarioState, form: FormData): Promise<UsuarioState> {
  const { emp } = await guardAdmin();
  const nome = norm(form.get("nome"));
  const email = norm(form.get("email")).toLowerCase();
  const senha = norm(form.get("senha"));
  const papel = norm(form.get("papel")) as Papel;
  let setorId: string | null = norm(form.get("setorId")) || null;

  if (!nome) return { erro: "Informe o nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "E-mail inválido." };
  if (senha.length < 6) return { erro: "A senha deve ter ao menos 6 caracteres." };
  if (!["admin", "direcao", "lider"].includes(papel)) return { erro: "Papel inválido." };
  if (papel === "lider" && !setorId) return { erro: "Um líder precisa de um setor vinculado." };
  if (papel !== "lider") setorId = null; // admin/direção não lideram setor

  const jaExiste = await db.query.usuario.findFirst({ where: eq(usuario.email, email) });
  if (jaExiste) return { erro: "Já existe um usuário com esse e-mail." };

  await db.insert(usuario).values({
    empresaId: emp.id, nome, email, senhaHash: await hashSenha(senha), papel, setorId, ativo: true,
  });
  refresh();
  return { ok: true };
}

/** Atualiza papel e setor de um usuário. Não permite o admin rebaixar a si
 *  mesmo (evita a empresa ficar sem administrador por engano). */
export async function atualizarUsuario(id: string, papel: Papel, setorId: string | null) {
  const { admin } = await guardAdmin();
  if (id === admin.id && papel !== "admin") {
    return { ok: false as const, erro: "Você não pode remover seu próprio acesso de administrador." };
  }
  const setorFinal = papel === "lider" ? setorId : null;
  await db.update(usuario).set({ papel, setorId: setorFinal, atualizadoEm: new Date() }).where(eq(usuario.id, id));
  refresh();
  return { ok: true as const };
}

/** Ativa/desativa um usuário (desativar bloqueia o login sem apagar dados).
 *  Não deixa desativar o último admin ativo. */
export async function alternarAtivo(id: string, ativo: boolean) {
  const { emp, admin } = await guardAdmin();
  if (id === admin.id && !ativo) {
    return { ok: false as const, erro: "Você não pode desativar a si mesmo." };
  }
  if (!ativo) {
    const alvo = await db.query.usuario.findFirst({ where: eq(usuario.id, id) });
    if (alvo?.papel === "admin") {
      const outrosAdmins = await db.query.usuario.findMany({
        where: and(eq(usuario.empresaId, emp.id), eq(usuario.papel, "admin"), eq(usuario.ativo, true), ne(usuario.id, id)),
      });
      if (outrosAdmins.length === 0) {
        return { ok: false as const, erro: "É o último administrador ativo — não pode ser desativado." };
      }
    }
  }
  await db.update(usuario).set({ ativo, atualizadoEm: new Date() }).where(eq(usuario.id, id));
  refresh();
  return { ok: true as const };
}

/** Redefine a senha de um usuário (o admin pode, sem saber a atual). */
export async function redefinirSenha(id: string, novaSenha: string) {
  await guardAdmin();
  if (novaSenha.trim().length < 6) return { ok: false as const, erro: "A senha deve ter ao menos 6 caracteres." };
  await db.update(usuario).set({ senhaHash: await hashSenha(novaSenha.trim()), atualizadoEm: new Date() }).where(eq(usuario.id, id));
  refresh();
  return { ok: true as const };
}
