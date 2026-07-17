import "server-only";
import { cache } from "react";
import { eq, asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { processo, colaborador, etapaProcesso } from "@/db/schema";
import type { MapaDoSetor } from "./tipos";

/**
 * Mapa de processos de um setor: cada processo já cadastrado, com as
 * etapas do seu fluxo oficial. As pessoas vêm do organograma.
 * Três queries no total, sem N+1.
 */
export const mapaDoSetor = cache(async (setorId: string): Promise<MapaDoSetor> => {
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

  const ids = processos.map((p) => p.id);
  const etapas = ids.length
    ? await db.query.etapaProcesso.findMany({
        where: inArray(etapaProcesso.processoId, ids),
        orderBy: [asc(etapaProcesso.ordem)],
      })
    : [];

  const nomePorPessoa = new Map(pessoas.map((p) => [p.id, p.nome]));
  const porProcesso = new Map<string, typeof etapas>();
  for (const e of etapas) {
    const lista = porProcesso.get(e.processoId) ?? [];
    lista.push(e);
    porProcesso.set(e.processoId, lista);
  }

  return {
    processos: processos.map((p) => ({
      id: p.id,
      nome: p.nome,
      tipo: p.tipo,
      etapas: (porProcesso.get(p.id) ?? []).map((e) => ({
        id: e.id,
        ordem: e.ordem,
        tipoNo: e.tipoNo,
        titulo: e.titulo,
        descricao: e.descricao,
        responsavelId: e.responsavelId,
        responsavelNome: e.responsavelId ? nomePorPessoa.get(e.responsavelId) ?? null : null,
        entrega: e.entrega,
      })),
    })),
    pessoas: pessoas.map((p) => ({ id: p.id, nome: p.nome, cargo: p.cargo })),
  };
});
