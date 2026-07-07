"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  indicador, recomendacao, sistema, processo, avaliacaoProcesso,
  colaborador, avaliacaoColaborador, criterio, resposta, avaliacao,
} from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import { consolidarPorNivel } from "@/features/assessments/consolidar";
import { gerarRecomendacoes, type RetratoSetor } from "@/domain/recomendacoes";
import type { CriterioAvaliado, Nivel } from "@/features/assessments/tipos";

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

// ————— Gerar diagnóstico (recomendações por regra) —————
export async function gerarDiagnostico(setorId: string) {
  const emp = await guard();

  // 1) Monta o retrato do setor a partir do banco.
  const aval = await db.query.avaliacao.findFirst({
    where: and(eq(avaliacao.setorId, setorId), eq(avaliacao.empresaId, emp.id)),
    orderBy: (a, { desc }) => [desc(a.criadoEm)],
  });

  const [criterios, respostas, sistemas, procs, notasProc, colabs, notasColab, kpis] = await Promise.all([
    db.query.criterio.findMany({ where: eq(criterio.empresaId, emp.id) }),
    aval ? db.query.resposta.findMany({ where: eq(resposta.avaliacaoId, aval.id) }) : Promise.resolve([]),
    db.query.sistema.findMany({ where: eq(sistema.setorId, setorId) }),
    db.query.processo.findMany({ where: eq(processo.setorId, setorId) }),
    db.query.avaliacaoProcesso.findMany(),
    db.query.colaborador.findMany({ where: eq(colaborador.setorId, setorId) }),
    aval ? db.query.avaliacaoColaborador.findMany({ where: eq(avaliacaoColaborador.avaliacaoId, aval.id) }) : Promise.resolve([]),
    db.query.indicador.findMany({ where: eq(indicador.setorId, setorId) }),
  ]);

  // Maturidade por nível (via consolidação dos critérios)
  const mapaResp = new Map(respostas.map((r) => [r.criterioId, r]));
  const avaliados: CriterioAvaliado[] = criterios.map((c) => ({
    id: c.id, nivel: c.nivel as Nivel, grupo: c.grupo, titulo: c.titulo, peso: Number(c.peso),
    nota: mapaResp.get(c.id)?.nota != null ? Number(mapaResp.get(c.id)!.nota) : null,
    status: mapaResp.get(c.id)?.status ?? "nao_iniciada",
  }));
  const { porNivel } = consolidarPorNivel(avaliados);
  const maturidadePorNivel = {
    visao: porNivel.visao.preenchimento,
    tatico: porNivel.tatico.preenchimento,
    processos: porNivel.processos.preenchimento,
    resultados: porNivel.resultados.preenchimento,
  };

  // Processos fracos (média < 40)
  const notasPorProc = new Map<string, number[]>();
  for (const n of notasProc) {
    if (n.nota == null) continue;
    const arr = notasPorProc.get(n.processoId) ?? [];
    arr.push(Number(n.nota));
    notasPorProc.set(n.processoId, arr);
  }
  const processosFracos = procs
    .map((p) => {
      const arr = notasPorProc.get(p.id) ?? [];
      const media = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      return { nome: p.nome, media };
    })
    .filter((p) => p.media < 40 && (notasPorProc.get(procs.find((x) => x.nome === p.nome)!.id)?.length ?? 0) > 0);

  // Colaboradores com média baixa (< 40)
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
    maturidadePorNivel,
    sistemasFaltantes: sistemas.filter((s) => s.ehNecessidade).map((s) => s.nome),
    kpisAusentes: kpis.filter((k) => k.ehAusencia).map((k) => k.nome),
    processosFracos,
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
