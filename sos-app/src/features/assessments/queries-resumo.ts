// Resumo de maturidade por setor — para os cards da home.
import "server-only";
import { db } from "@/db";
import { avaliacao, resposta, criterio } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { listarSetores, getEmpresa } from "./queries";
import { consolidarPorNivel } from "./consolidar";
import type { CriterioAvaliado, Nivel } from "./tipos";

export type ResumoSetor = {
  id: string;
  nome: string;
  geral: number; // 0–100
  temAvaliacao: boolean;
};

export async function resumoDosSetores(): Promise<ResumoSetor[]> {
  const e = await getEmpresa();
  const [setores, criterios] = await Promise.all([
    listarSetores(),
    db.query.criterio.findMany({ where: eq(criterio.empresaId, e.id) }),
  ]);

  const resultados: ResumoSetor[] = [];
  for (const s of setores) {
    const aval = await db.query.avaliacao.findFirst({
      where: and(eq(avaliacao.setorId, s.id), eq(avaliacao.empresaId, e.id)),
      orderBy: [desc(avaliacao.criadoEm)],
    });
    if (!aval) {
      resultados.push({ id: s.id, nome: s.nome, geral: 0, temAvaliacao: false });
      continue;
    }
    const respostas = await db.query.resposta.findMany({
      where: eq(resposta.avaliacaoId, aval.id),
    });
    const mapa = new Map(respostas.map((r) => [r.criterioId, r]));
    const avaliados: CriterioAvaliado[] = criterios.map((c) => ({
      id: c.id,
      nivel: c.nivel as Nivel,
      grupo: c.grupo,
      titulo: c.titulo,
      peso: Number(c.peso),
      nota: mapa.get(c.id)?.nota != null ? Number(mapa.get(c.id)!.nota) : null,
      status: mapa.get(c.id)?.status ?? "nao_iniciada",
    }));
    const { geral } = consolidarPorNivel(avaliados);
    const respondeuAlgo = respostas.some((r) => r.nota != null);
    resultados.push({ id: s.id, nome: s.nome, geral, temAvaliacao: respondeuAlgo });
  }
  return resultados;
}
