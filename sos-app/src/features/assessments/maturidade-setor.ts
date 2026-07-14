// ————————————————————————————————————————————————
// Motor de maturidade NEXO — fonte única de cálculo por setor.
//
// Cada nível tem sua própria mecânica:
//   VISÃO      → % de etapas com status "revisada" (checklist binário)
//   RECURSOS   → média dos grupos: RH (média dos colaboradores nos 4
//                eixos), Sistêmico (média dos sistemas avaliados),
//                Estrutural (média dos ativos)
//   PROCESSOS  → média das médias de cada processo (5 etapas)
//   RESULTADOS → resultado de processo aplicado: média dos processos
//                TIPADOS (um tópico por tipo com resultado — a lista vive
//                em features/processes/tipos.ts). Processos tipo "outro"
//                contam só em PROCESSOS.
//                Exceção: "Resultado de KPI" não vem de processo, e sim do
//                ATINGIMENTO dos indicadores cadastrados (valor × meta).
//
// Usado pela visualização do setor, hub, dashboard e relatório.
// ————————————————————————————————————————————————
import "server-only";
import { cache } from "react";
import { and, eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  avaliacao, resposta, criterio,
  colaborador, avaliacaoColaborador, sistema, ativo,
  processo, avaliacaoProcesso, indicador,
} from "@/db/schema";
import { TIPOS_COM_RESULTADO } from "@/features/processes/tipos";
import { notaResultadoKpi } from "@/domain/indicadores";
import { getEmpresa } from "./queries";
import type { Nivel, MaturidadeDTO } from "./tipos";

const arred = (n: number) => Math.round(n * 10) / 10;
const media = (vals: number[]): number | null =>
  vals.length ? arred(vals.reduce((a, b) => a + b, 0) / vals.length) : null;

export type MaturidadeSetor = MaturidadeDTO;

// cache() deduplica por request: a home calcula a maturidade de cada
// setor duas vezes (dashboard + governança); com isso, roda uma só. As
// mutações revalidam o path, então o request seguinte recalcula.
export const maturidadeDoSetor = cache(async (setorId: string): Promise<MaturidadeSetor> => {
  const emp = await getEmpresa();
  const aval = await db.query.avaliacao.findFirst({
    where: and(eq(avaliacao.setorId, setorId), eq(avaliacao.empresaId, emp.id)),
    orderBy: [desc(avaliacao.criadoEm)],
  });

  // Processos do setor primeiro: assim buscamos SÓ as notas desses
  // processos (antes puxávamos avaliacao_processo inteira da empresa).
  const procs = await db.query.processo.findMany({ where: eq(processo.setorId, setorId) });
  const idsProcsBanco = procs.map((p) => p.id);

  const [criterios, respostas, colabs, notasColab, sistemas, ativos, notasProc, kpis] =
    await Promise.all([
      db.query.criterio.findMany({ where: eq(criterio.empresaId, emp.id) }),
      aval ? db.query.resposta.findMany({ where: eq(resposta.avaliacaoId, aval.id) }) : Promise.resolve([]),
      db.query.colaborador.findMany({ where: eq(colaborador.setorId, setorId) }),
      aval ? db.query.avaliacaoColaborador.findMany({ where: eq(avaliacaoColaborador.avaliacaoId, aval.id) }) : Promise.resolve([]),
      db.query.sistema.findMany({ where: eq(sistema.setorId, setorId) }),
      db.query.ativo.findMany({ where: eq(ativo.setorId, setorId) }),
      idsProcsBanco.length
        ? db.query.avaliacaoProcesso.findMany({ where: inArray(avaliacaoProcesso.processoId, idsProcsBanco) })
        : Promise.resolve([]),
      db.query.indicador.findMany({ where: eq(indicador.setorId, setorId) }),
    ]);
  const mapaResp = new Map(respostas.map((r) => [r.criterioId, r]));

  // ——— VISÃO: checklist binário ———
  const itensVisao = criterios.filter((c) => c.nivel === "visao");
  const revisadas = itensVisao.filter((c) => mapaResp.get(c.id)?.status === "revisada").length;
  const pctVisao = itensVisao.length ? arred((revisadas / itensVisao.length) * 100) : 0;

  // ——— RECURSOS: média dos 3 grupos ———
  // RH: média por colaborador (4 eixos), depois média do time.
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
  // Um tópico por tipo de processo que tem resultado (a lista é a fonte
  // única em features/processes/tipos.ts). Cada tópico mostra a média dos
  // processos daquele tipo.
  //
  // "Resultado de KPI" é a exceção: não vem de processo, vem do
  // ATINGIMENTO dos indicadores (valor × meta, respeitando a direção).
  // É o que amarra o KPI ao nível — cadastrar indicador sem medir não
  // produz resultado nenhum.
  const notaKpi = notaResultadoKpi(
    kpis.map((k) => ({
      meta: k.meta == null ? null : Number(k.meta),
      valorAtual: k.valorAtual == null ? null : Number(k.valorAtual),
      direcao: k.direcao,
      ehAusencia: k.ehAusencia,
    })),
  );

  const itensResultado = TIPOS_COM_RESULTADO.map((t) => {
    if (t.id === "kpi") return { titulo: t.resultado, nota: notaKpi };
    // Processo tipado sem notas conta como 0 — existir sem ser executado
    // derruba o resultado e provoca o preenchimento. `nota` só fica null
    // quando não há nenhum processo do tipo.
    const doTipo = procs
      .filter((p) => p.tipo === t.id)
      .map((p) => media(notasPorProc.get(p.id) ?? []) ?? 0);
    return { titulo: t.resultado, nota: media(doTipo) };
  });
  const pctResultados = media(itensResultado.map((i) => i.nota).filter((n): n is number => n !== null)) ?? 0;

  const porNivel: Record<Nivel, number> = {
    visao: pctVisao,
    tatico: pctTatico,
    processos: pctProcessos,
    resultados: pctResultados,
  };
  const geral = arred((pctVisao + pctTatico + pctProcessos + pctResultados) / 4);

  // Pendências: o que ainda não foi tocado. KPI cadastrado sem meta ou sem
  // valor atual é pendência — está declarado, mas ainda não mede nada.
  // (KPI marcado como ausente NÃO é pendência: a ausência já é a resposta,
  // e ela vira nota 0 no resultado.)
  const kpisNaoMedidos = kpis.filter(
    (k) => !k.ehAusencia && (k.meta == null || k.valorAtual == null),
  ).length;
  const pendencias =
    (itensVisao.length - itensVisao.filter((c) => mapaResp.has(c.id)).length) +
    colabs.filter((c) => !notasPorColab.has(c.id)).length +
    sistemas.filter((s) => !s.ehNecessidade && s.nota == null).length +
    ativos.filter((a) => a.nota == null).length +
    porProcesso.filter((p) => p.media === null).length +
    itensResultado.filter((i) => i.nota === null).length +
    kpisNaoMedidos;

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
});
