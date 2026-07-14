"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { and, eq, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { colaborador, anexo, criterio, setor } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa, getOuCriaAvaliacaoCorrente } from "@/features/assessments/queries";
import { gerarPdfOrganograma } from "./pdf";
import { criariaCiclo, type PessoaOrganograma } from "./tipos";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// A etapa da Visão que recebe o PDF do organograma. Casa pelo início do
// título, pois ele traz a pergunta entre parênteses.
const ETAPA_ORGANOGRAMA = "Estrutura Organizacional";

async function guard() {
  const s = await auth();
  if (!s?.user) throw new Error("Não autenticado.");
  return { userId: s.user.id, empresa: await getEmpresa() };
}

const refresh = (setorId: string) => {
  revalidatePath(`/setor/${setorId}/organograma`, "page");
  revalidatePath("/setor/[id]/avaliar", "page");
  revalidatePath("/setor/[id]", "page");
};

/** Adiciona uma pessoa ao organograma (= colaborador do setor). */
export async function addPessoa(input: {
  setorId: string;
  nome: string;
  cargo?: string;
  gestorId?: string | null;
}) {
  const { empresa } = await guard();
  const nome = input.nome.trim();
  if (!nome) return { ok: false as const, erro: "Informe o nome." };

  await db.insert(colaborador).values({
    empresaId: empresa.id,
    setorId: input.setorId,
    nome,
    cargo: input.cargo?.trim() || null,
    gestorId: input.gestorId || null,
  });
  refresh(input.setorId);
  return { ok: true as const };
}

/** Atualiza nome, função e/ou a quem a pessoa responde. */
export async function atualizarPessoa(input: {
  setorId: string;
  id: string;
  nome?: string;
  cargo?: string | null;
  gestorId?: string | null;
}) {
  await guard();

  // Guarda contra ciclos: ninguém pode responder a um subordinado seu.
  if (input.gestorId) {
    const pessoas = await db.query.colaborador.findMany({
      where: eq(colaborador.setorId, input.setorId),
    });
    const lista: PessoaOrganograma[] = pessoas.map((p) => ({
      id: p.id, nome: p.nome, cargo: p.cargo, gestorId: p.gestorId,
    }));
    if (criariaCiclo(lista, input.id, input.gestorId)) {
      return { ok: false as const, erro: "Essa escolha criaria um ciclo na hierarquia." };
    }
  }

  const patch: Record<string, unknown> = { atualizadoEm: new Date() };
  if (input.nome !== undefined) {
    const nome = input.nome.trim();
    if (!nome) return { ok: false as const, erro: "Informe o nome." };
    patch.nome = nome;
  }
  if (input.cargo !== undefined) patch.cargo = input.cargo?.trim() || null;
  if (input.gestorId !== undefined) patch.gestorId = input.gestorId || null;

  await db.update(colaborador).set(patch).where(eq(colaborador.id, input.id));
  refresh(input.setorId);
  return { ok: true as const };
}

/** Remove a pessoa. Os subordinados dela sobem para o topo
 *  (gestor_id vira null por ON DELETE SET NULL) — ninguém é apagado junto. */
export async function removerPessoa(setorId: string, id: string) {
  await guard();
  await db.delete(colaborador).where(eq(colaborador.id, id));
  refresh(setorId);
  return { ok: true as const };
}

/**
 * Gera o PDF do organograma do setor, salva em uploads/ e anexa à etapa
 * "Estrutura Organizacional" da Visão, substituindo o PDF anterior gerado
 * por esta ferramenta (anexos que o gestor subiu à mão não são tocados).
 */
export async function gerarEAnexarPdf(setorId: string) {
  const { userId, empresa } = await guard();

  const [setorRow, pessoas, etapa] = await Promise.all([
    db.query.setor.findFirst({ where: eq(setor.id, setorId) }),
    db.query.colaborador.findMany({ where: eq(colaborador.setorId, setorId) }),
    // A etapa "Estrutura Organizacional (…)" — casa pelo prefixo do título.
    db.query.criterio.findFirst({
      where: and(
        eq(criterio.empresaId, empresa.id),
        eq(criterio.nivel, "visao"),
        like(criterio.titulo, `${ETAPA_ORGANOGRAMA}%`),
      ),
    }),
  ]);

  if (!setorRow) return { ok: false as const, erro: "Setor não encontrado." };
  if (pessoas.length === 0) {
    return { ok: false as const, erro: "Cadastre ao menos uma pessoa antes de gerar o PDF." };
  }
  if (!etapa) {
    return { ok: false as const, erro: `Etapa "${ETAPA_ORGANOGRAMA}" não encontrada na Visão.` };
  }

  // 1) Gera o PDF.
  const buffer = await gerarPdfOrganograma({
    setorNome: setorRow.nome,
    empresaNome: empresa.nome,
    pessoas: pessoas.map((p) => ({
      id: p.id, nome: p.nome, cargo: p.cargo, gestorId: p.gestorId,
    })),
  });

  // 2) Salva em uploads/.
  const nomeArquivo = `${randomUUID()}.pdf`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, nomeArquivo), buffer);

  // 3) Anexa à etapa da Visão, na avaliação corrente do setor.
  const aval = await getOuCriaAvaliacaoCorrente(setorId, userId);
  const nomeOriginal = `Organograma - ${setorRow.nome}.pdf`;

  // Substitui o PDF gerado anteriormente por esta ferramenta (mesmo nome),
  // sem tocar em anexos que o gestor subiu à mão.
  const anteriores = await db.query.anexo.findMany({
    where: and(
      eq(anexo.avaliacaoId, aval.id),
      eq(anexo.criterioId, etapa.id),
      eq(anexo.nomeOriginal, nomeOriginal),
    ),
  });
  for (const a of anteriores) {
    await db.delete(anexo).where(eq(anexo.id, a.id));
    await unlink(path.join(UPLOADS_DIR, a.nomeArquivo)).catch(() => {});
  }

  await db.insert(anexo).values({
    avaliacaoId: aval.id,
    criterioId: etapa.id,
    nomeOriginal,
    nomeArquivo,
    mimeType: "application/pdf",
    tamanhoBytes: buffer.byteLength,
  });

  refresh(setorId);
  return { ok: true as const, nomeArquivo, etapaTitulo: etapa.titulo };
}
