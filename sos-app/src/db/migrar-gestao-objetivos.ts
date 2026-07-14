// ————————————————————————————————————————————————
// Migração de dados — Gestão por Objetivos sai da VISÃO e vira RESULTADO.
//
// Porquê: a Gestão por Objetivos só se faz DEPOIS que os processos estão
// alinhados. Ela não é algo que se concebe (Visão), é algo que a execução
// produz (Resultado). Vira um tipo de processo (gestao_objetivos), cuja
// nota sobe para o N4 como "Resultado da Gestão por Objetivos".
//
// Cuidado com o que já existe: a etapa da Visão pode ter sido revisada e
// pode ter DESCRIÇÃO e ANEXOS. Apagar o critério levaria isso junto (as FKs
// são ON DELETE CASCADE). Então, antes de remover:
//   - todo setor que tinha a etapa REVISADA ganha um processo
//     "Gestão por Objetivos" do tipo gestao_objetivos;
//   - a descrição escrita na etapa é copiada para a descrição do processo;
//   - o processo nasce com nota 100 nos 5 eixos SE a etapa estava revisada
//     (revisado na Visão = concebido; a nota inicial reflete isso e o
//     gestor reavalia depois), e sem notas se estava em branco.
//
// Idempotente: rodar de novo não duplica processo nem reescreve notas.
// Uso: npx tsx --env-file=.env.local src/db/migrar-gestao-objetivos.ts
// ————————————————————————————————————————————————
import { sql } from "drizzle-orm";
import { db } from "./index";

const TITULO = "Gestão por Objetivos (O que precisamos entregar?)";
const NOME_PROCESSO = "Gestão por Objetivos";
const EIXOS = ["padronizacao", "execucao", "planejamento", "monitoramento", "melhoria_continua"];

async function main() {
  // 1) Onde a etapa estava revisada (e o que foi escrito nela).
  const revisadas = await db.execute<{
    setor_id: string;
    empresa_id: string;
    observacao: string | null;
  }>(sql`
    SELECT a.setor_id, a.empresa_id, r.observacao
    FROM resposta r
    JOIN criterio  c ON c.id = r.criterio_id
    JOIN avaliacao a ON a.id = r.avaliacao_id
    WHERE c.nivel = 'visao'
      AND c.titulo = ${TITULO}
      AND r.status = 'revisada'
  `);

  if (revisadas.length === 0) {
    console.log("• Nenhum setor tinha a etapa revisada — nada a converter.");
  }

  for (const linha of revisadas) {
    // Idempotência: não cria de novo se o setor já tem o processo.
    const [existente] = await db.execute<{ id: string }>(sql`
      SELECT id FROM processo
      WHERE setor_id = ${linha.setor_id} AND tipo = 'gestao_objetivos'
      LIMIT 1
    `);
    if (existente) {
      console.log(`• Setor ${linha.setor_id} já tem o processo — pulando.`);
      continue;
    }

    const [novo] = await db.execute<{ id: string }>(sql`
      INSERT INTO processo (empresa_id, setor_id, nome, descricao, tipo)
      VALUES (${linha.empresa_id}, ${linha.setor_id}, ${NOME_PROCESSO},
              ${linha.observacao}, 'gestao_objetivos')
      RETURNING id
    `);

    // Revisada na Visão = concebida. Nasce com 100 nos 5 eixos para não
    // derrubar o Resultado de quem já tinha feito o dever de casa; o gestor
    // reavalia com sinceridade na tela de Processos.
    for (const eixo of EIXOS) {
      await db.execute(sql`
        INSERT INTO avaliacao_processo (processo_id, eixo, nota)
        VALUES (${novo.id}, ${sql.raw(`'${eixo}'::eixo_processo`)}, 100)
      `);
    }
    console.log(`✓ Setor ${linha.setor_id}: processo "${NOME_PROCESSO}" criado (100 nos 5 eixos).`);
  }

  // 2) Remove a etapa da Visão. Respostas/anexos dela caem por cascade —
  //    a descrição já foi preservada acima, no processo.
  const del = await db.execute(sql`
    DELETE FROM criterio WHERE nivel = 'visao' AND titulo = ${TITULO}
  `);
  console.log(
    del.count
      ? `✓ Etapa "${TITULO}" removida da Visão (a Visão passa a ter 6 etapas).`
      : "✓ Etapa já não existia na Visão — nada a remover.",
  );

  // 3) Reordena as etapas restantes da Visão para não deixar buraco.
  await db.execute(sql`
    WITH ord AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY ordem, titulo) - 1 AS nova
      FROM criterio WHERE nivel = 'visao'
    )
    UPDATE criterio c SET ordem = ord.nova FROM ord WHERE c.id = ord.id
  `);
  console.log("✓ Ordem das etapas da Visão normalizada.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("Falha:", e); process.exit(1); });
