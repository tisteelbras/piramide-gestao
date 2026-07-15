// Tipos puros do Checklist de Controles — Pilar 3 (Controles operacionais)
// da Governança Operacional. "Existe acompanhamento da execução?"
export type SituacaoControle = "nao_existe" | "parcial" | "existe";

export const SITUACOES_CONTROLE: { id: SituacaoControle; label: string; cor: string; peso: number }[] = [
  { id: "nao_existe", label: "Não existe", cor: "#c0392b", peso: 0 },
  { id: "parcial", label: "Parcial", cor: "#d98a00", peso: 50 },
  { id: "existe", label: "Existe", cor: "#33853a", peso: 100 },
];

export const PROXIMA_SITUACAO: Record<SituacaoControle, SituacaoControle> = {
  nao_existe: "parcial",
  parcial: "existe",
  existe: "nao_existe",
};

// Sugestões de controles comuns — atalho para popular o checklist.
export const CONTROLES_SUGERIDOS = [
  "Checklist de execução/fechamento",
  "Auditoria periódica",
  "Validação por segunda pessoa (dupla checagem)",
  "Revisão de qualidade antes da entrega",
  "Controle preventivo de erros",
];

export type ControleItem = {
  id: string;
  nome: string;
  situacao: SituacaoControle;
};

export type ControlesDoSetor = {
  itens: ControleItem[];
  // Cobertura 0–100: média dos pesos das situações. É a nota do pilar.
  cobertura: number;
  total: number;
};

const pesoDe = (s: SituacaoControle) => SITUACOES_CONTROLE.find((x) => x.id === s)?.peso ?? 0;

/** Cobertura do pilar: média dos pesos (existe=100, parcial=50, não=0).
 *  Puro — mostra o quanto a operação é acompanhada. */
export function coberturaControles(itens: ControleItem[]): number {
  if (!itens.length) return 0;
  return Math.round(itens.reduce((a, i) => a + pesoDe(i.situacao), 0) / itens.length);
}
