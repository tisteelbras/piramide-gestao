// Tipos puros dos Objetivos Estratégicos — sem banco.
//
// Materializa a etapa "Direcionamento Estratégico" da Visão: os objetivos
// deixam de ser texto livre e viram entidades com meta, prazo e status —
// o "para onde vamos" que a Gestão por Objetivos (N4) vai executar.
export type StatusObjetivo = "a_definir" | "em_andamento" | "atingido";

export const STATUS_OBJETIVO: { id: StatusObjetivo; label: string; cor: string }[] = [
  { id: "a_definir", label: "A definir", cor: "#8493a0" },
  { id: "em_andamento", label: "Em andamento", cor: "#0068a9" },
  { id: "atingido", label: "Atingido", cor: "#33853a" },
];

export const PROXIMO_STATUS_OBJETIVO: Record<StatusObjetivo, StatusObjetivo> = {
  a_definir: "em_andamento",
  em_andamento: "atingido",
  atingido: "a_definir",
};

export type ObjetivoItem = {
  id: string;
  titulo: string;
  meta: string | null;
  prazo: string | null; // ISO "YYYY-MM-DD"
  status: StatusObjetivo;
};

export type ObjetivosDoSetor = {
  objetivos: ObjetivoItem[];
  // Um objetivo "completo" tem meta e prazo definidos — sem isso é só
  // intenção. É o que a etapa da Visão precisa para se dizer estruturada.
  completos: number;
  total: number;
};

/** Um objetivo está bem-formado quando tem meta E prazo. Puro, para o
 *  painel apontar o que ainda é vago. */
export function objetivoCompleto(o: ObjetivoItem): boolean {
  return !!o.meta?.trim() && !!o.prazo;
}
