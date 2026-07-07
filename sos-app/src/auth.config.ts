// Config LEVE do Auth.js — sem acesso a banco nem bcrypt.
// É a parte que roda no proxy (Edge). A verificação real de senha
// fica em auth.ts (Node), que importa este arquivo e adiciona o provider.
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // Checagem otimista de acesso: usada pelo proxy para redirecionar.
    authorized({ auth, request: { nextUrl } }) {
      const logado = !!auth?.user;
      const naTelaLogin = nextUrl.pathname.startsWith("/login");
      if (naTelaLogin) {
        // Já logado tentando ver /login → manda para o app.
        if (logado) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      // Qualquer outra rota exige login.
      return logado;
    },
    // Propaga papel e id do usuário para o token/sessão.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.papel = (user as { papel?: string }).papel;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { papel?: string }).papel = token.papel as string;
      }
      return session;
    },
  },
  providers: [], // preenchido em auth.ts
} satisfies NextAuthConfig;
