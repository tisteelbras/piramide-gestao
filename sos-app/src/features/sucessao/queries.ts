import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sucessaoGovernanca } from "@/db/schema";
import type { SucessaoItem, SucessaoDoSetor } from "./tipos";

export type { SucessaoItem, SucessaoDoSetor, RiscoSucessao } from "./tipos";

export async function carregarSucessao(setorId: string): Promise<SucessaoDoSetor> {
  const rows = await db.query.sucessaoGovernanca.findMany({
    where: eq(sucessaoGovernanca.setorId, setorId),
    orderBy: (s, { asc }) => [asc(s.criadoEm)],
  });
  const itens: SucessaoItem[] = rows.map((s) => ({
    id: s.id, atividade: s.atividade, quemDomina: s.quemDomina, risco: s.risco,
  }));
  return {
    itens,
    total: itens.length,
    lacunas: itens.filter((i) => i.risco === "sem_dominio").length,
    criticos: itens.filter((i) => i.risco === "critico").length,
  };
}
