import "server-only";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { indicador, recomendacao, cicloSnapshot } from "@/db/schema";
import { atingimentoKpi } from "@/domain/indicadores";
import { retratoEvolucao, textoPersistencia } from "@/domain/evolucao";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import { getEmpresa } from "@/features/assessments/queries";
import type { IndicadorItem, RecomendacaoItem, RetratoEvolucao } from "./tipos";

export type { IndicadorItem, RecomendacaoItem, ResultadosDoSetor } from "./tipos";

export async function carregarResultados(setorId: string) {
  const emp = await getEmpresa();
  const [inds, recs, snaps, maturidade] = await Promise.all([
    db.query.indicador.findMany({ where: eq(indicador.setorId, setorId), orderBy: (i, { asc }) => [asc(i.nome)] }),
    db.query.recomendacao.findMany({ where: eq(recomendacao.setorId, setorId), orderBy: (r, { asc }) => [asc(r.prioridade)] }),
    // Os 2 últimos fechamentos deste setor: o anterior é a base de comparação.
    db.query.cicloSnapshot.findMany({
      where: and(eq(cicloSnapshot.setorId, setorId), eq(cicloSnapshot.empresaId, emp.id)),
      orderBy: [desc(cicloSnapshot.fechadoEm)],
      limit: 2,
    }),
    maturidadeDoSetor(setorId),
  ]);

  // ——— Evolução: estado atual × último snapshot ———
  // O snapshot mais recente é a "foto" com que comparamos o vivo. (Se o
  // usuário acabou de fechar um ciclo, snaps[0] é essa foto e reflete o
  // estado do fechamento; a comparação vira ~zero até o próximo ciclo.)
  const anterior = snaps[0]
    ? {
        data: snaps[0].fechadoEm.toISOString(),
        geral: Number(snaps[0].geral),
        visao: Number(snaps[0].visao),
        tatico: Number(snaps[0].tatico),
        processos: Number(snaps[0].processos),
        resultados: Number(snaps[0].resultados),
      }
    : null;
  const evolucao: RetratoEvolucao | null = anterior
    ? retratoEvolucao(
        {
          geral: maturidade.geral,
          visao: maturidade.porNivel.visao,
          tatico: maturidade.porNivel.tatico,
          processos: maturidade.porNivel.processos,
          resultados: maturidade.porNivel.resultados,
        },
        anterior,
      )
    : null;

  // ——— Persistência: há quantos fechamentos a recomendação está aberta ———
  // Uma recomendação criada ANTES de um fechamento e ainda presente depois
  // "sobreviveu" àquele ciclo. Contamos quantos fechamentos ocorreram desde
  // que ela foi criada.
  const fechamentos = await db.query.cicloSnapshot.findMany({
    where: and(eq(cicloSnapshot.setorId, setorId), eq(cicloSnapshot.empresaId, emp.id)),
    columns: { fechadoEm: true },
    orderBy: [desc(cicloSnapshot.fechadoEm)],
  });
  // Datas distintas de fechamento (um fechamento gera 1 linha por setor).
  const datasFechamento = [...new Set(fechamentos.map((f) => f.fechadoEm.getTime()))];
  const ciclosDesde = (criadoEm: Date) => datasFechamento.filter((t) => t > criadoEm.getTime()).length;

  return {
    indicadores: inds.map((i): IndicadorItem => {
      const medida = {
        meta: i.meta != null ? Number(i.meta) : null,
        valorAtual: i.valorAtual != null ? Number(i.valorAtual) : null,
        direcao: i.direcao,
        ehAusencia: i.ehAusencia,
      };
      return {
        id: i.id,
        nome: i.nome,
        unidade: i.unidade,
        ...medida,
        atingimento: atingimentoKpi(medida),
      };
    }),
    recomendacoes: recs.map((r): RecomendacaoItem => ({
      id: r.id,
      titulo: r.titulo,
      detalhe: r.detalhe,
      prioridade: Number(r.prioridade),
      impactoEsperado: r.impactoEsperado,
      origem: r.origem,
      persistencia: textoPersistencia(ciclosDesde(r.criadoEm)),
    })),
    evolucao,
  };
}
