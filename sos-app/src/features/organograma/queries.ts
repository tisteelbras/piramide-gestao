import "server-only";
import { cache } from "react";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { colaborador, setor } from "@/db/schema";
import { getEmpresa } from "@/features/assessments/queries";
import type { PessoaOrganograma } from "./tipos";

/** Pessoas do organograma de um setor (= colaboradores do setor). */
export const organogramaDoSetor = cache(
  async (setorId: string): Promise<PessoaOrganograma[]> => {
    const linhas = await db.query.colaborador.findMany({
      where: eq(colaborador.setorId, setorId),
      orderBy: [asc(colaborador.nome)],
    });
    return linhas.map((c) => ({
      id: c.id,
      nome: c.nome,
      cargo: c.cargo,
      gestorId: c.gestorId,
    }));
  },
);

/** Organograma de um setor, para a visão consolidada da empresa. */
export type OrganogramaSetor = {
  setorId: string;
  setorNome: string;
  pessoas: PessoaOrganograma[];
};

/**
 * Organograma consolidado da empresa: todos os setores, cada um com suas
 * pessoas. Setores ainda sem ninguém vêm com lista vazia — é justamente
 * o que mostra quais áreas faltam preencher.
 * Duas queries no total (setores + colaboradores), sem N+1.
 */
export const organogramaDaEmpresa = cache(
  async (): Promise<OrganogramaSetor[]> => {
    const emp = await getEmpresa();
    const [setores, pessoas] = await Promise.all([
      db.query.setor.findMany({
        where: eq(setor.empresaId, emp.id),
        orderBy: [asc(setor.nome)],
      }),
      db.query.colaborador.findMany({
        where: eq(colaborador.empresaId, emp.id),
        orderBy: [asc(colaborador.nome)],
      }),
    ]);

    const porSetor = new Map<string, PessoaOrganograma[]>();
    for (const c of pessoas) {
      const lista = porSetor.get(c.setorId) ?? [];
      lista.push({ id: c.id, nome: c.nome, cargo: c.cargo, gestorId: c.gestorId });
      porSetor.set(c.setorId, lista);
    }

    return setores.map((s) => ({
      setorId: s.id,
      setorNome: s.nome,
      pessoas: porSetor.get(s.id) ?? [],
    }));
  },
);
