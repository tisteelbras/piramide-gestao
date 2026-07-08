import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { processo, avaliacaoProcesso } from "@/db/schema";
import type { ProcessoComEixos, TipoProcesso } from "./tipos";

export { EIXOS_PROCESSO } from "./tipos";
export type { ProcessoComEixos } from "./tipos";

export async function carregarProcessos(setorId: string): Promise<ProcessoComEixos[]> {
  const [procs, notas] = await Promise.all([
    db.query.processo.findMany({ where: eq(processo.setorId, setorId), orderBy: (p, { asc }) => [asc(p.nome)] }),
    db.query.avaliacaoProcesso.findMany(),
  ]);
  const porProc = new Map<string, Record<string, number | null>>();
  for (const n of notas) {
    const m = porProc.get(n.processoId) ?? {};
    m[n.eixo] = n.nota != null ? Number(n.nota) : null;
    porProc.set(n.processoId, m);
  }
  return procs.map((p) => {
    const eixos = porProc.get(p.id) ?? {};
    const vals = Object.values(eixos).filter((v): v is number => v != null);
    const media = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    return { id: p.id, nome: p.nome, tipo: p.tipo as TipoProcesso, eixos, media };
  });
}
