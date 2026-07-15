// Serve a foto de perfil de um usuário — exige sessão. O arquivo fica em
// uploads/ (mesma pasta dos anexos), com nome opaco.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { usuario } from "@/db/schema";

// Extensão → content-type das imagens que aceitamos.
const TIPOS: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return new Response("Não autorizado", { status: 401 });

  const { id } = await params;
  const u = await db.query.usuario.findFirst({ where: eq(usuario.id, id) });
  if (!u?.fotoArquivo) return new Response("Sem foto", { status: 404 });

  // O nome no banco é gerado por nós (uuid + extensão); ainda assim usamos só
  // o basename para não permitir travessia de caminho.
  const nome = path.basename(u.fotoArquivo);
  const ext = path.extname(nome).toLowerCase();
  try {
    const buf = await readFile(path.join(process.cwd(), "uploads", nome));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": TIPOS[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new Response("Arquivo ausente", { status: 404 });
  }
}
