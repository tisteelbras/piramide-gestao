// ————————————————————————————————————————————————
// Domínio: Governança do NEXO (ciclos de avaliação e metas)
//
// A direção/admin define o ritmo do diagnóstico:
//   - politicaAvaliacao: 1 linha por empresa — periodicidade do ciclo,
//     antecedência do aviso de vencimento e meta padrão de maturidade.
//   - cicloSnapshot: fotografia da maturidade de um setor no fechamento
//     de um ciclo. É a base do histórico/evolução — o diagnóstico vivo
//     continua sendo calculado em tempo real pelo motor NEXO.
// Aditivo: nada aqui altera as tabelas do diagnóstico.
// ————————————————————————————————————————————————
import { pgTable, text, uuid, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { empresa, setor } from "./organizacao";

export const politicaAvaliacao = pgTable("politica_avaliacao", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" })
    .unique(),
  // De quanto em quanto tempo cada setor deve reavaliar (dias).
  periodicidadeDias: integer("periodicidade_dias").notNull().default(90),
  // Com quantos dias de antecedência o vencimento vira alerta.
  avisoDias: integer("aviso_dias").notNull().default(15),
  // Meta padrão de maturidade (0–100) para setores sem meta própria.
  metaPadrao: integer("meta_padrao").notNull().default(80),
  ...timestamps,
});

export const cicloSnapshot = pgTable("ciclo_snapshot", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  fechadoEm: timestamp("fechado_em", { withTimezone: true }).notNull().defaultNow(),
  fechadoPor: text("fechado_por"),
  geral: numeric("geral", { precision: 5, scale: 2 }).notNull(),
  visao: numeric("visao", { precision: 5, scale: 2 }).notNull(),
  tatico: numeric("tatico", { precision: 5, scale: 2 }).notNull(),
  processos: numeric("processos", { precision: 5, scale: 2 }).notNull(),
  resultados: numeric("resultados", { precision: 5, scale: 2 }).notNull(),
  ...timestamps,
});

/** Meta de maturidade específica de um setor (0–100). Quando null,
 *  vale a metaPadrao da política. Tabela própria para não alterar
 *  a tabela `setor` existente. */
export const metaSetor = pgTable("meta_setor", {
  id: pk(),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" })
    .unique(),
  meta: integer("meta").notNull(),
  ...timestamps,
});

// —————————————————— Relations ——————————————————
export const politicaAvaliacaoRelations = relations(politicaAvaliacao, ({ one }) => ({
  empresa: one(empresa, { fields: [politicaAvaliacao.empresaId], references: [empresa.id] }),
}));

export const cicloSnapshotRelations = relations(cicloSnapshot, ({ one }) => ({
  empresa: one(empresa, { fields: [cicloSnapshot.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [cicloSnapshot.setorId], references: [setor.id] }),
}));

export const metaSetorRelations = relations(metaSetor, ({ one }) => ({
  setor: one(setor, { fields: [metaSetor.setorId], references: [setor.id] }),
}));
