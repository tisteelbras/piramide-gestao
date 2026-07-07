import "server-only";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { avaliacao, resposta, criterio, recomendacao } from "@/db/schema";
import { getEmpresa, getSetor } from "@/features/assessments/queries";
import { consolidarPorNivel } from "@/features/assessments/consolidar";
import { grauMaturidade, ROTULO_MATURIDADE } from "@/domain/maturidade";
import { NIVEIS, type CriterioAvaliado, type Nivel } from "@/features/assessments/tipos";

export async function montarRelatorio(setorId: string) {
  const emp = await getEmpresa();
  const setorRow = await getSetor(setorId);
  if (!setorRow) return null;

  const aval = await db.query.avaliacao.findFirst({
    where: and(eq(avaliacao.setorId, setorId), eq(avaliacao.empresaId, emp.id)),
    orderBy: [desc(avaliacao.criadoEm)],
  });
  const [criterios, respostas, recs] = await Promise.all([
    db.query.criterio.findMany({ where: eq(criterio.empresaId, emp.id), orderBy: (c, { asc }) => [asc(c.ordem)] }),
    aval ? db.query.resposta.findMany({ where: eq(resposta.avaliacaoId, aval.id) }) : Promise.resolve([]),
    db.query.recomendacao.findMany({ where: eq(recomendacao.setorId, setorId), orderBy: (r, { asc }) => [asc(r.prioridade)] }),
  ]);

  const mapa = new Map(respostas.map((r) => [r.criterioId, r]));
  const avaliados: CriterioAvaliado[] = criterios.map((c) => ({
    id: c.id, nivel: c.nivel as Nivel, grupo: c.grupo, titulo: c.titulo, peso: Number(c.peso),
    nota: mapa.get(c.id)?.nota != null ? Number(mapa.get(c.id)!.nota) : null,
    status: mapa.get(c.id)?.status ?? "nao_iniciada",
  }));
  const { porNivel, geral } = consolidarPorNivel(avaliados);

  return {
    empresa: emp.nome,
    setor: setorRow.nome,
    data: new Date(),
    geral,
    grau: ROTULO_MATURIDADE[grauMaturidade(geral)],
    niveis: NIVEIS.map((n) => ({
      id: n.id, titulo: n.titulo, tag: n.tag, cor: n.cor,
      nota: porNivel[n.id].nota,
      preenchimento: porNivel[n.id].preenchimento,
      conclusao: porNivel[n.id].conclusao,
      grau: ROTULO_MATURIDADE[grauMaturidade(porNivel[n.id].preenchimento)],
      criterios: avaliados.filter((c) => c.nivel === n.id).map((c) => ({ titulo: c.titulo, nota: c.nota, status: c.status })),
    })),
    recomendacoes: recs.map((r) => ({ titulo: r.titulo, detalhe: r.detalhe, prioridade: Number(r.prioridade), impacto: r.impactoEsperado })),
  };
}

export type Relatorio = NonNullable<Awaited<ReturnType<typeof montarRelatorio>>>;
