// ————————————————————————————————————————————————
// Regras puras de EVOLUÇÃO — dão ao diagnóstico o senso de jornada.
//
// O NEXO já fotografa a maturidade a cada fechamento de ciclo
// (ciclo_snapshot). Aqui comparamos a foto anterior com o estado atual e
// dizemos, por nível, o que melhorou, piorou ou ficou parado — e quantos
// pontos. É a diferença entre "está em 58%" e "caiu de 72% para 58%".
//
// Sem banco, sem React. Notas 0–100.
// ————————————————————————————————————————————————
export type Nivel = "visao" | "tatico" | "processos" | "resultados";

export type SentidoEvolucao = "subiu" | "caiu" | "estavel" | "novo";

// Abaixo deste delta (em pontos) tratamos como "estável" — ruído de
// arredondamento não é evolução.
const LIMIAR_ESTAVEL = 1;

export type EvolucaoNivel = {
  nivel: Nivel;
  antes: number | null; // null = não havia ciclo anterior
  agora: number;
  delta: number; // agora − antes (0 quando não há anterior)
  sentido: SentidoEvolucao;
};

export function comparaNivel(nivel: Nivel, antes: number | null, agora: number): EvolucaoNivel {
  if (antes == null) {
    return { nivel, antes: null, agora, delta: 0, sentido: "novo" };
  }
  const delta = Math.round((agora - antes) * 10) / 10;
  const sentido: SentidoEvolucao =
    Math.abs(delta) < LIMIAR_ESTAVEL ? "estavel" : delta > 0 ? "subiu" : "caiu";
  return { nivel, antes, agora, delta, sentido };
}

export type RetratoEvolucao = {
  temAnterior: boolean;
  dataAnterior: string | null; // ISO do fechamento comparado
  geralAntes: number | null;
  geralAgora: number;
  geralDelta: number;
  geralSentido: SentidoEvolucao;
  porNivel: EvolucaoNivel[];
};

type SnapshotNiveis = { geral: number } & Record<Nivel, number>;

const NIVEIS: Nivel[] = ["visao", "tatico", "processos", "resultados"];

/**
 * Compara o estado atual (geral + 4 níveis) com o snapshot anterior.
 * `anterior = null` produz um retrato "primeiro ciclo" (tudo é "novo") —
 * a UI mostra só o estado atual, sem setas.
 */
export function retratoEvolucao(
  atual: SnapshotNiveis,
  anterior: (SnapshotNiveis & { data: string }) | null,
): RetratoEvolucao {
  if (!anterior) {
    return {
      temAnterior: false,
      dataAnterior: null,
      geralAntes: null,
      geralAgora: atual.geral,
      geralDelta: 0,
      geralSentido: "novo",
      porNivel: NIVEIS.map((n) => comparaNivel(n, null, atual[n])),
    };
  }
  const geral = comparaNivel("visao", anterior.geral, atual.geral); // reusa a regra; nível é ignorado aqui
  return {
    temAnterior: true,
    dataAnterior: anterior.data,
    geralAntes: anterior.geral,
    geralAgora: atual.geral,
    geralDelta: geral.delta,
    geralSentido: geral.sentido,
    porNivel: NIVEIS.map((n) => comparaNivel(n, anterior[n], atual[n])),
  };
}

export const ROTULO_NIVEL: Record<Nivel, string> = {
  visao: "Visão",
  tatico: "Recursos",
  processos: "Processos",
  resultados: "Resultados",
};

export const COR_SENTIDO: Record<SentidoEvolucao, string> = {
  subiu: "#33853a",
  caiu: "#c0392b",
  estavel: "#8493a0",
  novo: "#0068a9",
};

export const SETA_SENTIDO: Record<SentidoEvolucao, string> = {
  subiu: "↑",
  caiu: "↓",
  estavel: "→",
  novo: "•",
};

/** Frase para uma recomendação que persiste entre ciclos: "avisado há N
 *  ciclos" é o cutucão que falta hoje — o diagnóstico esquecia o anterior. */
export function textoPersistencia(ciclosAberta: number): string | null {
  if (ciclosAberta <= 0) return null;
  if (ciclosAberta === 1) return "já apontado no ciclo anterior";
  return `apontado há ${ciclosAberta} ciclos — ainda sem resolução`;
}
