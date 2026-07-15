import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { objetivoEstrategico } from "@/db/schema";
import { objetivoCompleto } from "./tipos";
import type { ObjetivoItem, ObjetivosDoSetor } from "./tipos";

export type { ObjetivoItem, ObjetivosDoSetor, StatusObjetivo } from "./tipos";

export async function carregarObjetivos(setorId: string): Promise<ObjetivosDoSetor> {
  const rows = await db.query.objetivoEstrategico.findMany({
    where: eq(objetivoEstrategico.setorId, setorId),
    orderBy: (o, { asc }) => [asc(o.criadoEm)],
  });
  const objetivos: ObjetivoItem[] = rows.map((o) => ({
    id: o.id,
    titulo: o.titulo,
    meta: o.meta,
    prazo: o.prazo,
    status: o.status,
  }));
  return {
    objetivos,
    total: objetivos.length,
    completos: objetivos.filter(objetivoCompleto).length,
  };
}
