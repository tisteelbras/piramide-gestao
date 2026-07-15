"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  indicador, recomendacao, sistema,
  colaborador, avaliacaoColaborador, avaliacao, processo,
} from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa } from "@/features/assessments/queries";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import { gerarRecomendacoes, type RetratoSetor, type RecomendacaoGerada } from "@/domain/recomendacoes";
import { atingimentoKpi, type DirecaoIndicador } from "@/domain/indicadores";
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
// Cada indicador criado na etapa "Indicadores de Desempenho" (Visão) também
// cria um PROCESSO do tipo 'kpi' no N3, com o mesmo nome. Assim o indicador
// aparece como processo mensurável em Processos e seu atingimento alimenta o
// "Resultado de KPI" no N4 — os três níveis conectados por um único cadastro.
export async function addIndicador(setorId: string, nome: string, ehAusencia = false) {
  const emp = await guard();
  const limpo = nome.trim();
  if (!limpo) return { ok: false as const };
  const [proc] = await db.insert(processo)
    .values({ empresaId: emp.id, setorId, nome: limpo, tipo: "kpi" as const })
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

/** Medição do KPI: meta, valor atual, unidade e direção. É daqui que sai a
 *  nota de "Resultado de KPI" no N4 — sem meta e valor, o KPI não mede nada.
 *  Campos vazios voltam a null (= não medido), nunca viram 0. */
export async function salvarMedicaoIndicador(
  id: string,
  dados: {
    meta?: number | null;
    valorAtual?: number | null;
    unidade?: string | null;
    direcao?: DirecaoIndicador;
  },
) {
  await guard();
  const patch: Record<string, unknown> = { atualizadoEm: new Date() };
  if ("meta" in dados) patch.meta = dados.meta == null ? null : String(dados.meta);
  if ("valorAtual" in dados) patch.valorAtual = dados.valorAtual == null ? null : String(dados.valorAtual);
  if ("unidade" in dados) patch.unidade = dados.unidade?.trim() || null;
  if ("direcao" in dados && dados.direcao) patch.direcao = dados.direcao;

  await db.update(indicador).set(patch).where(eq(indicador.id, id));
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

  // KPIs: ausente (nem se mede), sem medição (declarado mas vazio) e
  // abaixo da meta (medido e doendo) são três problemas diferentes.
  const kpisMedidos = kpis
    .filter((k) => !k.ehAusencia)
    .map((k) => ({
      nome: k.nome,
      atingimento: atingimentoKpi({
        meta: k.meta == null ? null : Number(k.meta),
        valorAtual: k.valorAtual == null ? null : Number(k.valorAtual),
        direcao: k.direcao,
        ehAusencia: false,
      }),
    }));

  const retrato: RetratoSetor = {
    maturidadePorNivel: m.porNivel,
    sistemasFaltantes: sistemas.filter((s) => s.ehNecessidade).map((s) => s.nome),
    kpisAusentes: kpis.filter((k) => k.ehAusencia).map((k) => k.nome),
    kpisSemMedicao: kpisMedidos.filter((k) => k.atingimento === null).map((k) => k.nome),
    kpisAbaixoDaMeta: kpisMedidos
      .filter((k): k is { nome: string; atingimento: number } => k.atingimento !== null && k.atingimento < 80)
      .map((k) => ({ nome: k.nome, atingimento: Math.round(k.atingimento) })),
    processosFracos: m.detalhe.processos.porProcesso
      .filter((p): p is { nome: string; media: number } => p.media !== null && p.media < 40)
      .map((p) => ({ nome: p.nome, media: Math.round(p.media) })),
    colaboradoresBaixaMedia,
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
