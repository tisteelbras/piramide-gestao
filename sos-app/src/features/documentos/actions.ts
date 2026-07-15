"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { documentoGerado, anexo, usuario } from "@/db/schema";
import { auth } from "@/auth";
import { getEmpresa, getOuCriaAvaliacaoCorrente } from "@/features/assessments/queries";
import { gerarCodigoDocumento } from "@/domain/codigo-documento";
import { gerarPdfRastreavel, type SecaoPdf } from "./pdf-base";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export type GerarDocInput = {
  tipo: string; // "Plano de ação", "Análise Ishikawa"…
  titulo: string;
  setorId?: string | null;
  setorNome?: string | null;
  secoes: SecaoPdf[];
  // Se informado, também anexa o PDF a esta etapa da Visão do setor.
  anexarNaEtapaCriterioId?: string | null;
};

/**
 * Gera um PDF rastreável (código único + autor + data), registra em
 * documento_gerado, salva em uploads/ e — opcionalmente — anexa a uma etapa
 * da Visão. O download é sempre por /api/documento/[codigo].
 *
 * É a base ISO 9001 usada por planos de ação e por todas as ferramentas.
 */
export async function gerarDocumento(input: GerarDocInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  const emp = await getEmpresa();
  const u = await db.query.usuario.findFirst({ where: eq(usuario.id, session.user.id) });
  const autorNome = u?.nome ?? session.user.name ?? "Usuário";

  // Código único (tenta poucas vezes; a coluna é UNIQUE).
  let codigo = gerarCodigoDocumento();
  for (let i = 0; i < 5; i++) {
    const existe = await db.query.documentoGerado.findFirst({ where: eq(documentoGerado.codigo, codigo) });
    if (!existe) break;
    codigo = gerarCodigoDocumento();
  }

  const geradoEm = new Date();
  const buffer = await gerarPdfRastreavel({
    tipo: input.tipo, titulo: input.titulo, codigo, autorNome,
    empresaNome: emp.nome, setorNome: input.setorNome ?? null, geradoEm, secoes: input.secoes,
  });

  // Salva o arquivo em disco.
  const nomeArquivo = `doc-${randomUUID()}.pdf`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, nomeArquivo), buffer);

  // Registra na trilha ISO (é daqui que /api/documento/[codigo] serve).
  await db.insert(documentoGerado).values({
    empresaId: emp.id, codigo, tipo: input.tipo, titulo: input.titulo, nomeArquivo,
    setorId: input.setorId ?? null, autorId: u?.id ?? null, autorNome, geradoEm,
  });

  // Opcional: anexa à etapa da Visão, substituindo a versão anterior do
  // MESMO documento (mesmo tipo+título) — sem tocar em anexos manuais.
  if (input.anexarNaEtapaCriterioId && input.setorId) {
    const aval = await getOuCriaAvaliacaoCorrente(input.setorId, session.user.id);
    const nomeOriginal = `${input.tipo} - ${input.titulo}.pdf`.replace(/[\\/:*?"<>|]/g, "-");
    const prefixo = `${input.tipo} - `;
    const anteriores = await db.query.anexo.findMany({
      where: and(eq(anexo.avaliacaoId, aval.id), eq(anexo.criterioId, input.anexarNaEtapaCriterioId)),
    });
    for (const a of anteriores) {
      if (a.nomeOriginal.startsWith(prefixo) && a.nomeOriginal.includes(input.titulo)) {
        await db.delete(anexo).where(eq(anexo.id, a.id));
      }
    }
    await db.insert(anexo).values({
      avaliacaoId: aval.id, criterioId: input.anexarNaEtapaCriterioId,
      nomeOriginal, nomeArquivo, mimeType: "application/pdf", tamanhoBytes: buffer.byteLength,
    });
    revalidatePath("/setor/[id]/avaliar", "page");
  }

  return { ok: true as const, codigo, nomeOriginal: `${input.tipo} - ${input.titulo} (${codigo}).pdf` };
}
