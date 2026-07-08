// ————————————————————————————————————————————————
// Motor de maturidade NEXO — fonte única de cálculo por setor.
//
// Cada nível tem sua própria mecânica:
//   VISÃO      → % de etapas com status "revisada" (checklist binário)
//   RECURSOS   → média dos grupos: RH (média dos colaboradores nos 3
//                eixos), Sistêmico (média dos sistemas avaliados),
//                Estrutural (média dos ativos)
//   PROCESSOS  → média das médias de cada processo (5 etapas)
//   RESULTADOS → resultado de processo aplicado: média dos processos
//                TIPADOS (desempenho, governança, monitoramento, kpi).
//                Processos tipo "outro" contam só em PROCESSOS.
//
// Usado pela visualização do setor, hub, dashboard e relatório.
// ————————————————————————————————————————————————
import "server-only";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  avaliacao, resposta, criterio,
  colaborador, avaliacaoColaborador, sistema, ativo,
  processo, avaliacaoProcesso,
} from "@/db/schema";
import { getEmpresa } from "./queries";
import type { Nivel, MaturidadeDTO } from "./tipos";

const arred = (n: number) => Math.round(n * 10) / 10;
const media = (vals: number[]): number | null =>
  vals.length ? arred(vals.reduce((a, b) => a + b, 0) / vals.length) : null;

export type MaturidadeSetor = MaturidadeDTO;

export async function maturidadeDoSetor(setorId: string): Promise<MaturidadeSetor> {
  const emp = await getEmpresa();
  const aval = await db.query.avaliacao.findFirst({
    where: and(eq(avaliacao.setorId, setorId), eq(avaliacao.empresaId, emp.id)),
    orderBy: [desc(avaliacao.criadoEm)],
  });

  const [criterios, respostas, colabs, notasColab, sistemas, ativos, procs, notasProc] =
    await Promise.all([
      db.query.criterio.findMany({ where: eq(criterio.empresaId, emp.id) }),
      aval ? db.query.resposta.findMany({ where: eq(resposta.avaliacaoId, aval.id) }) : Promise.resolve([]),
      db.query.colaborador.findMany({ where: eq(colaborador.setorId, setorId) }),
      aval ? db.query.avaliacaoColaborador.findMany({ where: eq(avaliacaoColaborador.avaliacaoId, aval.id) }) : Promise.resolve([]),
      db.query.sistema.findMany({ where: eq(sistema.setorId, setorId) }),
      db.query.ativo.findMany({ where: eq(ativo.setorId, setorId) }),
      db.query.processo.findMany({ where: eq(processo.setorId, setorId) }),
      db.query.avaliacaoProcesso.findMany(),
    ]);
  const mapaResp = new Map(respostas.map((r) => [r.criterioId, r]));

  // ——— VISÃO: checklist binário ———
  const itensVisao = criterios.filter((c) => c.nivel === "visao");
  const revisadas = itensVisao.filter((c) => mapaResp.get(c.id)?.status === "revisada").length;
  const pctVisao = itensVisao.length ? arred((revisadas / itensVisao.length) * 100) : 0;

  // ——— RECURSOS: média dos 3 grupos ———
  // RH: média por colaborador (3 eixos), depois média do time.
  const notasPorColab = new Map<string, number[]>();
  for (const n of notasColab) {
    if (n.nota == null) continue;
    const arr = notasPorColab.get(n.colaboradorId) ?? [];
    arr.push(Number(n.nota));
    notasPorColab.set(n.colaboradorId, arr);
  }
  const mediasColab = colabs
    .map((c) => media(notasPorColab.get(c.id) ?? []))
    .filter((m): m is number => m !== null);
  const mediaRh = media(mediasColab);
  // Sistêmico: média dos sistemas avaliados (necessidades ficam de fora
  // da média — elas viram recomendação, não nota).
  const mediaSist = media(
    sistemas.filter((s) => !s.ehNecessidade && s.nota != null).map((s) => Number(s.nota)),
  );
  // Estrutural: média dos ativos avaliados.
  const mediaEstr = media(ativos.filter((a) => a.nota != null).map((a) => Number(a.nota)));
  const gruposComDados = [mediaRh, mediaSist, mediaEstr].filter((m): m is number => m !== null);
  const pctTatico = media(gruposComDados) ?? 0;

  // ——— PROCESSOS: média das médias ———
  const notasPorProc = new Map<string, number[]>();
  const idsProcs = new Set(procs.map((p) => p.id));
  for (const n of notasProc) {
    if (n.nota == null || !idsProcs.has(n.processoId)) continue;
    const arr = notasPorProc.get(n.processoId) ?? [];
    arr.push(Number(n.nota));
    notasPorProc.set(n.processoId, arr);
  }
  const porProcesso = procs.map((p) => ({ nome: p.nome, media: media(notasPorProc.get(p.id) ?? []) }));
  const pctProcessos = media(porProcesso.map((p) => p.media).filter((m): m is number => m !== null)) ?? 0;

  // ——— RESULTADOS: resultado de processo aplicado ———
  // Cada tópico mostra a média dos processos daquele tipo.
  const TOPICOS_RESULTADO: { tipo: string; titulo: string }[] = [
    { tipo: "desempenho", titulo: "Resultado da Avaliação de desempenho" },
    { tipo: "governanca", titulo: "Resultado de Governança e controles" },
    { tipo: "monitoramento", titulo: "Resultado do Monitoramento contínuo" },
    { tipo: "kpi", titulo: "Resultado de KPI" },
  ];
  const itensResultado = TOPICOS_RESULTADO.map((t) => {
    const doTipo = procs
      .filter((p) => p.tipo === t.tipo)
      .map((p) => media(notasPorProc.get(p.id) ?? []))
      .filter((m): m is number => m !== null);
    return { titulo: t.titulo, nota: media(doTipo) };
  });
  const pctResultados = media(itensResultado.map((i) => i.nota).filter((n): n is number => n !== null)) ?? 0;

  const porNivel: Record<Nivel, number> = {
    visao: pctVisao,
    tatico: pctTatico,
    processos: pctProcessos,
    resultados: pctResultados,
  };
  const geral = arred((pctVisao + pctTatico + pctProcessos + pctResultados) / 4);

  // Pendências: o que ainda não foi tocado.
  const pendencias =
    (itensVisao.length - itensVisao.filter((c) => mapaResp.has(c.id)).length) +
    colabs.filter((c) => !notasPorColab.has(c.id)).length +
    sistemas.filter((s) => !s.ehNecessidade && s.nota == null).length +
    ativos.filter((a) => a.nota == null).length +
    porProcesso.filter((p) => p.media === null).length +
    itensResultado.filter((i) => i.nota === null).length;

  return {
    porNivel,
    geral,
    detalhe: {
      visao: { revisadas, total: itensVisao.length },
      tatico: { rh: mediaRh, sistemico: mediaSist, estrutural: mediaEstr },
      processos: { porProcesso },
      resultados: { itens: itensResultado },
    },
    pendencias,
  };
}
