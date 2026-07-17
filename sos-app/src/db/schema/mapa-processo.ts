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
import { pgEnum, pgTable, text, uuid, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { colaborador } from "./organizacao";
import { processo } from "./processos";

/** LEGADO — não usar. Criado quando o fluxograma era um "modo de ver" o
 *  Mapa; hoje o Fluxograma é ferramenta própria (db/schema/fluxograma.ts) e
 *  liga PROCESSOS, não passos. A coluna tipo_no permanece inerte apenas para
 *  não exigir uma migração destrutiva. */
export const tipoNoFluxo = pgEnum("tipo_no_fluxo", [
  "inicio",
  "acao",
  "decisao",
  "fim",
]);

export const etapaProcesso = pgTable("etapa_processo", {
  id: pk(),
  processoId: uuid("processo_id")
    .notNull()
    .references(() => processo.id, { onDelete: "cascade" }),
  // Posição no fluxo (0, 1, 2…). Define a ordem das etapas.
  ordem: integer("ordem").notNull().default(0),
  // Forma do nó no fluxograma (início/ação/decisão/fim). Não muda a Lista.
  tipoNo: tipoNoFluxo("tipo_no").notNull().default("acao"),
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
