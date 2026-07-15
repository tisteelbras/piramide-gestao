import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuario, setor } from "@/db/schema";
import { getEmpresa } from "@/features/assessments/queries";

export type UsuarioLinha = {
  id: string;
  nome: string;
  email: string;
  papel: "admin" | "direcao" | "lider";
  setorId: string | null;
  setorNome: string | null;
  ativo: boolean;
  temFoto: boolean;
};

/** Lista os usuários da empresa (para a tela de gestão — admin). */
export async function listarUsuarios(): Promise<UsuarioLinha[]> {
  const emp = await getEmpresa();
  const rows = await db.query.usuario.findMany({
    where: eq(usuario.empresaId, emp.id),
    orderBy: (u, { asc }) => [asc(u.nome)],
  });
  const setores = await db.query.setor.findMany({ where: eq(setor.empresaId, emp.id) });
  const nomeSetor = new Map(setores.map((s) => [s.id, s.nome]));
  return rows.map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    papel: u.papel,
    setorId: u.setorId,
    setorNome: u.setorId ? nomeSetor.get(u.setorId) ?? null : null,
    ativo: u.ativo,
    temFoto: !!u.fotoArquivo,
  }));
}

/** Setores disponíveis para vincular a um líder. */
export async function setoresParaVinculo(): Promise<{ id: string; nome: string }[]> {
  const emp = await getEmpresa();
  const setores = await db.query.setor.findMany({
    where: eq(setor.empresaId, emp.id),
    orderBy: (s, { asc }) => [asc(s.nome)],
  });
  return setores.map((s) => ({ id: s.id, nome: s.nome }));
}
