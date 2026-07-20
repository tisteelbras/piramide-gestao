// ————————————————————————————————————————————————
// Motor de maturidade NEXO — fonte única de cálculo por setor.
//
// Este arquivo faz a BUSCA dos dados; a REGRA de cálculo vive em
// domain/maturidade-nexo.ts, que é pura e coberta por testes. A separação
// existe para que o cálculo que define a nota do cliente possa ser
// verificado sem subir banco.
//
// Cada nível tem sua própria mecânica (detalhada junto de cada regra no
// módulo de domínio):
//   VISÃO      → % de etapas com status "revisada" (checklist binário)
//   RECURSOS   → média dos grupos: RH (média dos colaboradores nos 4
//                eixos), Sistêmico (média dos sistemas avaliados),
//                Estrutural (média dos ativos)
//   PROCESSOS  → média das médias de cada processo (5 etapas)
//   RESULTADOS → resultado de processo aplicado: média dos processos
//                TIPADOS (um tópico por tipo com resultado — a lista vive
//                em features/processes/tipos.ts). Processos tipo "outro"
//                contam só em PROCESSOS.
//                "Resultado de KPI" segue a MESMA regra: é a maturidade dos
//                processos tipo "kpi" — os processos que a área executa para
//                atingir cada indicador. O valor do KPI em si é medido fora
//                do NEXO; aqui só medimos o processo que persegue a meta.
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
  processo, avaliacaoProcesso,
} from "@/db/schema";
import { TIPOS_COM_RESULTADO } from "@/features/processes/tipos";
import { calculaMaturidade } from "@/domain/maturidade-nexo";
import { getEmpresa } from "./queries";
import type { MaturidadeDTO } from "./tipos";

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

  const [criterios, respostas, colabs, notasColab, sistemas, ativos, notasProc] =
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
    ]);
  const mapaResp = new Map(respostas.map((r) => [r.criterioId, r]));

  // Agrupa as notas soltas do banco por dono, para entregar ao cálculo o
  // retrato já montado. Notas null são descartadas aqui: para a regra, o
  // que não foi avaliado simplesmente não existe (não vale zero).
  const notasPorColab = new Map<string, number[]>();
  for (const n of notasColab) {
    if (n.nota == null) continue;
    const arr = notasPorColab.get(n.colaboradorId) ?? [];
    arr.push(Number(n.nota));
    notasPorColab.set(n.colaboradorId, arr);
  }
  const notasPorProc = new Map<string, number[]>();
  const idsProcs = new Set(procs.map((p) => p.id));
  for (const n of notasProc) {
    if (n.nota == null || !idsProcs.has(n.processoId)) continue;
    const arr = notasPorProc.get(n.processoId) ?? [];
    arr.push(Number(n.nota));
    notasPorProc.set(n.processoId, arr);
  }

  // A REGRA vive em domain/maturidade-nexo.ts (pura e testada); aqui só
  // buscamos os dados e montamos a entrada.
  return calculaMaturidade({
    itensVisao: criterios
      .filter((c) => c.nivel === "visao")
      .map((c) => ({ id: c.id, status: mapaResp.get(c.id)?.status, respondido: mapaResp.has(c.id) })),
    colaboradores: colabs.map((c) => ({ id: c.id, notas: notasPorColab.get(c.id) ?? [] })),
    sistemas: sistemas.map((s) => ({ nota: s.nota == null ? null : Number(s.nota), ehNecessidade: s.ehNecessidade })),
    ativos: ativos.map((a) => ({ nota: a.nota == null ? null : Number(a.nota) })),
    processos: procs.map((p) => ({ id: p.id, nome: p.nome, tipo: p.tipo, notas: notasPorProc.get(p.id) ?? [] })),
    tiposComResultado: TIPOS_COM_RESULTADO,
  });
});
