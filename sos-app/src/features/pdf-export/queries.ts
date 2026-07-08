import "server-only";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { avaliacao, resposta, criterio, recomendacao, colaborador, avaliacaoColaborador, sistema, ativo } from "@/db/schema";
import { getEmpresa, getSetor } from "@/features/assessments/queries";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import { grauMaturidade, ROTULO_MATURIDADE } from "@/domain/maturidade";
import { NIVEIS } from "@/features/assessments/tipos";

export type LinhaRelatorio = { titulo: string; valor: string; ok?: boolean };

export async function montarRelatorio(setorId: string) {
  const emp = await getEmpresa();
  const setorRow = await getSetor(setorId);
  if (!setorRow) return null;

  const m = await maturidadeDoSetor(setorId);
  const aval = await db.query.avaliacao.findFirst({
    where: and(eq(avaliacao.setorId, setorId), eq(avaliacao.empresaId, emp.id)),
    orderBy: [desc(avaliacao.criadoEm)],
  });
  const [criterios, respostas, recs, colabs, notasColab, sistemas, ativos] = await Promise.all([
    db.query.criterio.findMany({ where: eq(criterio.empresaId, emp.id), orderBy: (c, { asc }) => [asc(c.ordem)] }),
    aval ? db.query.resposta.findMany({ where: eq(resposta.avaliacaoId, aval.id) }) : Promise.resolve([]),
    db.query.recomendacao.findMany({ where: eq(recomendacao.setorId, setorId), orderBy: (r, { asc }) => [asc(r.prioridade)] }),
    db.query.colaborador.findMany({ where: eq(colaborador.setorId, setorId) }),
    aval ? db.query.avaliacaoColaborador.findMany({ where: eq(avaliacaoColaborador.avaliacaoId, aval.id) }) : Promise.resolve([]),
    db.query.sistema.findMany({ where: eq(sistema.setorId, setorId) }),
    db.query.ativo.findMany({ where: eq(ativo.setorId, setorId) }),
  ]);
  const mapaResp = new Map(respostas.map((r) => [r.criterioId, r]));
  const fmt = (v: number | null) => (v != null ? `${Math.round(v)}%` : "—");

  // Linhas por nível, no modelo NEXO.
  const notasPorColab = new Map<string, number[]>();
  for (const n of notasColab) {
    if (n.nota == null) continue;
    const arr = notasPorColab.get(n.colaboradorId) ?? [];
    arr.push(Number(n.nota));
    notasPorColab.set(n.colaboradorId, arr);
  }
  const mediaDe = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

  const linhasPorNivel: Record<string, LinhaRelatorio[]> = {
    visao: criterios
      .filter((c) => c.nivel === "visao")
      .map((c) => {
        const rev = mapaResp.get(c.id)?.status === "revisada";
        return { titulo: c.titulo, valor: rev ? "Revisado" : "Não revisado", ok: rev };
      }),
    tatico: [
      { titulo: "Recursos Humanos (média do time)", valor: fmt(m.detalhe.tatico.rh) },
      ...colabs.map((c) => ({ titulo: `— ${c.nome}`, valor: fmt(mediaDe(notasPorColab.get(c.id) ?? [])) })),
      { titulo: "Recursos Sistêmicos (média)", valor: fmt(m.detalhe.tatico.sistemico) },
      ...sistemas.map((s) => ({
        titulo: `— ${s.nome}${s.ehNecessidade ? " (necessidade)" : ""}`,
        valor: s.ehNecessidade ? "faltante" : fmt(s.nota != null ? Number(s.nota) : null),
      })),
      { titulo: "Recursos Estruturais (média)", valor: fmt(m.detalhe.tatico.estrutural) },
      ...ativos.map((a) => ({ titulo: `— ${a.nome}`, valor: fmt(a.nota != null ? Number(a.nota) : null) })),
    ],
    processos: m.detalhe.processos.porProcesso.length
      ? m.detalhe.processos.porProcesso.map((p) => ({ titulo: p.nome, valor: fmt(p.media) }))
      : [{ titulo: "Nenhum processo cadastrado", valor: "—" }],
    resultados: m.detalhe.resultados.itens.map((i) => ({ titulo: i.titulo, valor: fmt(i.nota) })),
  };

  return {
    empresa: emp.nome,
    setor: setorRow.nome,
    data: new Date(),
    geral: m.geral,
    grau: ROTULO_MATURIDADE[grauMaturidade(m.geral)],
    niveis: NIVEIS.map((n) => ({
      id: n.id,
      titulo: n.titulo,
      tag: n.tag,
      cor: n.cor,
      pct: m.porNivel[n.id],
      grau: ROTULO_MATURIDADE[grauMaturidade(m.porNivel[n.id])],
      linhas: linhasPorNivel[n.id] ?? [],
    })),
    recomendacoes: recs.map((r) => ({ titulo: r.titulo, detalhe: r.detalhe, prioridade: Number(r.prioridade), impacto: r.impactoEsperado })),
  };
}

export type Relatorio = NonNullable<Awaited<ReturnType<typeof montarRelatorio>>>;
