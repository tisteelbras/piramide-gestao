import "server-only";
import { listarSetores } from "@/features/assessments/queries";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import type { Nivel } from "@/features/assessments/tipos";

export type LinhaSetor = {
  id: string;
  nome: string;
  geral: number;
  porNivel: Record<Nivel, number>;
  pendencias: number;
};

export type DadosDashboard = {
  setores: LinhaSetor[];
  mediaEmpresa: number;
  radarEmpresa: Record<Nivel, number>; // média dos setores por nível
  totalPendencias: number;
};

export async function carregarDashboard(): Promise<DadosDashboard> {
  const setores = await listarSetores();
  const linhas: LinhaSetor[] = await Promise.all(
    setores.map(async (s) => {
      const m = await maturidadeDoSetor(s.id);
      return { id: s.id, nome: s.nome, geral: m.geral, porNivel: m.porNivel, pendencias: m.pendencias };
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

  return { setores: linhas, mediaEmpresa, radarEmpresa, totalPendencias };
}
