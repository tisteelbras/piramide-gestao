// Consolida os critérios respondidos em resultados por nível + geral,
// usando o motor puro de domain/maturidade.
import { consolidaNivel, maturidadeGeral, type ResultadoNivel } from "@/domain/maturidade";
import { NIVEIS, type CriterioAvaliado, type Nivel } from "./tipos";

export type ResumoNivel = ResultadoNivel & { nivel: Nivel };

export function consolidarPorNivel(criterios: CriterioAvaliado[]): {
  porNivel: Record<Nivel, ResumoNivel>;
  geral: number;
} {
  const porNivel = {} as Record<Nivel, ResumoNivel>;
  for (const { id } of NIVEIS) {
    const itens = criterios
      .filter((c) => c.nivel === id)
      .map((c) => ({ nota: c.nota, peso: c.peso }));
    porNivel[id] = { nivel: id, ...consolidaNivel(itens) };
  }
  const geral = maturidadeGeral(NIVEIS.map((n) => porNivel[n.id]));
  return { porNivel, geral };
}
