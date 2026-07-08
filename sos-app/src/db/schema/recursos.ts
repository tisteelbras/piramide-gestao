// ————————————————————————————————————————————————
// Domínio: Recursos (Nível 2 — Tático)
//
// Entidades cadastráveis pelo gestor que são AVALIADAS:
//   - avaliacaoColaborador: nota de cada colaborador em Cultura, Fit,
//     Treinamento, Desempenho (RH).
//   - sistema: ERP/CRM/Planner/MRP… com avaliação. Um "sistema" pode ser
//     marcado como necessidade (ainda não existe) → gera recomendação.
//   - ativo: estrutura física, máquinas, hardware… com avaliação.
// ————————————————————————————————————————————————
import { pgEnum, pgTable, text, uuid, numeric, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { empresa, setor, colaborador } from "./organizacao";
import { avaliacao } from "./avaliacao";

/** Eixos de avaliação de RH de um colaborador. */
export const eixoRh = pgEnum("eixo_rh", [
  "cultura",
  "fit_cultural",
  "treinamento",
  "desempenho",
]);

export const avaliacaoColaborador = pgTable("avaliacao_colaborador", {
  id: pk(),
  avaliacaoId: uuid("avaliacao_id")
    .notNull()
    .references(() => avaliacao.id, { onDelete: "cascade" }),
  colaboradorId: uuid("colaborador_id")
    .notNull()
    .references(() => colaborador.id, { onDelete: "cascade" }),
  eixo: eixoRh("eixo").notNull(),
  nota: numeric("nota", { precision: 5, scale: 2 }),
  ...timestamps,
});

export const categoriaSistema = pgEnum("categoria_sistema", [
  "erp",
  "crm",
  "planner",
  "mrp",
  "interno",
  "outro",
]);

export const sistema = pgTable("sistema", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id").references(() => setor.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  categoria: categoriaSistema("categoria").notNull().default("outro"),
  nota: numeric("nota", { precision: 5, scale: 2 }),
  // Quando true, é uma NECESSIDADE (sistema importante que não existe) —
  // dispara recomendação de melhoria.
  ehNecessidade: boolean("eh_necessidade").notNull().default(false),
  // Na necessidade: o gestor explica como esse sistema melhoraria a gestão.
  justificativa: text("justificativa"),
  ...timestamps,
});

export const categoriaAtivo = pgEnum("categoria_ativo", [
  "estrutura_fisica",
  "logistica",
  "maquina",
  "hardware",
  "celular",
  "equipamento",
  "infraestrutura",
  "outro",
]);

export const ativo = pgTable("ativo", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id").references(() => setor.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  categoria: categoriaAtivo("categoria").notNull().default("outro"),
  nota: numeric("nota", { precision: 5, scale: 2 }),
  // Quando a nota não é 100, o gestor explica o porquê.
  observacao: text("observacao"),
  ...timestamps,
});

// —————————————————— Relations ——————————————————
export const avaliacaoColaboradorRelations = relations(
  avaliacaoColaborador,
  ({ one }) => ({
    avaliacao: one(avaliacao, {
      fields: [avaliacaoColaborador.avaliacaoId],
      references: [avaliacao.id],
    }),
    colaborador: one(colaborador, {
      fields: [avaliacaoColaborador.colaboradorId],
      references: [colaborador.id],
    }),
  }),
);

export const sistemaRelations = relations(sistema, ({ one }) => ({
  empresa: one(empresa, { fields: [sistema.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [sistema.setorId], references: [setor.id] }),
}));

export const ativoRelations = relations(ativo, ({ one }) => ({
  empresa: one(empresa, { fields: [ativo.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [ativo.setorId], references: [setor.id] }),
}));
