import "server-only";
import { cache } from "react";
import { eq, asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { processo, colaborador, atribuicaoRaci } from "@/db/schema";
import type { MatrizRaci, PapelRaci } from "./tipos";

/**
 * Matriz RACI de um setor: as atividades são os PROCESSOS do setor e as
 * pessoas são os COLABORADORES (vindos do organograma). A matriz apenas
 * conecta o que já existe.
 */
export const matrizDoSetor = cache(async (setorId: string): Promise<MatrizRaci> => {
  const [processos, pessoas] = await Promise.all([
    db.query.processo.findMany({
      where: eq(processo.setorId, setorId),
      orderBy: [asc(processo.nome)],
    }),
    db.query.colaborador.findMany({
      where: eq(colaborador.setorId, setorId),
      orderBy: [asc(colaborador.nome)],
    }),
  ]);

  const idsProc = processos.map((p) => p.id);
  const atribuicoes = idsProc.length
    ? await db.query.atribuicaoRaci.findMany({
        where: inArray(atribuicaoRaci.processoId, idsProc),
      })
    : [];

  return {
    atividades: processos.map((p) => ({ id: p.id, nome: p.nome, tipo: p.tipo })),
    pessoas: pessoas.map((c) => ({ id: c.id, nome: c.nome, cargo: c.cargo })),
    atribuicoes: atribuicoes.map((a) => ({
      processoId: a.processoId,
      colaboradorId: a.colaboradorId,
      papel: a.papel as PapelRaci,
    })),
  };
});
