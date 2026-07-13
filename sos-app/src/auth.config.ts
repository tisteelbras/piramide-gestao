// Config LEVE do Auth.js — sem acesso a banco nem bcrypt.
// É a parte que roda no proxy (Edge). A verificação real de senha
// fica em auth.ts (Node), que importa este arquivo e adiciona o provider.
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // Confia no Host da requisição — necessário quando o server escuta em
  // 0.0.0.0 e o app é acessado tanto por localhost quanto pelo IP da LAN.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // Checagem otimista de acesso: usada pelo proxy para redirecionar.
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const logado = !!auth?.user;
      const naTelaLogin = nextUrl.pathname.startsWith("/login");

      // Next 16 constrói nextUrl com o --hostname do server (0.0.0.0 em dev
      // com LAN aberta), não com o Host da requisição. Reconstruímos a
      // origem a partir dos headers para que o callbackUrl aponte para o
      // mesmo host que o cliente usou (localhost ou IP da LAN).
      const hostHeader =
        request.headers.get("x-forwarded-host") ??
        request.headers.get("host") ??
        nextUrl.host;
      const proto = request.headers.get("x-forwarded-proto") ?? nextUrl.protocol.replace(":", "");
      const origem = `${proto}://${hostHeader}`;

      if (naTelaLogin) {
        // Já logado tentando ver /login → manda para o app.
        if (logado) return Response.redirect(new URL("/", origem));
        return true;
      }
      if (logado) return true;
      // Não logado → redireciona para /login com callbackUrl no host correto.
      const destino = new URL("/login", origem);
      destino.searchParams.set("callbackUrl", `${origem}${nextUrl.pathname}${nextUrl.search}`);
      return Response.redirect(destino);
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
