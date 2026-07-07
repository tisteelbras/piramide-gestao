// Sincroniza os critérios da empresa com a biblioteca base.
// Adiciona os que faltam (por título+nível), sem apagar respostas existentes.
// Uso: npm run db:reseed-criterios
import { db } from "./index";
import { empresa, criterio } from "./schema";
import { eq } from "drizzle-orm";
import { CRITERIOS_BASE } from "./criterios-base";

async function main() {
  const emp = await db.query.empresa.findFirst({ where: eq(empresa.nome, "Steelbras") });
  if (!emp) {
    console.error("Empresa não encontrada. Rode 'npm run db:seed'.");
    process.exit(1);
  }
  const existentes = await db.query.criterio.findMany({ where: eq(criterio.empresaId, emp.id) });
  const chave = (nivel: string, titulo: string) => `${nivel}::${titulo}`;
  const jaTem = new Set(existentes.map((c) => chave(c.nivel, c.titulo)));

  const novos = CRITERIOS_BASE.filter((c) => !jaTem.has(chave(c.nivel, c.titulo)));
  if (novos.length === 0) {
    console.log("Nenhum critério novo. Biblioteca já sincronizada.");
    return;
  }
  const base = existentes.length;
  await db.insert(criterio).values(
    novos.map((c, i) => ({
      empresaId: emp.id,
      nivel: c.nivel,
      grupo: c.grupo,
      titulo: c.titulo,
      ordem: base + i,
    })),
  );
  console.log(`✓ ${novos.length} critérios adicionados (total agora: ${base + novos.length}).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("Falha:", e); process.exit(1); });
