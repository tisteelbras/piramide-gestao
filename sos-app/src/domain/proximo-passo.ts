// ————————————————————————————————————————————————
// "Qual o próximo passo?" — regra determinística que aponta a maior
// lacuna de maturidade de um setor a partir do preenchimento por nível.
//
// Função PURA: recebe o preenchimento (0–100 por nível), devolve o nível
// mais fraco (a lacuna) ou null se está tudo completo. Reaproveitada na
// pirâmide, no banner do setor e no dashboard.
// ————————————————————————————————————————————————

import type { Nivel } from "@/features/assessments/tipos";
import { NIVEIS } from "@/features/assessments/tipos";

export type Lacuna = {
  nivel: Nivel;
  titulo: string;
  cor: string;
  corDark: string;
  preenchido: number; // 0–100 concluído
  faltando: number; // 0–100 a preencher
};

// Considera "completo" a partir deste limiar (evita apontar 99% como lacuna).
const LIMIAR_COMPLETO = 100;

/**
 * Retorna a maior lacuna (nível menos preenchido) ou null se todos os
 * níveis estão completos. Empate: respeita a ordem estratégica dos
 * NIVEIS (Visão vem antes de Resultado), priorizando a base do modelo.
 */
export function maiorLacuna(porNivel: Record<Nivel, number>): Lacuna | null {
  let alvo: Lacuna | null = null;
  for (const meta of NIVEIS) {
    const preenchido = Math.round(porNivel[meta.id] ?? 0);
    if (preenchido >= LIMIAR_COMPLETO) continue;
    if (alvo === null || preenchido < alvo.preenchido) {
      alvo = {
        nivel: meta.id,
        titulo: meta.titulo,
        cor: meta.cor,
        corDark: meta.corDark,
        preenchido,
        faltando: 100 - preenchido,
      };
    }
  }
  return alvo;
}
