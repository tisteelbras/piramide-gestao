// ————————————————————————————————————————————————
// Domínio: Matriz de Responsabilidade (RACI)
//
// Materializa o pilar "Responsabilidades" da Governança Operacional:
// quem é responsável por cada atividade, quem aprova, quem é consultado
// e quem é informado.
//
// Desenho: a matriz NÃO cria entidades novas. As linhas são os PROCESSOS
// do setor (que já existem e são avaliados no N3) e as colunas são os
// COLABORADORES (que já vêm do organograma). Esta tabela guarda apenas a
// atribuição — a célula da matriz.
// ————————————————————————————————————————————————
import { pgEnum, pgTable, uuid, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { colaborador } from "./organizacao";
import { processo } from "./processos";

/** Papéis RACI:
 *  R (Responsible) — executa a atividade;
 *  A (Accountable) — aprova e responde por ela (idealmente um só);
 *  C (Consulted)   — é consultado antes da decisão;
 *  I (Informed)    — é informado do resultado. */
export const papelRaci = pgEnum("papel_raci", [
  "responsavel",
  "aprovador",
  "consultado",
  "informado",
]);

export const atribuicaoRaci = pgTable(
  "atribuicao_raci",
  {
    id: pk(),
    processoId: uuid("processo_id")
      .notNull()
      .references(() => processo.id, { onDelete: "cascade" }),
    colaboradorId: uuid("colaborador_id")
      .notNull()
      .references(() => colaborador.id, { onDelete: "cascade" }),
    papel: papelRaci("papel").notNull(),
    ...timestamps,
  },
  // Uma pessoa tem no máximo um papel por atividade (a célula é única).
  (t) => [unique("atribuicao_raci_processo_colaborador").on(t.processoId, t.colaboradorId)],
);

export const atribuicaoRaciRelations = relations(atribuicaoRaci, ({ one }) => ({
  processo: one(processo, {
    fields: [atribuicaoRaci.processoId],
    references: [processo.id],
  }),
  colaborador: one(colaborador, {
    fields: [atribuicaoRaci.colaboradorId],
    references: [colaborador.id],
  }),
}));
