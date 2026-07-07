// ————————————————————————————————————————————————
// Domínio: Resultado & Inteligência (Nível 4 + saídas da análise)
//   - indicador: KPIs cadastrados pelo gestor.
//   - diagnostico: saída da análise (regras hoje, IA depois) — gargalos,
//     riscos, incoerências, padrões.
//   - recomendacao: ações sugeridas, priorizadas, com impacto esperado.
//   - acaoPlano: itens do plano de ação (podem nascer de uma recomendação).
// ————————————————————————————————————————————————
import { pgEnum, pgTable, text, uuid, numeric, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { empresa, setor } from "./organizacao";
import { nivelPiramide } from "./avaliacao";

export const indicador = pgTable("indicador", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  unidade: text("unidade"),
  meta: numeric("meta", { precision: 12, scale: 2 }),
  valorAtual: numeric("valor_atual", { precision: 12, scale: 2 }),
  // KPI marcado como ausente → cruzado com recursos sistêmicos p/ sugestão.
  ehAusencia: boolean("eh_ausencia").notNull().default(false),
  ...timestamps,
});

export const severidade = pgEnum("severidade", ["baixa", "media", "alta"]);

/** Origem da análise — hoje "regra", futuramente "ia". */
export const origemAnalise = pgEnum("origem_analise", ["regra", "ia"]);

export const diagnostico = pgTable("diagnostico", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  nivel: nivelPiramide("nivel"),
  titulo: text("titulo").notNull(),
  detalhe: text("detalhe"),
  severidade: severidade("severidade").notNull().default("media"),
  origem: origemAnalise("origem").notNull().default("regra"),
  ...timestamps,
});

export const recomendacao = pgTable("recomendacao", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  diagnosticoId: uuid("diagnostico_id").references(() => diagnostico.id, {
    onDelete: "set null",
  }),
  titulo: text("titulo").notNull(),
  detalhe: text("detalhe"),
  // 1 = maior prioridade.
  prioridade: numeric("prioridade", { precision: 4, scale: 0 })
    .notNull()
    .default("3"),
  impactoEsperado: text("impacto_esperado"),
  origem: origemAnalise("origem").notNull().default("regra"),
  ...timestamps,
});

export const statusAcao = pgEnum("status_acao", [
  "pendente",
  "em_andamento",
  "concluida",
]);

export const acaoPlano = pgTable("acao_plano", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  recomendacaoId: uuid("recomendacao_id").references(() => recomendacao.id, {
    onDelete: "set null",
  }),
  titulo: text("titulo").notNull(),
  responsavel: text("responsavel"),
  status: statusAcao("status").notNull().default("pendente"),
  ...timestamps,
});

// —————————————————— Relations ——————————————————
export const indicadorRelations = relations(indicador, ({ one }) => ({
  empresa: one(empresa, { fields: [indicador.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [indicador.setorId], references: [setor.id] }),
}));

export const diagnosticoRelations = relations(diagnostico, ({ one, many }) => ({
  setor: one(setor, { fields: [diagnostico.setorId], references: [setor.id] }),
  recomendacoes: many(recomendacao),
}));

export const recomendacaoRelations = relations(recomendacao, ({ one, many }) => ({
  setor: one(setor, { fields: [recomendacao.setorId], references: [setor.id] }),
  diagnostico: one(diagnostico, {
    fields: [recomendacao.diagnosticoId],
    references: [diagnostico.id],
  }),
  acoes: many(acaoPlano),
}));

export const acaoPlanoRelations = relations(acaoPlano, ({ one }) => ({
  setor: one(setor, { fields: [acaoPlano.setorId], references: [setor.id] }),
  recomendacao: one(recomendacao, {
    fields: [acaoPlano.recomendacaoId],
    references: [recomendacao.id],
  }),
}));
