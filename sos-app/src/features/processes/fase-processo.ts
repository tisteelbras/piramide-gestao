// ————————————————————————————————————————————————
// Regra pura: em que FASE do ciclo de gestão um processo se encontra.
//
// O ciclo tem 5 fases (os mesmos 5 eixos que medem a maturidade):
// Padronização → Execução → Planejamento → Monitoramento → Melhoria Contínua.
//
// A fase "onde o processo está" é o GARGALO: o eixo de menor nota — a
// próxima fase a evoluir. Se todas as fases já estão altas, o processo está
// consolidado na Melhoria Contínua. Sem nenhuma nota, não há fase ("não
// avaliado"): o processo aparece à parte, com convite para avaliar.
//
// Sem banco, sem React — só a regra. Reusa a ordem canônica de EIXOS_PROCESSO.
// ————————————————————————————————————————————————
import { EIXOS_PROCESSO } from "./tipos";

export type IdFase = (typeof EIXOS_PROCESSO)[number]["id"];

/** As 5 fases na ordem do ciclo — fonte única para a régua e o desenho. */
export const FASES_CICLO = EIXOS_PROCESSO;

/**
 * Fase atual do processo a partir das notas dos 5 eixos.
 *  - retorna null quando NENHUM eixo tem nota (processo não avaliado);
 *  - se TODAS as fases já estão no teto (nada a evoluir), o processo está
 *    consolidado na última fase, Melhoria Contínua;
 *  - senão, a fase é o eixo de MENOR nota (o gargalo — a próxima a evoluir).
 *    Eixos ainda sem nota contam como 0 (fase não iniciada = gargalo
 *    urgente). Em empate, escolhe a fase mais ATRÁS no ciclo (é a que trava
 *    o avanço das seguintes).
 */
const TETO = 100;

export function faseDoProcesso(eixos: Record<string, number | null>): IdFase | null {
  const temAlgumaNota = FASES_CICLO.some((f) => eixos[f.id] != null);
  if (!temAlgumaNota) return null;

  // Processo maduro: nada abaixo do teto → consolidado na Melhoria Contínua.
  const tudoNoTeto = FASES_CICLO.every((f) => (eixos[f.id] ?? 0) >= TETO);
  if (tudoNoTeto) return FASES_CICLO[FASES_CICLO.length - 1].id;

  let faseGargalo: IdFase = FASES_CICLO[0].id;
  let menor = Infinity;
  for (const f of FASES_CICLO) {
    const nota = eixos[f.id] ?? 0; // fase sem nota = 0 = gargalo urgente
    if (nota < menor) {
      menor = nota;
      faseGargalo = f.id;
    }
  }
  return faseGargalo;
}

/** Rótulo legível de uma fase (ou "Não avaliado" quando null). */
export function rotuloFase(id: IdFase | null): string {
  if (id === null) return "Não avaliado";
  return FASES_CICLO.find((f) => f.id === id)?.label ?? id;
}
