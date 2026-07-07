import "server-only";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { avaliacao, resposta, criterio } from "@/db/schema";
import { getEmpresa, listarSetores } from "@/features/assessments/queries";
import { consolidarPorNivel } from "@/features/assessments/consolidar";
import type { CriterioAvaliado, Nivel } from "@/features/assessments/tipos";

export type LinhaSetor = {
  id: string;
  nome: string;
  geral: number;
  porNivel: Record<Nivel, number>;
  pendencias: number; // critérios não respondidos
};

export type DadosDashboard = {
  setores: LinhaSetor[];
  mediaEmpresa: number;
  radarEmpresa: Record<Nivel, number>; // média dos setores por nível
  totalPendencias: number;
};

export async function carregarDashboard(): Promise<DadosDashboard> {
  const emp = await getEmpresa();
  const [setores, criterios] = await Promise.all([
    listarSetores(),
    db.query.criterio.findMany({ where: eq(criterio.empresaId, emp.id) }),
  ]);

  const linhas: LinhaSetor[] = [];
  for (const s of setores) {
    const aval = await db.query.avaliacao.findFirst({
      where: and(eq(avaliacao.setorId, s.id), eq(avaliacao.empresaId, emp.id)),
      orderBy: [desc(avaliacao.criadoEm)],
    });
    const respostas = aval
      ? await db.query.resposta.findMany({ where: eq(resposta.avaliacaoId, aval.id) })
      : [];
    const mapa = new Map(respostas.map((r) => [r.criterioId, r]));
    const avaliados: CriterioAvaliado[] = criterios.map((c) => ({
      id: c.id, nivel: c.nivel as Nivel, grupo: c.grupo, titulo: c.titulo, peso: Number(c.peso),
      nota: mapa.get(c.id)?.nota != null ? Number(mapa.get(c.id)!.nota) : null,
      status: mapa.get(c.id)?.status ?? "nao_iniciada",
    }));
    const { porNivel, geral } = consolidarPorNivel(avaliados);
    const pendencias = avaliados.filter((c) => c.nota == null).length;
    linhas.push({
      id: s.id, nome: s.nome, geral, pendencias,
      porNivel: {
        visao: porNivel.visao.preenchimento,
        tatico: porNivel.tatico.preenchimento,
        processos: porNivel.processos.preenchimento,
        resultados: porNivel.resultados.preenchimento,
      },
    });
  }

  linhas.sort((a, b) => b.geral - a.geral);

  const mediaEmpresa = linhas.length ? Math.round(linhas.reduce((a, l) => a + l.geral, 0) / linhas.length) : 0;
  const radarEmpresa = { visao: 0, tatico: 0, processos: 0, resultados: 0 } as Record<Nivel, number>;
  if (linhas.length) {
    for (const nv of Object.keys(radarEmpresa) as Nivel[]) {
      radarEmpresa[nv] = Math.round(linhas.reduce((a, l) => a + l.porNivel[nv], 0) / linhas.length);
    }
  }
  const totalPendencias = linhas.reduce((a, l) => a + l.pendencias, 0);

  return { setores: linhas, mediaEmpresa, radarEmpresa, totalPendencias };
}
