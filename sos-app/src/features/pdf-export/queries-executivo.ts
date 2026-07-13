// Dados do relatório executivo consolidado da empresa (todas as áreas).
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recomendacao } from "@/db/schema";
import { getEmpresa } from "@/features/assessments/queries";
import { carregarDashboard, type DadosDashboard } from "@/features/dashboard/queries";
import { carregarGovernanca } from "@/features/governanca/queries";
import { resumoFerramentas } from "@/features/ferramentas/queries";
import type { GovernancaDTO } from "@/features/governanca/tipos";
import type { ResumoFerramentas } from "@/features/ferramentas/tipos";

export type RecomendacaoExecutiva = {
  setorNome: string;
  titulo: string;
  detalhe: string | null;
  prioridade: number;
};

export type RelatorioExecutivo = {
  empresaNome: string;
  data: Date;
  dashboard: DadosDashboard;
  governanca: GovernancaDTO;
  ferramentas: ResumoFerramentas;
  recomendacoes: RecomendacaoExecutiva[];
};

export async function montarRelatorioExecutivo(): Promise<RelatorioExecutivo> {
  const emp = await getEmpresa();
  const [dashboard, governanca, ferramentas, recs] = await Promise.all([
    carregarDashboard(),
    carregarGovernanca(),
    resumoFerramentas(),
    db.query.recomendacao.findMany({
      where: eq(recomendacao.empresaId, emp.id),
      with: { setor: true },
      orderBy: (r, { asc }) => [asc(r.prioridade)],
      limit: 12,
    }),
  ]);
  return {
    empresaNome: emp.nome,
    data: new Date(),
    dashboard,
    governanca,
    ferramentas,
    recomendacoes: recs.map((r) => ({
      setorNome: r.setor?.nome ?? "—",
      titulo: r.titulo,
      detalhe: r.detalhe,
      prioridade: Number(r.prioridade),
    })),
  };
}
