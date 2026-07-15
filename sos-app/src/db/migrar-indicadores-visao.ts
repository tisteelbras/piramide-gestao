// ————————————————————————————————————————————————
// Migração de dados — Visão: "Diretrizes Operacionais" vira "Indicadores de
// Desempenho" e as etapas são reordenadas.
//
// Nova ordem (índice = ordem de exibição):
//   0. Identidade Organizacional (Quem somos?)
//   1. Estrutura Organizacional (Quem faz o quê?)
//   2. Direcionamento Estratégico (Para onde vamos?)
//   3. Indicadores de Desempenho (Como medimos?)   ← era "Diretrizes Operacionais"
//   4. Governança Operacional (Como funcionamos?)
//   5. Gestão de Competências (Quem executa e como evolui?)
//
// Renomear pelo id (UPDATE do título) preserva respostas, descrições e
// anexos — o critério é o mesmo, só muda o rótulo.
//
// Idempotente. Uso: npx tsx --env-file=.env.local src/db/migrar-indicadores-visao.ts
// ————————————————————————————————————————————————
import { sql } from "drizzle-orm";
import { db } from "./index";

const NOVO = "Indicadores de Desempenho (Como medimos?)";
const ANTIGO = "Diretrizes Operacionais (Quais padrões seguimos?)";

// título → ordem de exibição
const ORDEM: Record<string, number> = {
  "Identidade Organizacional (Quem somos?)": 0,
  "Estrutura Organizacional (Quem faz o quê?)": 1,
  "Direcionamento Estratégico (Para onde vamos?)": 2,
  [NOVO]: 3,
  "Governança Operacional (Como funcionamos?)": 4,
  "Gestão de Competências (Quem executa e como evolui?)": 5,
};

async function main() {
  // 1) Renomeia "Diretrizes Operacionais" → "Indicadores de Desempenho".
  //    Casa tanto o antigo quanto o novo (idempotente).
  const ren = await db.execute(sql`
    UPDATE criterio SET titulo = ${NOVO}
    WHERE nivel = 'visao' AND titulo IN (${ANTIGO}, ${NOVO})
  `);
  console.log(
    ren.count
      ? `✓ Etapa renomeada para "${NOVO}".`
      : `✓ Etapa já renomeada — nada a fazer.`,
  );

  // 2) Reordena todas as etapas da Visão pela nova ordem.
  for (const [titulo, ordem] of Object.entries(ORDEM)) {
    await db.execute(sql`
      UPDATE criterio SET ordem = ${ordem}
      WHERE nivel = 'visao' AND titulo = ${titulo}
    `);
  }
  console.log("✓ Ordem das etapas da Visão atualizada.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("Falha:", e); process.exit(1); });
