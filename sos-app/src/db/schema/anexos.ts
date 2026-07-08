// ————————————————————————————————————————————————
// Domínio: Anexos
// Documentos anexados a uma etapa (critério) dentro de uma avaliação —
// ex.: o PDF do organograma na etapa "Organograma atualizado" da Visão.
// O arquivo físico fica em uploads/ (fora do git); aqui só os metadados.
// ————————————————————————————————————————————————
import { pgTable, text, uuid, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { avaliacao, criterio } from "./avaliacao";

export const anexo = pgTable("anexo", {
  id: pk(),
  avaliacaoId: uuid("avaliacao_id")
    .notNull()
    .references(() => avaliacao.id, { onDelete: "cascade" }),
  criterioId: uuid("criterio_id")
    .notNull()
    .references(() => criterio.id, { onDelete: "cascade" }),
  nomeOriginal: text("nome_original").notNull(),
  // Nome do arquivo no disco (aleatório, dentro de uploads/).
  nomeArquivo: text("nome_arquivo").notNull(),
  mimeType: text("mime_type"),
  tamanhoBytes: integer("tamanho_bytes"),
  ...timestamps,
});

export const anexoRelations = relations(anexo, ({ one }) => ({
  avaliacao: one(avaliacao, { fields: [anexo.avaliacaoId], references: [avaliacao.id] }),
  criterio: one(criterio, { fields: [anexo.criterioId], references: [criterio.id] }),
}));
