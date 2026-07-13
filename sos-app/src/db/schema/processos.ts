// ————————————————————————————————————————————————
// Domínio: Processos (Nível 3 — Operacional)
// Cada processo é um card expansível, avaliado nas 5 etapas do ciclo
// de gestão: Padronização, Execução, Planejamento, Monitoramento e
// Melhoria Contínua. Guardamos a nota de cada eixo por processo.
// ————————————————————————————————————————————————
import { pgEnum, pgTable, text, uuid, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { empresa, setor } from "./organizacao";

// Valores antigos (rotinas, prazo, cronograma, reunioes, documentacao,
// automacao) permanecem no enum porque Postgres não remove valores de
// enum; o app usa só os 5 do EIXOS_PROCESSO.
export const eixoProcesso = pgEnum("eixo_processo", [
  "rotinas",
  "padronizacao",
  "planejamento",
  "prazo",
  "cronograma",
  "reunioes",
  "documentacao",
  "automacao",
  "execucao",
  "monitoramento",
  "melhoria_continua",
]);

/** Tipo do processo (modelo NEXO): processos tipados alimentam o nível
 *  RESULTADOS ("Resultado da Avaliação de desempenho", etc.); tipo
 *  "outro" conta apenas no nível PROCESSOS. */
export const tipoProcesso = pgEnum("tipo_processo", [
  "desempenho",
  "governanca",
  "monitoramento",
  "kpi",
  "outro",
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
  tipo: tipoProcesso("tipo").notNull().default("outro"),
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
