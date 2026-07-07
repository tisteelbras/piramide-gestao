// ————————————————————————————————————————————————
// Helpers compartilhados por todas as tabelas do SOS.
// Cada tabela nasce com id, timestamps e (quando fizer sentido)
// referência à empresa — o schema é single-tenant hoje, SaaS-ready amanhã.
// ————————————————————————————————————————————————
import { timestamp, uuid } from "drizzle-orm/pg-core";

/** Chave primária padrão: uuid gerado pelo banco. */
export const pk = () => uuid("id").primaryKey().defaultRandom();

/** Colunas de auditoria presentes em toda tabela. */
export const timestamps = {
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
};
