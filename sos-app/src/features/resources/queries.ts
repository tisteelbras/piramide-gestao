import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { colaborador, sistema, ativo, avaliacaoColaborador } from "@/db/schema";
import type { ColaboradorComNotas } from "./tipos";

export { EIXOS_RH } from "./tipos";
export type { ColaboradorComNotas, RecursosDoSetor } from "./tipos";

export async function carregarRecursos(setorId: string, avaliacaoId: string) {
  const [colabs, sistemas, ativos, notasColab] = await Promise.all([
    db.query.colaborador.findMany({ where: eq(colaborador.setorId, setorId), orderBy: (c, { asc }) => [asc(c.nome)] }),
    db.query.sistema.findMany({ where: eq(sistema.setorId, setorId), orderBy: (s, { asc }) => [asc(s.nome)] }),
    db.query.ativo.findMany({ where: eq(ativo.setorId, setorId), orderBy: (a, { asc }) => [asc(a.nome)] }),
    db.query.avaliacaoColaborador.findMany({ where: eq(avaliacaoColaborador.avaliacaoId, avaliacaoId) }),
  ]);

  const notasPorColab = new Map<string, Record<string, number | null>>();
  for (const n of notasColab) {
    const m = notasPorColab.get(n.colaboradorId) ?? {};
    m[n.eixo] = n.nota != null ? Number(n.nota) : null;
    notasPorColab.set(n.colaboradorId, m);
  }

  return {
    colaboradores: colabs.map((c): ColaboradorComNotas => ({
      id: c.id,
      nome: c.nome,
      cargo: c.cargo,
      notas: notasPorColab.get(c.id) ?? {},
    })),
    sistemas: sistemas.map((s) => ({ id: s.id, nome: s.nome, nota: s.nota != null ? Number(s.nota) : null, ehNecessidade: s.ehNecessidade, justificativa: s.justificativa })),
    ativos: ativos.map((a) => ({ id: a.id, nome: a.nome, nota: a.nota != null ? Number(a.nota) : null, observacao: a.observacao })),
  };
}
