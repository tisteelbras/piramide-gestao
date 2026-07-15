import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { controleGovernanca } from "@/db/schema";
import { coberturaControles } from "./tipos";
import type { ControleItem, ControlesDoSetor } from "./tipos";

export type { ControleItem, ControlesDoSetor, SituacaoControle } from "./tipos";

export async function carregarControles(setorId: string): Promise<ControlesDoSetor> {
  const rows = await db.query.controleGovernanca.findMany({
    where: eq(controleGovernanca.setorId, setorId),
    orderBy: (c, { asc }) => [asc(c.criadoEm)],
  });
  const itens: ControleItem[] = rows.map((c) => ({ id: c.id, nome: c.nome, situacao: c.situacao }));
  return { itens, total: itens.length, cobertura: coberturaControles(itens) };
}
