// Tipos puros do Fluxograma — sem banco, seguros para o cliente.
//
// O Fluxograma liga os PROCESSOS do setor em sequência (Proc A → Proc B →
// decisão → Proc C). Não confundir com o Mapa de Processos, que detalha o
// passo a passo DENTRO de um processo.

export type TipoNoFluxograma = "inicio" | "processo" | "decisao" | "fim";

export const ROTULO_TIPO_NO: Record<TipoNoFluxograma, string> = {
  inicio: "Início",
  processo: "Processo",
  decisao: "Decisão",
  fim: "Fim",
};

export type NoFluxo = {
  id: string;
  ordem: number;
  tipo: TipoNoFluxograma;
  // Quando tipo="processo": o processo referenciado.
  processoId: string | null;
  processoNome: string | null; // resolvido na query (null = processo apagado)
  // Rótulo livre (nome de início/fim, ou texto do nó).
  rotulo: string | null;
  // Só decisão:
  pergunta: string | null;
  destinoNaoId: string | null;
};

export type FluxogramaComNos = {
  id: string;
  nome: string;
  descricao: string | null;
  nos: NoFluxo[];
};

/** Processo disponível para virar nó do fluxograma. */
export type ProcessoDisponivel = { id: string; nome: string; tipo: string };

/** Texto exibido num nó, com fallback quando o processo foi apagado. */
export function textoDoNo(n: NoFluxo): string {
  if (n.tipo === "processo") return n.processoNome ?? "(processo removido)";
  if (n.tipo === "decisao") return n.pergunta?.trim() || "Decisão";
  return n.rotulo?.trim() || (n.tipo === "inicio" ? "Início" : "Fim");
}

/** Um fluxograma está "montado" quando tem ao menos um nó de processo. */
export function fluxogramaMontado(f: FluxogramaComNos): boolean {
  return f.nos.some((n) => n.tipo === "processo");
}
