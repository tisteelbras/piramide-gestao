// Download de um anexo — exige sessão e serve o arquivo do disco.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { anexo } from "@/db/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return new Response("Não autorizado", { status: 401 });

  const { id } = await params;
  const a = await db.query.anexo.findFirst({ where: eq(anexo.id, id) });
  if (!a) return new Response("Não encontrado", { status: 404 });

  try {
    const buf = await readFile(path.join(process.cwd(), "uploads", a.nomeArquivo));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": a.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(a.nomeOriginal)}`,
      },
    });
  } catch {
    return new Response("Arquivo ausente no disco", { status: 404 });
  }
}
