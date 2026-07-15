// Download de um documento rastreável (ISO 9001) pelo seu código NEXO-XXXXXX.
// Exige sessão. Serve o PDF de uploads/.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { documentoGerado } from "@/db/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const session = await auth();
  if (!session?.user) return new Response("Não autorizado", { status: 401 });

  const { codigo } = await params;
  const doc = await db.query.documentoGerado.findFirst({
    where: eq(documentoGerado.codigo, decodeURIComponent(codigo)),
  });
  if (!doc) return new Response("Documento não encontrado", { status: 404 });

  try {
    const buf = await readFile(path.join(process.cwd(), "uploads", path.basename(doc.nomeArquivo)));
    const nome = `${doc.tipo} - ${doc.titulo} (${doc.codigo}).pdf`.replace(/[\\/:*?"<>|]/g, "-");
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nome)}`,
      },
    });
  } catch {
    return new Response("Arquivo ausente no disco", { status: 404 });
  }
}
