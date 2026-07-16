// ————————————————————————————————————————————————
// Domínio: ferramentas que materializam etapas/pilares da VISÃO.
//
// A Visão do NEXO não é só um checklist textual: cada etapa pode ter uma
// ferramenta concreta que a "resolve" (organograma → Estrutura; RACI e Mapa
// → Governança pilares 1 e 2). Este arquivo adiciona três:
//   - objetivoEstrategico: os objetivos da etapa Direcionamento Estratégico,
//     com meta e prazo (deixam de ser texto livre e viram entidades).
//   - controleGovernanca: pilar 3 (Controles operacionais) — checklist de
//     controles (existe / parcial / não existe).
//   - sucessaoGovernanca: pilar 4 (Sustentabilidade) — quem domina cada
//     atividade crítica e o risco se sair (bus factor).
// Tudo aditivo; nada aqui altera as tabelas do diagnóstico.
// ————————————————————————————————————————————————
import { pgEnum, pgTable, text, uuid, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { empresa, setor } from "./organizacao";

// —————————————————— Direcionamento Estratégico ——————————————————
export const statusObjetivo = pgEnum("status_objetivo", [
  "a_definir",
  "em_andamento",
  "atingido",
]);

/** Perspectiva do Balanced Scorecard. O Mapa Estratégico (BSC) é OUTRA
 *  visão dos MESMOS objetivos estratégicos: cada objetivo pode ser
 *  classificado numa perspectiva e aparece no mapa. null = ainda não
 *  classificado (aparece como "a classificar" no mapa). */
export const perspectivaBsc = pgEnum("perspectiva_bsc", [
  "financeira",
  "clientes",
  "processos_internos",
  "aprendizado",
]);

export const objetivoEstrategico = pgTable("objetivo_estrategico", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  meta: text("meta"), // meta em texto ("+40%", "<5%", "1 filial")
  prazo: date("prazo"),
  status: statusObjetivo("status").notNull().default("a_definir"),
  // Perspectiva do BSC — o mesmo objetivo aparece no Mapa Estratégico.
  perspectiva: perspectivaBsc("perspectiva"),
  ...timestamps,
});

// —————————————————— SWOT (Direcionamento Estratégico) ——————————————————
export const quadranteSwot = pgEnum("quadrante_swot", [
  "forca",
  "fraqueza",
  "oportunidade",
  "ameaca",
]);

export const itemSwot = pgTable("item_swot", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  quadrante: quadranteSwot("quadrante").notNull(),
  descricao: text("descricao").notNull(),
  ...timestamps,
});

// —————————————————— Governança · Pilar 3 (Controles) ——————————————————
export const situacaoControle = pgEnum("situacao_controle", [
  "nao_existe",
  "parcial",
  "existe",
]);

export const controleGovernanca = pgTable("controle_governanca", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(), // "Checklist de fechamento", "Auditoria mensal"…
  situacao: situacaoControle("situacao").notNull().default("nao_existe"),
  ...timestamps,
});

// —————————————————— Governança · Pilar 4 (Sustentabilidade) ——————————————————
// Risco de continuidade (bus factor) de uma atividade crítica: quantas
// pessoas a dominam. "só uma pessoa" = risco alto; "ninguém" = lacuna.
export const riscoSucessao = pgEnum("risco_sucessao", [
  "sem_dominio", // ninguém domina — lacuna
  "critico", // só uma pessoa sabe — bus factor 1
  "ok", // duas ou mais pessoas
]);

export const sucessaoGovernanca = pgTable("sucessao_governanca", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  atividade: text("atividade").notNull(), // "Fechamento fiscal", "Atendimento chave X"
  quemDomina: text("quem_domina"), // nomes livres ("João", "Maria e Ana")
  risco: riscoSucessao("risco").notNull().default("sem_dominio"),
  ...timestamps,
});

// —————————————————— Relations ——————————————————
export const objetivoEstrategicoRelations = relations(objetivoEstrategico, ({ one }) => ({
  empresa: one(empresa, { fields: [objetivoEstrategico.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [objetivoEstrategico.setorId], references: [setor.id] }),
}));

export const controleGovernancaRelations = relations(controleGovernanca, ({ one }) => ({
  empresa: one(empresa, { fields: [controleGovernanca.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [controleGovernanca.setorId], references: [setor.id] }),
}));

export const sucessaoGovernancaRelations = relations(sucessaoGovernanca, ({ one }) => ({
  empresa: one(empresa, { fields: [sucessaoGovernanca.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [sucessaoGovernanca.setorId], references: [setor.id] }),
}));

export const itemSwotRelations = relations(itemSwot, ({ one }) => ({
  empresa: one(empresa, { fields: [itemSwot.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [itemSwot.setorId], references: [setor.id] }),
}));
