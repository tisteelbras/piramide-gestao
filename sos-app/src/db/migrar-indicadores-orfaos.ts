// ————————————————————————————————————————————————
// Migração de dados — indicadores órfãos ganham processo no N3.
//
// Indicadores criados ANTES da mudança "indicador → processo kpi" ficaram
// sem o vínculo (processo_id null): apareciam na etapa Indicadores da Visão
// mas não existiam como processo, então não "atrelavam" na cadeia
// Visão → Processos → Resultado.
//
// Para cada indicador sem processo, cria um processo tipo 'kpi' com o mesmo
// nome no mesmo setor e liga os dois — igual ao que addIndicador faz hoje.
//
// Idempotente. Uso: npx tsx --env-file=.env.local src/db/migrar-indicadores-orfaos.ts
// ————————————————————————————————————————————————
import { sql } from "drizzle-orm";
import { db } from "./index";

async function main() {
  const orfaos = await db.execute<{ id: string; nome: string; empresa: string; setor: string }>(sql`
    SELECT id, nome, empresa_id::text empresa, setor_id::text setor
    FROM indicador WHERE processo_id IS NULL
  `);
  if (orfaos.length === 0) {
    console.log("✓ Nenhum indicador órfão — nada a migrar.");
    return;
  }
  for (const o of orfaos) {
    const [proc] = await db.execute<{ id: string }>(sql`
      INSERT INTO processo (empresa_id, setor_id, nome, tipo)
      VALUES (${o.empresa}::uuid, ${o.setor}::uuid, ${o.nome}, 'kpi')
      RETURNING id
    `);
    await db.execute(sql`
      UPDATE indicador SET processo_id = ${proc.id}::uuid, atualizado_em = NOW()
      WHERE id = ${o.id}::uuid
    `);
    console.log(`✓ "${o.nome}" vinculado ao processo kpi ${proc.id.slice(0, 8)}…`);
  }
  console.log(`✓ ${orfaos.length} indicador(es) órfão(s) migrado(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("Falha:", e); process.exit(1); });
