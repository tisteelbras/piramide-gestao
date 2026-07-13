import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuario } from "@/db/schema";

/** true quando o usuário ainda não viu o tutorial de boas-vindas. */
export async function tutorialPendente(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const u = await db.query.usuario.findFirst({ where: eq(usuario.id, userId) });
  return !!u && u.tutorialVistoEm == null;
}
