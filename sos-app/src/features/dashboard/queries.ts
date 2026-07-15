import "server-only";
import { listarSetores } from "@/features/assessments/queries";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import { carregarPlanoDoSetor } from "@/features/action-plan/queries";
import type { Nivel } from "@/features/assessments/tipos";

export type LinhaSetor = {
  id: string;
  nome: string;
  geral: number;
  porNivel: Record<Nivel, number>;
  pendencias: number;
  // Plano de ação: o outro lado do diagnóstico.
  acoesTotal: number;
  acoesConcluidas: number;
  acoesAtrasadas: number;
  progressoPlano: number;
};

export type DadosDashboard = {
  setores: LinhaSetor[];
  mediaEmpresa: number;
  radarEmpresa: Record<Nivel, number>; // média dos setores por nível
  totalPendencias: number;
  totalAcoesAtrasadas: number;
  totalAcoesAbertas: number;
  // "empresa" = admin/direção (todas as áreas); "setor" = líder (só a dele).
  escopo: "empresa" | "setor";
};

/**
 * Dados do dashboard. `apenasSetorId` restringe ao setor do líder — o filtro
 * acontece no SERVIDOR (o líder nem carrega dados das outras áreas). Sem ele,
 * é a visão consolidada de admin/direção.
 */
export async function carregarDashboard(apenasSetorId?: string | null): Promise<DadosDashboard> {
  const todos = await listarSetores();
  const setores = apenasSetorId ? todos.filter((s) => s.id === apenasSetorId) : todos;
  const escopo: "empresa" | "setor" = apenasSetorId ? "setor" : "empresa";
  const linhas: LinhaSetor[] = await Promise.all(
    setores.map(async (s) => {
      const [m, plano] = await Promise.all([maturidadeDoSetor(s.id), carregarPlanoDoSetor(s.id)]);
      return {
        id: s.id, nome: s.nome, geral: m.geral, porNivel: m.porNivel, pendencias: m.pendencias,
        acoesTotal: plano.resumo.total,
        acoesConcluidas: plano.resumo.concluidas,
        acoesAtrasadas: plano.resumo.atrasadas,
        progressoPlano: plano.resumo.progresso,
      };
    }),
  );
  linhas.sort((a, b) => b.geral - a.geral);

  const mediaEmpresa = linhas.length ? Math.round(linhas.reduce((a, l) => a + l.geral, 0) / linhas.length) : 0;
  const radarEmpresa = { visao: 0, tatico: 0, processos: 0, resultados: 0 } as Record<Nivel, number>;
  if (linhas.length) {
    for (const nv of Object.keys(radarEmpresa) as Nivel[]) {
      radarEmpresa[nv] = Math.round(linhas.reduce((a, l) => a + l.porNivel[nv], 0) / linhas.length);
    }
  }
  const totalPendencias = linhas.reduce((a, l) => a + l.pendencias, 0);
  const totalAcoesAtrasadas = linhas.reduce((a, l) => a + l.acoesAtrasadas, 0);
  const totalAcoesAbertas = linhas.reduce((a, l) => a + (l.acoesTotal - l.acoesConcluidas), 0);

  return { setores: linhas, mediaEmpresa, radarEmpresa, totalPendencias, totalAcoesAtrasadas, totalAcoesAbertas, escopo };
}
