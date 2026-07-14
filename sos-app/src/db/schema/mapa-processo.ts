// ————————————————————————————————————————————————
// Domínio: Mapa de Processos (fluxo oficial de execução)
//
// Materializa o pilar "Padronização" da Governança Operacional:
// "existe uma forma oficial de executar o trabalho?".
//
// Desenho: NÃO cria processos novos. Cada etapa pertence a um PROCESSO
// que já existe (cadastrado no N3) e descreve um passo do fluxo — o que
// se faz, quem faz (um colaborador do organograma) e o que sai dali.
// Assim o mapa apenas detalha o que já é medido.
// ————————————————————————————————————————————————
import { pgTable, text, uuid, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { colaborador } from "./organizacao";
import { processo } from "./processos";

export const etapaProcesso = pgTable("etapa_processo", {
  id: pk(),
  processoId: uuid("processo_id")
    .notNull()
    .references(() => processo.id, { onDelete: "cascade" }),
  // Posição no fluxo (0, 1, 2…). Define a ordem das etapas.
  ordem: integer("ordem").notNull().default(0),
  // O que é feito neste passo.
  titulo: text("titulo").notNull(),
  // Detalhamento: como executar (a instrução de trabalho).
  descricao: text("descricao"),
  // Quem executa este passo — opcional; vem do organograma.
  responsavelId: uuid("responsavel_id").references(() => colaborador.id, {
    onDelete: "set null",
  }),
  // O que sai deste passo (documento, aprovação, registro…).
  entrega: text("entrega"),
  ...timestamps,
});

export const etapaProcessoRelations = relations(etapaProcesso, ({ one }) => ({
  processo: one(processo, {
    fields: [etapaProcesso.processoId],
    references: [processo.id],
  }),
  responsavel: one(colaborador, {
    fields: [etapaProcesso.responsavelId],
    references: [colaborador.id],
  }),
}));
