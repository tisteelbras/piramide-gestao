// Tipos puros do Mapa de Processos — sem banco.
//
// Materializa o pilar "Padronização" da Governança Operacional:
// "existe uma forma oficial de executar o trabalho?".

export type EtapaFluxo = {
  id: string;
  ordem: number;
  titulo: string;
  descricao: string | null;
  responsavelId: string | null;
  responsavelNome: string | null;
  entrega: string | null;
};

export type ProcessoMapeado = {
  id: string;
  nome: string;
  tipo: string;
  etapas: EtapaFluxo[];
};

export type MapaDoSetor = {
  processos: ProcessoMapeado[];
  pessoas: { id: string; nome: string; cargo: string | null }[];
};

/** Grau de padronização de um processo, em 3 faixas. */
export type GrauPadronizacao = "nao_mapeado" | "parcial" | "documentado";

export const ROTULO_PADRONIZACAO: Record<GrauPadronizacao, string> = {
  nao_mapeado: "Não mapeado",
  parcial: "Mapeado parcialmente",
  documentado: "Documentado",
};

export const COR_PADRONIZACAO: Record<GrauPadronizacao, string> = {
  nao_mapeado: "#c0392b",
  parcial: "#d98a00",
  documentado: "#33853a",
};

/**
 * Classifica a padronização de um processo:
 *  - não mapeado: sem etapas;
 *  - documentado: toda etapa tem responsável E instrução (descrição);
 *  - parcial: tem etapas, mas falta responsável ou instrução em alguma.
 *
 * A régua reflete o pilar: um fluxo só é "forma oficial de trabalhar" se
 * diz o que fazer, como fazer e quem faz.
 */
export function grauPadronizacao(p: ProcessoMapeado): GrauPadronizacao {
  if (p.etapas.length === 0) return "nao_mapeado";
  const completas = p.etapas.every(
    (e) => e.responsavelId !== null && (e.descricao?.trim().length ?? 0) > 0,
  );
  return completas ? "documentado" : "parcial";
}

/** O que falta para o processo ser considerado documentado. */
export function lacunasDoProcesso(p: ProcessoMapeado): string[] {
  if (p.etapas.length === 0) return ["nenhuma etapa mapeada"];
  const semResp = p.etapas.filter((e) => !e.responsavelId).length;
  const semInstr = p.etapas.filter((e) => !(e.descricao?.trim().length ?? 0)).length;
  const l: string[] = [];
  if (semResp > 0) l.push(`${semResp} etapa(s) sem responsável`);
  if (semInstr > 0) l.push(`${semInstr} etapa(s) sem instrução de execução`);
  return l;
}

/** Percentual de padronização do setor — quantos processos documentados. */
export function padronizacaoDoSetor(processos: ProcessoMapeado[]): number {
  if (processos.length === 0) return 0;
  const documentados = processos.filter((p) => grauPadronizacao(p) === "documentado").length;
  return Math.round((documentados / processos.length) * 100);
}
