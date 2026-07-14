// Migração de dados: "Governança Operacional" → "Modelo Operacional"
// na etapa da Visão. Renomeia pelo título, preservando o id do critério —
// portanto respostas, descrições e anexos ligados a ele continuam válidos.
// Idempotente: pode rodar mais de uma vez sem efeito colateral.
// Uso: npx tsx --env-file=.env.local src/db/migrar-modelo-operacional.ts
import { sql } from "drizzle-orm";
import { db } from "./index";

const DE = "Governança Operacional (Como funcionamos?)";
const PARA = "Modelo Operacional (Como funcionamos?)";

async function main() {
  const r = await db.execute(sql`
    UPDATE criterio SET titulo = ${PARA}
    WHERE nivel = 'visao' AND titulo = ${DE}
  `);
  console.log(
    r.count
      ? `✓ Etapa renomeada para "${PARA}" (${r.count} registro).`
      : `✓ Nada a renomear — a etapa já se chama "${PARA}".`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("Falha:", e); process.exit(1); });
