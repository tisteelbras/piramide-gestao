// ————————————————————————————————————————————————
// Seed inicial do SOS.
// Popula: empresa Steelbras, os setores do protótipo e os critérios
// dos 4 níveis da pirâmide. Idempotente-ish: só insere se a empresa
// ainda não existir (evita duplicar ao rodar de novo).
//
// Rodar: npx tsx src/db/seed.ts   (após configurar DATABASE_URL)
// ————————————————————————————————————————————————
import { db } from "./index";
import { empresa, setor, criterio } from "./schema";
import { eq } from "drizzle-orm";
import { CRITERIOS_BASE } from "./criterios-base";

const SETORES = ["Estoque AC", "PCP", "Compras", "Comercial", "Financeiro", "Estoque MT"];
const CRITERIOS = CRITERIOS_BASE;

async function main() {
  const existente = await db.query.empresa.findFirst({
    where: eq(empresa.nome, "Steelbras"),
  });
  if (existente) {
    console.log("Seed já aplicado (empresa Steelbras existe). Nada a fazer.");
    return;
  }

  const [emp] = await db.insert(empresa).values({ nome: "Steelbras" }).returning();
  console.log("Empresa criada:", emp.id);

  await db.insert(setor).values(SETORES.map((nome) => ({ empresaId: emp.id, nome })));
  console.log(`${SETORES.length} setores criados.`);

  await db
    .insert(criterio)
    .values(
      CRITERIOS.map((c, i) => ({
        empresaId: emp.id,
        nivel: c.nivel,
        grupo: c.grupo,
        titulo: c.titulo,
        ordem: i,
      })),
    );
  console.log(`${CRITERIOS.length} critérios criados.`);
  console.log("✓ Seed concluído.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falha no seed:", e);
    process.exit(1);
  });
