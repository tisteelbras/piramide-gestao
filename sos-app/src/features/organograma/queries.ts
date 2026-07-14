import "server-only";
import { cache } from "react";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { colaborador } from "@/db/schema";
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
