import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { politicaAvaliacao, cicloSnapshot, usuario } from "@/db/schema";
import { getEmpresa, listarSetores } from "@/features/assessments/queries";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import { POLITICA_PADRAO, situacaoCiclo, type GovernancaDTO, type PoliticaDTO, type PontoHistorico } from "./tipos";

export type { GovernancaDTO, CicloSetor, PoliticaDTO } from "./tipos";

export async function carregarPolitica(): Promise<PoliticaDTO> {
  const emp = await getEmpresa();
  const p = await db.query.politicaAvaliacao.findFirst({
    where: eq(politicaAvaliacao.empresaId, emp.id),
  });
  return p
    ? { periodicidadeDias: p.periodicidadeDias, avisoDias: p.avisoDias, metaPadrao: p.metaPadrao }
    : POLITICA_PADRAO;
}

/** Papel efetivo do usuário logado, direto do banco (não confia só no token). */
export async function papelDoUsuario(userId: string | undefined): Promise<{ papel: "admin" | "direcao" | "lider"; setorId: string | null } | null> {
  if (!userId) return null;
  const u = await db.query.usuario.findFirst({ where: eq(usuario.id, userId) });
  return u ? { papel: u.papel, setorId: u.setorId } : null;
}

/** Situação de ciclo, meta e tendência de todos os setores + histórico. */
export async function carregarGovernanca(): Promise<GovernancaDTO> {
  const emp = await getEmpresa();
  const [politica, setores, snapshots, metas] = await Promise.all([
    carregarPolitica(),
    listarSetores(),
    db.query.cicloSnapshot.findMany({
      where: eq(cicloSnapshot.empresaId, emp.id),
      orderBy: (s, { asc }) => [asc(s.fechadoEm)],
    }),
    db.query.metaSetor.findMany(),
  ]);
  const metaPorSetor = new Map(metas.map((m) => [m.setorId, m.meta]));

  const ciclos = await Promise.all(
    setores.map(async (s) => {
      const doSetor = snapshots.filter((x) => x.setorId === s.id);
      const ultimo = doSetor.at(-1) ?? null;
      const base = ultimo?.fechadoEm ?? s.criadoEm;
      const { vencimento, diasRestantes, estado } = situacaoCiclo(
        base, politica.periodicidadeDias, politica.avisoDias,
      );
      const m = await maturidadeDoSetor(s.id);
      const ultimoGeral = ultimo ? Number(ultimo.geral) : null;
      return {
        setorId: s.id,
        setorNome: s.nome,
        ultimoFechamento: ultimo ? ultimo.fechadoEm.toISOString() : null,
        ultimoGeral,
        vencimento: vencimento.toISOString(),
        diasRestantes,
        estado,
        meta: metaPorSetor.get(s.id) ?? politica.metaPadrao,
        geralAtual: m.geral,
        tendencia: ultimoGeral != null ? Math.round((m.geral - ultimoGeral) * 10) / 10 : null,
      };
    }),
  );

  // Histórico da empresa: média dos setores por dia de fechamento.
  const porDia = new Map<string, number[]>();
  for (const s of snapshots) {
    const dia = s.fechadoEm.toISOString().slice(0, 10);
    porDia.set(dia, [...(porDia.get(dia) ?? []), Number(s.geral)]);
  }
  const historico: PontoHistorico[] = [...porDia.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, vals]) => ({
      data,
      media: Math.round((vals.reduce((x, y) => x + y, 0) / vals.length) * 10) / 10,
    }));

  return { politica, ciclos, historico };
}
