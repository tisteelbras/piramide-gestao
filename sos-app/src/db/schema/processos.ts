// ————————————————————————————————————————————————
// Domínio: Processos (Nível 3 — Operacional)
// Cada processo é um card expansível, avaliado em 8 eixos fixos.
// Guardamos a nota de cada eixo por processo.
// ————————————————————————————————————————————————
import { pgEnum, pgTable, text, uuid, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { empresa, setor } from "./organizacao";

export const eixoProcesso = pgEnum("eixo_processo", [
  "rotinas",
  "padronizacao",
  "planejamento",
  "prazo",
  "cronograma",
  "reunioes",
  "documentacao",
  "automacao",
]);

export const processo = pgTable("processo", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  ...timestamps,
});

export const avaliacaoProcesso = pgTable("avaliacao_processo", {
  id: pk(),
  processoId: uuid("processo_id")
    .notNull()
    .references(() => processo.id, { onDelete: "cascade" }),
  eixo: eixoProcesso("eixo").notNull(),
  nota: numeric("nota", { precision: 5, scale: 2 }),
  ...timestamps,
});

export const processoRelations = relations(processo, ({ one, many }) => ({
  empresa: one(empresa, { fields: [processo.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [processo.setorId], references: [setor.id] }),
  eixos: many(avaliacaoProcesso),
}));

export const avaliacaoProcessoRelations = relations(
  avaliacaoProcesso,
  ({ one }) => ({
    processo: one(processo, {
      fields: [avaliacaoProcesso.processoId],
      references: [processo.id],
    }),
  }),
);
