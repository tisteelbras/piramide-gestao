// ————————————————————————————————————————————————
// Seed inicial do SOS.
// Popula: empresa Steelbras, os setores do protótipo e os critérios
// dos 4 níveis da pirâmide. Idempotente-ish: só insere se a empresa
// ainda não existir (evita duplicar ao rodar de novo).
//
// Rodar: npx tsx src/db/seed.ts   (após configurar DATABASE_URL)
// ————————————————————————————————————————————————
import { db } from "./index";
import {
  empresa,
  setor,
  criterio,
  type nivelPiramide,
  type grupoCriterio,
} from "./schema";
import { eq } from "drizzle-orm";

const SETORES = ["Estoque AC", "PCP", "Compras", "Comercial", "Financeiro", "Estoque MT"];

type Nivel = (typeof nivelPiramide.enumValues)[number];
type Grupo = (typeof grupoCriterio.enumValues)[number];

// Critérios semente por nível — a "biblioteca de perguntas" inicial.
// O admin pode editar/expandir depois pela interface.
const CRITERIOS: Array<{ nivel: Nivel; grupo: Grupo; titulo: string }> = [
  // N1 — Visão (estratégico)
  { nivel: "visao", grupo: "geral", titulo: "Identidade e propósito definidos" },
  { nivel: "visao", grupo: "geral", titulo: "Estratégia clara para o setor" },
  { nivel: "visao", grupo: "geral", titulo: "Cultura disseminada na equipe" },
  { nivel: "visao", grupo: "geral", titulo: "Responsabilidades mapeadas" },
  { nivel: "visao", grupo: "geral", titulo: "Organograma atualizado" },
  // N2 — Tático (recursos)
  { nivel: "tatico", grupo: "rh", titulo: "Equipe avaliada em cultura e fit" },
  { nivel: "tatico", grupo: "rh", titulo: "Plano de treinamento e desenvolvimento" },
  { nivel: "tatico", grupo: "sistemico", titulo: "Sistemas essenciais em uso (ERP/CRM/…)" },
  { nivel: "tatico", grupo: "estrutural", titulo: "Estrutura física e equipamentos adequados" },
  // N3 — Processos (operacional)
  { nivel: "processos", grupo: "geral", titulo: "Processos mapeados e padronizados" },
  { nivel: "processos", grupo: "geral", titulo: "Cronograma e prazos sob controle" },
  { nivel: "processos", grupo: "geral", titulo: "Ritmo de reuniões e documentação" },
  // N4 — Resultados (indicadores)
  { nivel: "resultados", grupo: "indicadores", titulo: "KPIs definidos e acompanhados" },
  { nivel: "resultados", grupo: "governanca", titulo: "Governança e controles" },
  { nivel: "resultados", grupo: "monitoramento", titulo: "Monitoramento contínuo" },
  { nivel: "resultados", grupo: "desempenho", titulo: "Avaliação de desempenho aplicada" },
];

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
