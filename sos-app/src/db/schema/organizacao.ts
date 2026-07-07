// ————————————————————————————————————————————————
// Domínio: Organização
// Empresa → Setores → Usuários (líderes/admin/direção) → Colaboradores.
// A tabela `empresa` guarda 1 registro (Steelbras) hoje; deixar a FK em
// tudo prepara o terreno para multi-tenant sem refazer o banco.
// ————————————————————————————————————————————————
import { pgEnum, pgTable, text, uuid, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";

/** Papéis de acesso no sistema. */
export const papelUsuario = pgEnum("papel_usuario", [
  "admin",
  "direcao",
  "lider",
]);

export const empresa = pgTable("empresa", {
  id: pk(),
  nome: text("nome").notNull(),
  cnpj: text("cnpj"),
  ...timestamps,
});

export const setor = pgTable("setor", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  ...timestamps,
});

export const usuario = pgTable("usuario", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  papel: papelUsuario("papel").notNull().default("lider"),
  // Se for líder, qual setor lidera (null p/ admin/direção).
  setorId: uuid("setor_id").references(() => setor.id, { onDelete: "set null" }),
  ativo: boolean("ativo").notNull().default(true),
  ...timestamps,
});

/** Colaboradores da equipe de um setor — cadastrados manualmente enquanto
 *  não houver integração com o RH. */
export const colaborador = pgTable("colaborador", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  cargo: text("cargo"),
  ...timestamps,
});

// —————————————————— Relations (para queries tipadas) ——————————————————
export const empresaRelations = relations(empresa, ({ many }) => ({
  setores: many(setor),
  usuarios: many(usuario),
  colaboradores: many(colaborador),
}));

export const setorRelations = relations(setor, ({ one, many }) => ({
  empresa: one(empresa, { fields: [setor.empresaId], references: [empresa.id] }),
  colaboradores: many(colaborador),
  lideres: many(usuario),
}));

export const usuarioRelations = relations(usuario, ({ one }) => ({
  empresa: one(empresa, { fields: [usuario.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [usuario.setorId], references: [setor.id] }),
}));

export const colaboradorRelations = relations(colaborador, ({ one }) => ({
  empresa: one(empresa, {
    fields: [colaborador.empresaId],
    references: [empresa.id],
  }),
  setor: one(setor, { fields: [colaborador.setorId], references: [setor.id] }),
}));
