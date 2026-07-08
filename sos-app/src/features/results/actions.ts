"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  indicador, recomendacao, sistema,
  colaborador, avaliacaoColaborador, avaliacao,
} from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import { gerarRecomendacoes, type RetratoSetor } from "@/domain/recomendacoes";

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  return getEmpresa();
}
const refresh = () => revalidatePath("/setor/[id]", "page");

// ————— Indicadores (KPIs) —————
export async function addIndicador(setorId: string, nome: string, ehAusencia = false) {
  const emp = await guard();
  if (!nome.trim()) return { ok: false as const };
  await db.insert(indicador).values({ empresaId: emp.id, setorId, nome: nome.trim(), ehAusencia });
  refresh();
  return { ok: true as const };
}
export async function removeIndicador(id: string) {
  await guard();
  await db.delete(indicador).where(eq(indicador.id, id));
  refresh();
  return { ok: true as const };
}
export async function toggleAusenciaIndicador(id: string, ehAusencia: boolean) {
  await guard();
  await db.update(indicador).set({ ehAusencia, atualizadoEm: new Date() }).where(eq(indicador.id, id));
  refresh();
  return { ok: true as const };
}

// ————— Gerar diagnóstico (recomendações por regra, modelo NEXO) —————
export async function gerarDiagnostico(setorId: string) {
  const emp = await guard();

  // 1) Retrato do setor: maturidade pelo motor NEXO + gatilhos diretos.
  const m = await maturidadeDoSetor(setorId);
  const aval = await db.query.avaliacao.findFirst({
    where: and(eq(avaliacao.setorId, setorId), eq(avaliacao.empresaId, emp.id)),
    orderBy: (a, { desc }) => [desc(a.criadoEm)],
  });
  const [sistemas, colabs, notasColab, kpis] = await Promise.all([
    db.query.sistema.findMany({ where: eq(sistema.setorId, setorId) }),
    db.query.colaborador.findMany({ where: eq(colaborador.setorId, setorId) }),
    aval ? db.query.avaliacaoColaborador.findMany({ where: eq(avaliacaoColaborador.avaliacaoId, aval.id) }) : Promise.resolve([]),
    db.query.indicador.findMany({ where: eq(indicador.setorId, setorId) }),
  ]);

  // Colaboradores com média baixa (< 40).
  const notasPorColab = new Map<string, number[]>();
  for (const n of notasColab) {
    if (n.nota == null) continue;
    const arr = notasPorColab.get(n.colaboradorId) ?? [];
    arr.push(Number(n.nota));
    notasPorColab.set(n.colaboradorId, arr);
  }
  const colaboradoresBaixaMedia = colabs
    .filter((c) => {
      const arr = notasPorColab.get(c.id) ?? [];
      if (!arr.length) return false;
      return arr.reduce((a, b) => a + b, 0) / arr.length < 40;
    })
    .map((c) => c.nome);

  const retrato: RetratoSetor = {
    maturidadePorNivel: m.porNivel,
    sistemasFaltantes: sistemas.filter((s) => s.ehNecessidade).map((s) => s.nome),
    kpisAusentes: kpis.filter((k) => k.ehAusencia).map((k) => k.nome),
    processosFracos: m.detalhe.processos.porProcesso
      .filter((p): p is { nome: string; media: number } => p.media !== null && p.media < 40)
      .map((p) => ({ nome: p.nome, media: Math.round(p.media) })),
    colaboradoresBaixaMedia,
  };

  // 2) Gera e regrava as recomendações (origem 'regra') deste setor.
  const geradas = gerarRecomendacoes(retrato);
  await db.delete(recomendacao).where(and(eq(recomendacao.setorId, setorId), eq(recomendacao.origem, "regra")));
  if (geradas.length > 0) {
    await db.insert(recomendacao).values(
      geradas.map((g) => ({
        empresaId: emp.id, setorId, titulo: g.titulo, detalhe: g.detalhe,
        prioridade: String(g.prioridade), impactoEsperado: g.impactoEsperado, origem: "regra" as const,
      })),
    );
  }
  refresh();
  return { ok: true as const, total: geradas.length };
}
