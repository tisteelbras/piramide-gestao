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

// Perspectiva do BSC — o Mapa Estratégico é outra visão dos mesmos objetivos.
export type PerspectivaBsc = "financeira" | "clientes" | "processos_internos" | "aprendizado";

export const PERSPECTIVAS_BSC: { id: PerspectivaBsc; nome: string; cor: string; pergunta: string }[] = [
  { id: "financeira", nome: "Financeira", cor: "#33853a", pergunta: "Para ter sucesso financeiro, o que entregar?" },
  { id: "clientes", nome: "Clientes", cor: "#0068a9", pergunta: "Para realizar a visão, como aparecer ao cliente?" },
  { id: "processos_internos", nome: "Processos Internos", cor: "#d98a00", pergunta: "Em que processos precisamos ser excelentes?" },
  { id: "aprendizado", nome: "Aprendizado e Crescimento", cor: "#6b3fa0", pergunta: "Como sustentar a capacidade de mudar e melhorar?" },
];

export type ObjetivoItem = {
  id: string;
  titulo: string;
  meta: string | null;
  prazo: string | null; // ISO "YYYY-MM-DD"
  status: StatusObjetivo;
  // Perspectiva do BSC; null = ainda não classificado no mapa.
  perspectiva: PerspectivaBsc | null;
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
