// Proxy (antigo middleware — renomeado no Next 16).
// Protege as rotas de forma otimista: usa a config LEVE do Auth.js
// (sem banco) para redirecionar quem não está logado para /login.
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Roda em tudo, exceto estáticos, imagens e as rotas internas do auth.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
