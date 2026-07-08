// ————————————————————————————————————————————————
// Camada de leitura das avaliações (server-only).
// Regra: cada setor tem UMA avaliação "corrente" (a mais recente).
// Ao abrir um setor, garantimos que ela exista.
// ————————————————————————————————————————————————
import "server-only";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { empresa, setor, criterio, avaliacao, resposta, anexo } from "@/db/schema";
import type { Nivel } from "./tipos";

/** A empresa única (Steelbras) — enquanto for single-tenant. */
export async function getEmpresa() {
  const e = await db.query.empresa.findFirst({ where: eq(empresa.nome, "Steelbras") });
  if (!e) throw new Error("Empresa não encontrada. Rode o seed.");
  return e;
}

export async function listarSetores() {
  const e = await getEmpresa();
  return db.query.setor.findMany({
    where: eq(setor.empresaId, e.id),
    orderBy: (s, { asc }) => [asc(s.nome)],
  });
}

export async function getSetor(setorId: string) {
  return db.query.setor.findFirst({ where: eq(setor.id, setorId) });
}

/** Pega a avaliação corrente do setor ou cria uma nova. */
export async function getOuCriaAvaliacaoCorrente(setorId: string, autorId?: string) {
  const e = await getEmpresa();
  const existente = await db.query.avaliacao.findFirst({
    where: and(eq(avaliacao.setorId, setorId), eq(avaliacao.empresaId, e.id)),
    orderBy: [desc(avaliacao.criadoEm)],
  });
  if (existente) return existente;
  const [nova] = await db
    .insert(avaliacao)
    .values({ empresaId: e.id, setorId, autorId: autorId ?? null })
    .returning();
  return nova;
}

/** Critérios da empresa, agrupados por nível, na ordem definida. */
export async function listarCriterios() {
  const e = await getEmpresa();
  return db.query.criterio.findMany({
    where: eq(criterio.empresaId, e.id),
    orderBy: (c, { asc }) => [asc(c.ordem)],
  });
}

/** Respostas de uma avaliação, indexadas por criterioId. */
export async function respostasPorCriterio(avaliacaoId: string) {
  const linhas = await db.query.resposta.findMany({
    where: eq(resposta.avaliacaoId, avaliacaoId),
  });
  const mapa = new Map<string, (typeof linhas)[number]>();
  for (const r of linhas) mapa.set(r.criterioId, r);
  return mapa;
}

/** Dados completos para a tela de avaliação de um setor. */
export async function carregarAvaliacaoDoSetor(setorId: string, autorId?: string) {
  const [setorRow, aval, criterios] = await Promise.all([
    getSetor(setorId),
    getOuCriaAvaliacaoCorrente(setorId, autorId),
    listarCriterios(),
  ]);
  if (!setorRow) return null;
  const [respostas, anexos] = await Promise.all([
    respostasPorCriterio(aval.id),
    db.query.anexo.findMany({ where: eq(anexo.avaliacaoId, aval.id) }),
  ]);
  const anexosPorCriterio = new Map<string, typeof anexos>();
  for (const a of anexos) {
    const arr = anexosPorCriterio.get(a.criterioId) ?? [];
    arr.push(a);
    anexosPorCriterio.set(a.criterioId, arr);
  }
  return {
    setor: setorRow,
    avaliacaoId: aval.id,
    criterios: criterios.map((c) => ({
      id: c.id,
      nivel: c.nivel as Nivel,
      grupo: c.grupo,
      titulo: c.titulo,
      peso: Number(c.peso),
      nota: respostas.get(c.id)?.nota != null ? Number(respostas.get(c.id)!.nota) : null,
      status: respostas.get(c.id)?.status ?? "nao_iniciada",
      observacao: respostas.get(c.id)?.observacao ?? null,
      anexos: (anexosPorCriterio.get(c.id) ?? []).map((a) => ({
        id: a.id,
        nomeOriginal: a.nomeOriginal,
        tamanhoBytes: a.tamanhoBytes,
      })),
    })),
  };
}
