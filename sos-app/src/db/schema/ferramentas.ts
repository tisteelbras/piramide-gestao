// ————————————————————————————————————————————————
// Domínio: Ferramentas de gestão (hub NEXO)
//
// O NEXO é um hub de ferramentas; o SOS (diagnóstico da pirâmide) é a
// principal. Estas tabelas suportam as demais ferramentas e são 100%
// ADITIVAS: nada aqui altera o schema do diagnóstico.
//
//   - plano5w2h / acao5w2h: planos de ação 5W2H (o quê, por quê, onde,
//     quando, quem, como, quanto custa) com status por ação.
//   - ishikawa / causaIshikawa: análise de causa raiz (espinha de
//     peixe), causas categorizadas nos 6M.
//   - itemBcg: portfólio na Matriz BCG (participação × crescimento,
//     escala 0–100 presa de 10 em 10; quadrante é derivado no app).
// ————————————————————————————————————————————————
import { pgEnum, pgTable, text, uuid, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { empresa, setor } from "./organizacao";
import { statusAcao, recomendacao } from "./resultado";

// —————————————————— 5W2H ——————————————————
export const plano5w2h = pgTable("plano_5w2h", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  // Opcional: um plano pode nascer de um setor diagnosticado no SOS.
  setorId: uuid("setor_id").references(() => setor.id, { onDelete: "set null" }),
  titulo: text("titulo").notNull(),
  ...timestamps,
});

export const acao5w2h = pgTable("acao_5w2h", {
  id: pk(),
  planoId: uuid("plano_id")
    .notNull()
    .references(() => plano5w2h.id, { onDelete: "cascade" }),
  // De qual recomendação do diagnóstico esta ação nasceu (quando nasceu).
  // Fecha o ciclo: medir → recomendar → AGIR → acompanhar.
  recomendacaoId: uuid("recomendacao_id").references(() => recomendacao.id, {
    onDelete: "set null",
  }),
  oQue: text("o_que").notNull(),
  porQue: text("por_que"),
  onde: text("onde"),
  // "quando" em texto livre continua existindo (compatibilidade e nuance),
  // mas o PRAZO real que dá o status "atrasada" é a data abaixo.
  quando: text("quando"),
  prazo: date("prazo"),
  quem: text("quem"),
  como: text("como"),
  quantoCusta: text("quanto_custa"),
  status: statusAcao("status").notNull().default("pendente"),
  // Marcada quando a ação é concluída — mede tempo de execução e trava o
  // "atrasada" (uma ação concluída nunca fica vermelha por prazo).
  concluidaEm: timestamp("concluida_em"),
  ...timestamps,
});

// —————————————————— Ishikawa (6M) ——————————————————
export const categoriaCausaIshikawa = pgEnum("categoria_causa_ishikawa", [
  "metodo",
  "maquina",
  "material",
  "mao_de_obra",
  "medicao",
  "meio_ambiente",
]);

export const ishikawa = pgTable("ishikawa", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id").references(() => setor.id, { onDelete: "set null" }),
  // O efeito/problema analisado (a "cabeça do peixe").
  problema: text("problema").notNull(),
  ...timestamps,
});

export const causaIshikawa = pgTable("causa_ishikawa", {
  id: pk(),
  ishikawaId: uuid("ishikawa_id")
    .notNull()
    .references(() => ishikawa.id, { onDelete: "cascade" }),
  categoria: categoriaCausaIshikawa("categoria").notNull(),
  descricao: text("descricao").notNull(),
  ...timestamps,
});

// —————————————————— Matriz BCG ——————————————————
export const itemBcg = pgTable("item_bcg", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  // Participação relativa de mercado (0–100, presa de 10 em 10).
  participacao: numeric("participacao", { precision: 5, scale: 2 }),
  // Crescimento do mercado (0–100, presa de 10 em 10).
  crescimento: numeric("crescimento", { precision: 5, scale: 2 }),
  ...timestamps,
});

// —————————————————— Relations ——————————————————
export const plano5w2hRelations = relations(plano5w2h, ({ one, many }) => ({
  empresa: one(empresa, { fields: [plano5w2h.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [plano5w2h.setorId], references: [setor.id] }),
  acoes: many(acao5w2h),
}));

export const acao5w2hRelations = relations(acao5w2h, ({ one }) => ({
  plano: one(plano5w2h, { fields: [acao5w2h.planoId], references: [plano5w2h.id] }),
  recomendacao: one(recomendacao, { fields: [acao5w2h.recomendacaoId], references: [recomendacao.id] }),
}));

export const ishikawaRelations = relations(ishikawa, ({ one, many }) => ({
  empresa: one(empresa, { fields: [ishikawa.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [ishikawa.setorId], references: [setor.id] }),
  causas: many(causaIshikawa),
}));

export const causaIshikawaRelations = relations(causaIshikawa, ({ one }) => ({
  ishikawa: one(ishikawa, { fields: [causaIshikawa.ishikawaId], references: [ishikawa.id] }),
}));

export const itemBcgRelations = relations(itemBcg, ({ one }) => ({
  empresa: one(empresa, { fields: [itemBcg.empresaId], references: [empresa.id] }),
}));
