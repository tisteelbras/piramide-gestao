import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { indicador, recomendacao } from "@/db/schema";
import type { IndicadorItem, RecomendacaoItem } from "./tipos";

export type { IndicadorItem, RecomendacaoItem, ResultadosDoSetor } from "./tipos";

export async function carregarResultados(setorId: string) {
  const [inds, recs] = await Promise.all([
    db.query.indicador.findMany({ where: eq(indicador.setorId, setorId), orderBy: (i, { asc }) => [asc(i.nome)] }),
    db.query.recomendacao.findMany({ where: eq(recomendacao.setorId, setorId), orderBy: (r, { asc }) => [asc(r.prioridade)] }),
  ]);
  return {
    indicadores: inds.map((i): IndicadorItem => ({
      id: i.id,
      nome: i.nome,
      unidade: i.unidade,
      meta: i.meta != null ? Number(i.meta) : null,
      valorAtual: i.valorAtual != null ? Number(i.valorAtual) : null,
      ehAusencia: i.ehAusencia,
    })),
    recomendacoes: recs.map((r): RecomendacaoItem => ({
      id: r.id,
      titulo: r.titulo,
      detalhe: r.detalhe,
      prioridade: Number(r.prioridade),
      impactoEsperado: r.impactoEsperado,
    })),
  };
}
