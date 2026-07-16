// ————————————————————————————————————————————————
// Domínio: Avaliação (o motor da pirâmide)
//
// Desenho genérico que serve os 4 níveis com a mesma mecânica:
//   nivel (Visão/Tático/Processos/Resultados, fixos)
//     └─ criterio  (as perguntas/itens avaliáveis de cada nível)
//   avaliacao  (uma rodada de diagnóstico de um setor, por um líder)
//     └─ resposta  (nota + status de cada critério naquela avaliação)
//
// Notas de RH/Sistemas/Estrutura/Processos/KPIs entram como `criterio`
// com um `grupo` que diz a que sub-bloco pertencem. Isso evita uma
// explosão de tabelas rígidas e deixa o modelo crescer.
// ————————————————————————————————————————————————
import { pgEnum, pgTable, text, uuid, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { empresa, setor, usuario } from "./organizacao";

/** Os 4 níveis da pirâmide (ordem = base→topo na régua de maturidade). */
export const nivelPiramide = pgEnum("nivel_piramide", [
  "visao", // N1 estratégico
  "tatico", // N2 recursos
  "processos", // N3 operacional
  "resultados", // N4 indicadores
]);

/** Status de cada resposta — dirige o preenchimento visual da pirâmide. */
export const statusResposta = pgEnum("status_resposta", [
  "nao_iniciada",
  "em_andamento",
  "revisada",
]);

/** Sub-blocos dentro de um nível (ex.: no Tático: rh/sistemico/estrutural). */
export const grupoCriterio = pgEnum("grupo_criterio", [
  "geral",
  "rh",
  "sistemico",
  "estrutural",
  "indicadores",
  "governanca",
  "monitoramento",
  "desempenho",
]);

/** Catálogo de critérios avaliáveis. É a "biblioteca de perguntas" —
 *  versionável e editável pelo admin sem tocar em código. */
export const criterio = pgTable("criterio", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  nivel: nivelPiramide("nivel").notNull(),
  grupo: grupoCriterio("grupo").notNull().default("geral"),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  // Peso relativo do critério no cálculo da nota do nível.
  peso: numeric("peso", { precision: 5, scale: 2 }).notNull().default("1"),
  ordem: integer("ordem").notNull().default(0),
  ...timestamps,
});

/** Uma rodada de diagnóstico de um setor. */
export const avaliacao = pgTable("avaliacao", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  // Quem respondeu (o líder).
  autorId: uuid("autor_id").references(() => usuario.id, {
    onDelete: "set null",
  }),
  titulo: text("titulo"),
  // Ferramentas habilitadas nesta análise (ids do catálogo em
  // domain/ferramentas-analise). null = escolha ainda não feita → todas
  // aparecem (compatibilidade com avaliações antigas); [] = nenhuma;
  // ["swot","raci",...] = análise parcial.
  ferramentasHabilitadas: jsonb("ferramentas_habilitadas").$type<string[] | null>(),
  ...timestamps,
});

/** A resposta a um critério dentro de uma avaliação. */
export const resposta = pgTable("resposta", {
  id: pk(),
  avaliacaoId: uuid("avaliacao_id")
    .notNull()
    .references(() => avaliacao.id, { onDelete: "cascade" }),
  criterioId: uuid("criterio_id")
    .notNull()
    .references(() => criterio.id, { onDelete: "cascade" }),
  // Nota 0–100 (normalizada; a UI pode coletar 0–5 e converter).
  nota: numeric("nota", { precision: 5, scale: 2 }),
  status: statusResposta("status").notNull().default("nao_iniciada"),
  observacao: text("observacao"),
  // Checks nomeados da etapa (ex.: {"politica_comercial": true}) — itens
  // obrigatórios que a etapa verifica. Extensível sem nova migração.
  checks: jsonb("checks").$type<Record<string, boolean> | null>(),
  ...timestamps,
});

// —————————————————— Relations ——————————————————
export const criterioRelations = relations(criterio, ({ one, many }) => ({
  empresa: one(empresa, { fields: [criterio.empresaId], references: [empresa.id] }),
  respostas: many(resposta),
}));

export const avaliacaoRelations = relations(avaliacao, ({ one, many }) => ({
  empresa: one(empresa, { fields: [avaliacao.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [avaliacao.setorId], references: [setor.id] }),
  autor: one(usuario, { fields: [avaliacao.autorId], references: [usuario.id] }),
  respostas: many(resposta),
}));

export const respostaRelations = relations(resposta, ({ one }) => ({
  avaliacao: one(avaliacao, {
    fields: [resposta.avaliacaoId],
    references: [avaliacao.id],
  }),
  criterio: one(criterio, {
    fields: [resposta.criterioId],
    references: [criterio.id],
  }),
}));
