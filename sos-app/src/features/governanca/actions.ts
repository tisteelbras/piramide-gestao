"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { politicaAvaliacao, cicloSnapshot, metaSetor, usuario } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa, listarSetores } from "@/features/assessments/queries";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import type { PoliticaDTO } from "./tipos";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));
/** Metas seguem a escala oficial: presas de 10 em 10. */
const snap10 = (n: number) => clamp(Math.round(n / 10) * 10, 0, 100);

/** Só admin/direção mexem em política, metas e fechamento de ciclo.
 *  O papel é verificado no banco, não apenas no token da sessão. */
async function guardDirecao() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Não autenticado.");
  const u = await db.query.usuario.findFirst({ where: eq(usuario.id, s.user.id) });
  if (!u || (u.papel !== "admin" && u.papel !== "direcao")) {
    throw new Error("Apenas administração/direção pode alterar a governança.");
  }
  const emp = await getEmpresa();
  return { emp, usuario: u };
}
const refresh = () => {
  revalidatePath("/", "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/configuracoes", "page");
  revalidatePath("/relatorio-executivo", "page");
};

export async function salvarPolitica(p: PoliticaDTO) {
  const { emp } = await guardDirecao();
  const valores = {
    periodicidadeDias: clamp(p.periodicidadeDias, 7, 365),
    avisoDias: clamp(p.avisoDias, 1, 60),
    metaPadrao: snap10(p.metaPadrao),
  };
  const existente = await db.query.politicaAvaliacao.findFirst({
    where: eq(politicaAvaliacao.empresaId, emp.id),
  });
  if (existente) {
    await db.update(politicaAvaliacao).set({ ...valores, atualizadoEm: new Date() }).where(eq(politicaAvaliacao.id, existente.id));
  } else {
    await db.insert(politicaAvaliacao).values({ empresaId: emp.id, ...valores });
  }
  refresh();
  return { ok: true as const };
}

/** Meta específica do setor; null volta a valer a meta padrão. */
export async function salvarMetaSetor(setorId: string, meta: number | null) {
  await guardDirecao();
  const existente = await db.query.metaSetor.findFirst({ where: eq(metaSetor.setorId, setorId) });
  if (meta == null) {
    if (existente) await db.delete(metaSetor).where(eq(metaSetor.id, existente.id));
  } else if (existente) {
    await db.update(metaSetor).set({ meta: snap10(meta), atualizadoEm: new Date() }).where(eq(metaSetor.id, existente.id));
  } else {
    await db.insert(metaSetor).values({ setorId, meta: snap10(meta) });
  }
  refresh();
  return { ok: true as const };
}

/** Fecha o ciclo: fotografa a maturidade de todos os setores. O próximo
 *  vencimento passa a contar a partir de agora. */
export async function fecharCiclo() {
  const { emp, usuario: u } = await guardDirecao();
  const setores = await listarSetores();
  if (setores.length === 0) return { ok: false as const, total: 0 };

  const linhas = await Promise.all(
    setores.map(async (s) => {
      const m = await maturidadeDoSetor(s.id);
      return {
        empresaId: emp.id,
        setorId: s.id,
        fechadoPor: u.nome,
        geral: String(m.geral),
        visao: String(m.porNivel.visao),
        tatico: String(m.porNivel.tatico),
        processos: String(m.porNivel.processos),
        resultados: String(m.porNivel.resultados),
      };
    }),
  );
  await db.insert(cicloSnapshot).values(linhas);
  refresh();
  return { ok: true as const, total: linhas.length };
}
