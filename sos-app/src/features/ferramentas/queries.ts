import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { plano5w2h, ishikawa, itemBcg, setor } from "@/db/schema";
import { getEmpresa } from "@/features/assessments/queries";
import {
  quadranteBcg,
  type PlanoComAcoes, type IshikawaComCausas, type ItemBcgDTO,
  type SetorOpcao, type ResumoFerramentas, type StatusAcao,
  type CategoriaIshikawa, type Quadrante,
} from "./tipos";

export type { PlanoComAcoes, IshikawaComCausas, ItemBcgDTO, SetorOpcao, ResumoFerramentas } from "./tipos";

/** Setores da empresa para o vínculo opcional das ferramentas. */
export async function opcoesDeSetor(): Promise<SetorOpcao[]> {
  const emp = await getEmpresa();
  const lista = await db.query.setor.findMany({
    where: eq(setor.empresaId, emp.id),
    orderBy: (s, { asc }) => [asc(s.nome)],
  });
  return lista.map((s) => ({ id: s.id, nome: s.nome }));
}

export async function carregar5w2h(): Promise<PlanoComAcoes[]> {
  const emp = await getEmpresa();
  const planos = await db.query.plano5w2h.findMany({
    where: eq(plano5w2h.empresaId, emp.id),
    orderBy: (p, { desc }) => [desc(p.criadoEm)],
    with: { acoes: { orderBy: (a, { asc }) => [asc(a.criadoEm)] }, setor: true },
  });
  return planos.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    setorId: p.setorId,
    setorNome: p.setor?.nome ?? null,
    acoes: p.acoes.map((a) => ({
      id: a.id,
      oQue: a.oQue,
      porQue: a.porQue,
      onde: a.onde,
      quando: a.quando,
      quem: a.quem,
      como: a.como,
      quantoCusta: a.quantoCusta,
      status: a.status as StatusAcao,
    })),
  }));
}

export async function carregarIshikawa(): Promise<IshikawaComCausas[]> {
  const emp = await getEmpresa();
  const analises = await db.query.ishikawa.findMany({
    where: eq(ishikawa.empresaId, emp.id),
    orderBy: (i, { desc }) => [desc(i.criadoEm)],
    with: { causas: { orderBy: (c, { asc }) => [asc(c.criadoEm)] }, setor: true },
  });
  return analises.map((i) => ({
    id: i.id,
    problema: i.problema,
    setorId: i.setorId,
    setorNome: i.setor?.nome ?? null,
    causas: i.causas.map((c) => ({
      id: c.id,
      categoria: c.categoria as CategoriaIshikawa,
      descricao: c.descricao,
    })),
  }));
}

export async function carregarBcg(): Promise<ItemBcgDTO[]> {
  const emp = await getEmpresa();
  const itens = await db.query.itemBcg.findMany({
    where: eq(itemBcg.empresaId, emp.id),
    orderBy: (i, { asc }) => [asc(i.nome)],
  });
  return itens.map((i) => ({
    id: i.id,
    nome: i.nome,
    participacao: i.participacao != null ? Number(i.participacao) : null,
    crescimento: i.crescimento != null ? Number(i.crescimento) : null,
  }));
}

/** Números agregados das ferramentas — usados no hub e no dashboard. */
export async function resumoFerramentas(): Promise<ResumoFerramentas> {
  const emp = await getEmpresa();
  const [planos, analises, itens] = await Promise.all([
    db.query.plano5w2h.findMany({ where: eq(plano5w2h.empresaId, emp.id), with: { acoes: true } }),
    db.query.ishikawa.findMany({ where: eq(ishikawa.empresaId, emp.id), with: { causas: true } }),
    db.query.itemBcg.findMany({ where: eq(itemBcg.empresaId, emp.id) }),
  ]);

  const acoes = planos.flatMap((p) => p.acoes);
  const porQuadrante: Record<Quadrante, number> = {
    estrela: 0, interrogacao: 0, vaca_leiteira: 0, abacaxi: 0,
  };
  for (const i of itens) {
    if (i.participacao == null || i.crescimento == null) continue;
    porQuadrante[quadranteBcg(Number(i.participacao), Number(i.crescimento))]++;
  }

  return {
    planos5w2h: planos.length,
    acoes5w2h: acoes.length,
    acoesConcluidas: acoes.filter((a) => a.status === "concluida").length,
    analisesIshikawa: analises.length,
    causasIshikawa: analises.reduce((t, i) => t + i.causas.length, 0),
    itensBcg: itens.length,
    porQuadrante,
  };
}
