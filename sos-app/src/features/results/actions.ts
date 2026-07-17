"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { inArray } from "drizzle-orm";
import {
  indicador, recomendacao, sistema,
  colaborador, avaliacaoColaborador, avaliacao, processo, resposta,
  avaliacaoProcesso,
} from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import { gerarRecomendacoes, type RetratoSetor, type RecomendacaoGerada } from "@/domain/recomendacoes";
import { lerConfigIA } from "@/domain/ia/provedor";
import { gerarRecomendacoesIA } from "@/domain/ia/recomendacoes-ia";

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  return getEmpresa();
}
const refresh = () => {
  revalidatePath("/setor/[id]", "page");
  revalidatePath("/setor/[id]/avaliar", "page");
  revalidatePath("/setor/[id]/indicadores", "page");
};

// ————— Indicadores (KPIs) —————
// Cada indicador declarado na etapa "Indicadores de Desempenho" (Visão) cria
// um PROCESSO do tipo 'kpi' no N3: "a execução que a área faz para atingir
// aquele KPI". É esse processo que é medido (5 eixos) e forma o "Resultado de
// KPI" no N4. O valor do KPI em si é medido fora do NEXO — aqui só existe o
// indicador e o processo que persegue a meta.
export async function addIndicador(setorId: string, nome: string, ehAusencia = false) {
  const emp = await guard();
  const limpo = nome.trim();
  if (!limpo) return { ok: false as const };
  const [proc] = await db.insert(processo)
    .values({ empresaId: emp.id, setorId, nome: `Execução: ${limpo}`, tipo: "kpi" as const })
    .returning();
  await db.insert(indicador).values({ empresaId: emp.id, setorId, nome: limpo, ehAusencia, processoId: proc.id });
  refresh();
  return { ok: true as const };
}
export async function removeIndicador(id: string) {
  await guard();
  // Apaga o processo 'kpi' vinculado junto com o indicador.
  const ind = await db.query.indicador.findFirst({ where: eq(indicador.id, id) });
  await db.delete(indicador).where(eq(indicador.id, id));
  if (ind?.processoId) {
    await db.delete(processo).where(eq(processo.id, ind.processoId));
  }
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
  const [sistemas, colabs, notasColab, kpis, respostas] = await Promise.all([
    db.query.sistema.findMany({ where: eq(sistema.setorId, setorId) }),
    db.query.colaborador.findMany({ where: eq(colaborador.setorId, setorId) }),
    aval ? db.query.avaliacaoColaborador.findMany({ where: eq(avaliacaoColaborador.avaliacaoId, aval.id) }) : Promise.resolve([]),
    db.query.indicador.findMany({ where: eq(indicador.setorId, setorId) }),
    aval ? db.query.resposta.findMany({ where: eq(resposta.avaliacaoId, aval.id) }) : Promise.resolve([]),
  ]);

  // Check obrigatório da Estrutura: Política Comercial confirmada em alguma
  // resposta? (o check vive na resposta da etapa Estrutura Organizacional).
  const politicaComercialFaltante = !respostas.some((r) => r.checks?.politica_comercial === true);

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

  // KPIs declarados (não ausentes): cruzamos cada um com a maturidade do
  // PROCESSO que o executa. Sem processo avaliado = não se sabe se a área
  // faz o que leva ao indicador; processo fraco = a execução está doendo.
  const kpisDeclarados = kpis.filter((k) => !k.ehAusencia && k.processoId);
  const idsProcKpi = kpisDeclarados.map((k) => k.processoId!) as string[];
  const notasProcKpi = idsProcKpi.length
    ? await db.query.avaliacaoProcesso.findMany({ where: inArray(avaliacaoProcesso.processoId, idsProcKpi) })
    : [];
  const mediaProc = new Map<string, number>();
  {
    const acc = new Map<string, number[]>();
    for (const n of notasProcKpi) {
      if (n.nota == null) continue;
      const arr = acc.get(n.processoId) ?? [];
      arr.push(Number(n.nota));
      acc.set(n.processoId, arr);
    }
    for (const [pid, arr] of acc) mediaProc.set(pid, arr.reduce((a, b) => a + b, 0) / arr.length);
  }
  const kpisComProc = kpisDeclarados.map((k) => ({
    nome: k.nome,
    media: mediaProc.has(k.processoId!) ? mediaProc.get(k.processoId!)! : null,
  }));

  const retrato: RetratoSetor = {
    maturidadePorNivel: m.porNivel,
    sistemasFaltantes: sistemas.filter((s) => s.ehNecessidade).map((s) => s.nome),
    kpisAusentes: kpis.filter((k) => k.ehAusencia).map((k) => k.nome),
    kpisSemProcessoAvaliado: kpisComProc.filter((k) => k.media === null).map((k) => k.nome),
    kpisProcessoFraco: kpisComProc
      .filter((k): k is { nome: string; media: number } => k.media !== null && k.media < 40)
      .map((k) => ({ nome: k.nome, media: Math.round(k.media) })),
    processosFracos: m.detalhe.processos.porProcesso
      .filter((p): p is { nome: string; media: number } => p.media !== null && p.media < 40)
      .map((p) => ({ nome: p.nome, media: Math.round(p.media) })),
    colaboradoresBaixaMedia,
    politicaComercialFaltante,
  };

  // 2) Regrava as recomendações POR ORIGEM, preservando a data das que
  //    reaparecem (o título é a identidade — é assim que "persiste há N
  //    ciclos" funciona sem zerar a cada rodada).
  const regravar = async (origem: "regra" | "ia", geradas: RecomendacaoGerada[]) => {
    const existentes = await db.query.recomendacao.findMany({
      where: and(eq(recomendacao.setorId, setorId), eq(recomendacao.origem, origem)),
    });
    const dataPorTitulo = new Map(existentes.map((e) => [e.titulo, e.criadoEm]));
    await db.delete(recomendacao).where(and(eq(recomendacao.setorId, setorId), eq(recomendacao.origem, origem)));
    if (geradas.length > 0) {
      await db.insert(recomendacao).values(
        geradas.map((g) => ({
          empresaId: emp.id, setorId, titulo: g.titulo, detalhe: g.detalhe,
          prioridade: String(g.prioridade), impactoEsperado: g.impactoEsperado, origem,
          criadoEm: dataPorTitulo.get(g.titulo) ?? new Date(),
        })),
      );
    }
  };

  // Regra: sempre roda (determinística, offline).
  const geradas = gerarRecomendacoes(retrato);
  await regravar("regra", geradas);

  // IA: SOMA às regras (origem 'ia'). Se não houver chave ou a IA falhar,
  // não quebra nada — as recomendações 'ia' anteriores são limpas e o
  // diagnóstico por regra segue de pé. Motivo volta para a UI avisar.
  const cfgIA = lerConfigIA();
  const resIA = await gerarRecomendacoesIA(retrato, cfgIA);
  await regravar("ia", resIA.recomendacoes);

  refresh();
  return {
    ok: true as const,
    total: geradas.length + resIA.recomendacoes.length,
    ia: { motivo: resIA.motivo, total: resIA.recomendacoes.length },
  };
}
