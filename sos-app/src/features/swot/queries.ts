import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { itemSwot } from "@/db/schema";
import type { ItemSwot, SwotDoSetor } from "./tipos";

export type { ItemSwot, SwotDoSetor } from "./tipos";

export async function carregarSwot(setorId: string): Promise<SwotDoSetor> {
  const rows = await db.query.itemSwot.findMany({
    where: eq(itemSwot.setorId, setorId),
    orderBy: (i, { asc }) => [asc(i.criadoEm)],
  });
  return {
    itens: rows.map((i): ItemSwot => ({ id: i.id, quadrante: i.quadrante, descricao: i.descricao })),
  };
}
