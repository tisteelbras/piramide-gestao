// ————————————————————————————————————————————————
// Domínio: Fluxograma (fluxo ENTRE os processos do setor)
//
// Diferente do Mapa de Processos (que detalha o passo a passo DENTRO de um
// processo), o Fluxograma liga os PROCESSOS do setor uns aos outros: como o
// trabalho encadeia — Processo A → Processo B → (decisão) → Processo C.
//
// Cada setor pode ter VÁRIOS fluxogramas nomeados (ex.: "Fluxo de venda",
// "Fluxo de pós-venda"). Cada nó do fluxograma é UM processo já cadastrado
// (referência real, não texto solto) ou um nó de controle (início/fim/decisão).
// ————————————————————————————————————————————————
import { pgEnum, pgTable, text, uuid, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pk, timestamps } from "./_shared";
import { empresa, setor } from "./organizacao";
import { processo } from "./processos";

/** Tipo do nó no fluxograma:
 *  - inicio / fim: os limites do fluxo (cápsulas);
 *  - processo: uma caixa que É um processo cadastrado (processoId aponta p/ ele);
 *  - decisao: um losango com uma pergunta; "Sim" segue a sequência, "Não"
 *    desvia para outro nó (destinoNaoId). */
export const tipoNoFluxograma = pgEnum("tipo_no_fluxograma", [
  "inicio",
  "processo",
  "decisao",
  "fim",
]);

/** Um fluxograma do setor. */
export const fluxograma = pgTable("fluxograma", {
  id: pk(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresa.id, { onDelete: "cascade" }),
  setorId: uuid("setor_id")
    .notNull()
    .references(() => setor.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  ...timestamps,
});

/** Um nó do fluxograma, na ordem da sequência. */
export const noFluxograma = pgTable("no_fluxograma", {
  id: pk(),
  fluxogramaId: uuid("fluxograma_id")
    .notNull()
    .references(() => fluxograma.id, { onDelete: "cascade" }),
  // Posição na sequência (0, 1, 2…). O caminho "Sim"/padrão é o próximo nó.
  ordem: integer("ordem").notNull().default(0),
  tipo: tipoNoFluxograma("tipo").notNull().default("processo"),
  // Quando tipo="processo": o processo real que este nó representa. Se o
  // processo for apagado, o nó perde a referência (mas não some sozinho —
  // o gestor decide o que fazer com o buraco).
  processoId: uuid("processo_id").references(() => processo.id, { onDelete: "set null" }),
  // Rótulo livre: nome do início/fim, ou o texto do nó quando não é processo.
  rotulo: text("rotulo"),
  // Só para decisão: a pergunta (ex.: "Cliente aprovou?").
  pergunta: text("pergunta"),
  // Só para decisão: o nó de destino do caminho "Não" (o desvio). "Sim"
  // segue a sequência natural. null = "Não" leva ao Fim.
  destinoNaoId: uuid("destino_nao_id"),
  ...timestamps,
});

// —————————————————— Relations ——————————————————
export const fluxogramaRelations = relations(fluxograma, ({ one, many }) => ({
  empresa: one(empresa, { fields: [fluxograma.empresaId], references: [empresa.id] }),
  setor: one(setor, { fields: [fluxograma.setorId], references: [setor.id] }),
  nos: many(noFluxograma),
}));

export const noFluxogramaRelations = relations(noFluxograma, ({ one }) => ({
  fluxograma: one(fluxograma, {
    fields: [noFluxograma.fluxogramaId],
    references: [fluxograma.id],
  }),
  processo: one(processo, {
    fields: [noFluxograma.processoId],
    references: [processo.id],
  }),
}));
