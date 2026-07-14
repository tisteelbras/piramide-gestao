// Tipos puros da Matriz de Responsabilidade (RACI) — sem banco.
//
// Materializa o pilar "Responsabilidades" da Governança Operacional:
// para cada atividade (processo do setor), quem executa, quem aprova,
// quem é consultado e quem é informado.

export type PapelRaci = "responsavel" | "aprovador" | "consultado" | "informado";

export const PAPEIS_RACI: {
  id: PapelRaci;
  sigla: string;
  label: string;
  descricao: string;
  cor: string;
}[] = [
  {
    id: "responsavel",
    sigla: "R",
    label: "Responsável",
    descricao: "Executa a atividade. Pode haver mais de um.",
    cor: "#0068a9",
  },
  {
    id: "aprovador",
    sigla: "A",
    label: "Aprovador",
    descricao: "Responde pela atividade e aprova o resultado. Deve haver exatamente um.",
    cor: "#47ad4b",
  },
  {
    id: "consultado",
    sigla: "C",
    label: "Consultado",
    descricao: "É ouvido antes da decisão (comunicação em duas vias).",
    cor: "#d98a00",
  },
  {
    id: "informado",
    sigla: "I",
    label: "Informado",
    descricao: "Recebe o resultado (comunicação em uma via).",
    cor: "#8493a0",
  },
];

export const PAPEL_POR_ID = new Map(PAPEIS_RACI.map((p) => [p.id, p]));

export type Atribuicao = {
  processoId: string;
  colaboradorId: string;
  papel: PapelRaci;
};

export type AtividadeRaci = {
  id: string; // = processo.id
  nome: string;
  tipo: string;
};

export type PessoaRaci = {
  id: string; // = colaborador.id
  nome: string;
  cargo: string | null;
};

export type MatrizRaci = {
  atividades: AtividadeRaci[];
  pessoas: PessoaRaci[];
  atribuicoes: Atribuicao[];
};

/** Problemas de uma atividade, segundo as regras clássicas do RACI. */
export type ProblemaRaci = {
  processoId: string;
  atividade: string;
  tipo: "sem_aprovador" | "varios_aprovadores" | "sem_responsavel";
  texto: string;
};

/**
 * Valida a matriz. Regras do RACI:
 *  - toda atividade deve ter EXATAMENTE UM aprovador (A);
 *  - toda atividade deve ter AO MENOS UM responsável (R).
 * Função pura — o painel usa para apontar as lacunas de governança.
 */
export function validarRaci(matriz: MatrizRaci): ProblemaRaci[] {
  const problemas: ProblemaRaci[] = [];

  for (const at of matriz.atividades) {
    const daAtividade = matriz.atribuicoes.filter((a) => a.processoId === at.id);
    const aprovadores = daAtividade.filter((a) => a.papel === "aprovador").length;
    const responsaveis = daAtividade.filter((a) => a.papel === "responsavel").length;

    if (aprovadores === 0) {
      problemas.push({
        processoId: at.id,
        atividade: at.nome,
        tipo: "sem_aprovador",
        texto: "sem aprovador (A) — ninguém responde por esta atividade",
      });
    } else if (aprovadores > 1) {
      problemas.push({
        processoId: at.id,
        atividade: at.nome,
        tipo: "varios_aprovadores",
        texto: `${aprovadores} aprovadores (A) — a responsabilidade final deve ser de uma só pessoa`,
      });
    }

    if (responsaveis === 0) {
      problemas.push({
        processoId: at.id,
        atividade: at.nome,
        tipo: "sem_responsavel",
        texto: "sem responsável (R) — ninguém executa esta atividade",
      });
    }
  }

  return problemas;
}
