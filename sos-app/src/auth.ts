// Config COMPLETA do Auth.js (roda em Node — pode acessar banco e bcrypt).
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";
import { db } from "./db";
import { usuario } from "./db/schema";
import { verificaSenha } from "./domain/senha";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Necessário quando acessado por IP/host da rede (não só localhost).
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const senha = String(creds?.senha ?? "");
        if (!email || !senha) return null;

        const u = await db.query.usuario.findFirst({
          where: eq(usuario.email, email),
        });
        if (!u || !u.ativo) return null;

        const ok = await verificaSenha(senha, u.senhaHash);
        if (!ok) return null;

        return {
          id: u.id,
          name: u.nome,
          email: u.email,
          papel: u.papel,
        };
      },
    }),
  ],
});
