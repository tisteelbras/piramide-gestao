// ————————————————————————————————————————————————
// Registro de DOCUMENTOS GERADOS — rastreabilidade ISO 9001.
//
// Todo PDF que o NEXO gera (plano de ação, 5W2H, Ishikawa, objetivos,
// controles, sucessão, RACI, etc.) grava aqui uma linha com:
//   - código legível (ex.: NEXO-A1B2C3) que aparece no rodapé do PDF;
//   - quem gerou (autor) e quando;
//   - de qual ferramenta/setor veio.
// Assim, num documento levado à reunião ou à auditoria, dá para rastrear
// "quem fez, quando e a partir de quê".
// ————————————————————————————————————————————————
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk } from "./_shared";
import { empresa, setor, usuario } from "./organizacao";

export const documentoGerado = pgTable("documento_gerado", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  // Código curto e legível impresso no PDF (ex.: "NEXO-7F3A2B").
  codigo: text("codigo").notNull().unique(),
  // Que tipo de documento (ex.: "Plano de ação", "Análise Ishikawa").
  tipo: text("tipo").notNull(),
  titulo: text("titulo").notNull(),
  // Nome do arquivo PDF em uploads/ (para download por /api/documento/[codigo]).
  nomeArquivo: text("nome_arquivo").notNull(),
  // Origem opcional: setor de onde saiu.
  setorId: uuid("setor_id").references(() => setor.id, { onDelete: "set null" }),
  // Autor: nome congelado no momento (o usuário pode mudar de nome depois).
  autorId: uuid("autor_id").references(() => usuario.id, { onDelete: "set null" }),
  autorNome: text("autor_nome").notNull(),
  geradoEm: timestamp("gerado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const documentoGeradoRelations = relations(documentoGerado, ({ one }) => ({
  empresa: one(empresa, { fields: [documentoGerado.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [documentoGerado.setorId], references: [setor.id] }),
  autor: one(usuario, { fields: [documentoGerado.autorId], references: [usuario.id] }),
}));
