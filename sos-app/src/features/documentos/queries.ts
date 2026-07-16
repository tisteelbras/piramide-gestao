import "server-only";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { documentoGerado, setor } from "@/db/schema";
import { getEmpresa } from "@/features/assessments/queries";

export type DocumentoLinha = {
  codigo: string;
  tipo: string;
  titulo: string;
  setorNome: string | null;
  autorNome: string;
  geradoEm: string; // ISO
};

export type Acervo = {
  documentos: DocumentoLinha[];
  // Para os filtros da tela.
  tipos: string[];
  setores: string[];
};

/**
 * Acervo: todos os documentos gerados pelo NEXO, do mais recente ao mais
 * antigo. Com `apenasSetorId`, o líder vê só os do setor dele (e os sem
 * setor) — mesma regra de escopo do dashboard.
 */
export async function carregarAcervo(apenasSetorId?: string | null): Promise<Acervo> {
  const emp = await getEmpresa();
  const [docs, setores] = await Promise.all([
    db.query.documentoGerado.findMany({
      where: apenasSetorId
        ? and(eq(documentoGerado.empresaId, emp.id), eq(documentoGerado.setorId, apenasSetorId))
        : eq(documentoGerado.empresaId, emp.id),
      orderBy: [desc(documentoGerado.geradoEm)],
    }),
    db.query.setor.findMany({ where: eq(setor.empresaId, emp.id) }),
  ]);
  const nomeSetor = new Map(setores.map((s) => [s.id, s.nome]));

  const documentos: DocumentoLinha[] = docs.map((d) => ({
    codigo: d.codigo,
    tipo: d.tipo,
    titulo: d.titulo,
    setorNome: d.setorId ? nomeSetor.get(d.setorId) ?? null : null,
    autorNome: d.autorNome,
    geradoEm: d.geradoEm.toISOString(),
  }));

  return {
    documentos,
    tipos: [...new Set(documentos.map((d) => d.tipo))].sort(),
    setores: [...new Set(documentos.map((d) => d.setorNome).filter((s): s is string => !!s))].sort(),
  };
}
