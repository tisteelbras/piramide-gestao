// Migração de dados — rebrand NEXO (jul/2026):
//   1. Renomeia as etapas da Visão para os nomes de capacidade
//      (preserva respostas, descrições e anexos, pois o id não muda)
//      e ajusta a ordem de exibição.
//   2. Remapeia os eixos de processo antigos para os novos, na ordem
//      respectiva: rotinas→padronizacao, padronizacao→execucao,
//      cronograma→monitoramento, reunioes→melhoria_continua.
//   3. Arredonda todas as notas para múltiplos de 10 (escala oficial).
//   4. Remove a etapa "Cultura e valores disseminados" (absorvida pela
//      Identidade Organizacional) — respostas/anexos caem por cascade.
// Idempotente: pode rodar mais de uma vez sem efeito colateral.
// Uso: npx tsx --env-file=.env.local src/db/migrar-nexo-nomes.ts
import { sql } from "drizzle-orm";
import { db } from "./index";

const RENOMEIA_VISAO: Array<{ de: string; para: string; ordem: number }> = [
  { de: "Organograma atualizado", para: "Estrutura Organizacional (Quem faz o quê?)", ordem: 0 },
  { de: "Identidade e propósito do setor definidos", para: "Identidade Organizacional (Quem somos?)", ordem: 1 },
  { de: "Estratégia clara e comunicada à equipe", para: "Direcionamento Estratégico (Para onde vamos?)", ordem: 2 },
  { de: "Responsabilidade e Processos Mapeados", para: "Governança Operacional (Como funcionamos?)", ordem: 3 },
  { de: "Metas do setor alinhadas às da empresa", para: "Gestão por Objetivos (O que precisamos entregar?)", ordem: 4 },
  { de: "Pilares (qualidade, prazo, eficiência) definidos", para: "Diretrizes Operacionais (Quais padrões seguimos?)", ordem: 5 },
  { de: "Gestão de talentos e competências", para: "Gestão de Competências (Quem executa e como evolui?)", ordem: 6 },
];

async function main() {
  // 1) Títulos e ordem da Visão (casa tanto o título antigo quanto o novo,
  //    para a ordem ser reaplicada em reexecuções).
  for (const r of RENOMEIA_VISAO) {
    await db.execute(sql`
      UPDATE criterio SET titulo = ${r.para}, ordem = ${r.ordem}
      WHERE nivel = 'visao' AND titulo IN (${r.de}, ${r.para})
    `);
  }
  console.log("✓ Etapas da Visão renomeadas e reordenadas.");

  // 2) Eixos de processo: mapeamento posicional antigo → novo.
  //    Guarda de idempotência: 'rotinas'/'cronograma'/'reunioes' só
  //    existem antes da migração; se não há nenhum, nada a remapear
  //    (evita empurrar a nova 'padronizacao' para 'execucao' num re-run).
  const [{ pendentes }] = await db.execute<{ pendentes: number }>(sql`
    SELECT COUNT(*)::int AS pendentes FROM avaliacao_processo
    WHERE eixo IN ('rotinas', 'cronograma', 'reunioes')
  `);
  if (pendentes > 0) {
    const remap = await db.execute(sql`
      UPDATE avaliacao_processo SET eixo = CASE eixo
        WHEN 'rotinas'       THEN 'padronizacao'::eixo_processo
        WHEN 'padronizacao'  THEN 'execucao'::eixo_processo
        WHEN 'cronograma'    THEN 'monitoramento'::eixo_processo
        WHEN 'reunioes'      THEN 'melhoria_continua'::eixo_processo
        ELSE eixo END
      WHERE eixo IN ('rotinas', 'padronizacao', 'cronograma', 'reunioes')
    `);
    console.log(`✓ Eixos de processo remapeados (${remap.count ?? 0} notas).`);
  } else {
    console.log("✓ Eixos de processo já migrados — nada a remapear.");
  }

  // 3) Escala oficial: notas presas de 10 em 10.
  for (const tabela of ["avaliacao_processo", "avaliacao_colaborador", "sistema", "ativo"]) {
    await db.execute(sql`
      UPDATE ${sql.raw(tabela)}
      SET nota = LEAST(100, GREATEST(0, ROUND(nota / 10) * 10))
      WHERE nota IS NOT NULL AND (nota % 10 <> 0 OR nota < 0 OR nota > 100)
    `);
  }
  console.log("✓ Notas existentes arredondadas para múltiplos de 10.");

  // 4) Remove a etapa absorvida pela Identidade Organizacional.
  //    Respostas e anexos ligados a ela caem por cascade.
  const del = await db.execute(sql`
    DELETE FROM criterio
    WHERE nivel = 'visao' AND titulo = 'Cultura e valores disseminados'
  `);
  console.log(
    del.count
      ? "✓ Etapa 'Cultura e valores disseminados' removida."
      : "✓ Etapa 'Cultura e valores disseminados' já não existe — nada a remover.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("Falha:", e); process.exit(1); });
