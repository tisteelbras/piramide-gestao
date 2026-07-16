// Tipos puros da Análise SWOT — sem banco.
// Materializa parte do Direcionamento Estratégico: onde a área é forte e
// fraca (interno), e o que o ambiente oferece e ameaça (externo).
export type QuadranteSwot = "forca" | "fraqueza" | "oportunidade" | "ameaca";

export const QUADRANTES_SWOT: {
  id: QuadranteSwot;
  nome: string;
  ambito: "interno" | "externo";
  cor: string;
  dica: string;
}[] = [
  { id: "forca", nome: "Forças", ambito: "interno", cor: "#33853a",
    dica: "O que a área faz bem — vantagens internas." },
  { id: "fraqueza", nome: "Fraquezas", ambito: "interno", cor: "#c0392b",
    dica: "O que limita a área — carências internas." },
  { id: "oportunidade", nome: "Oportunidades", ambito: "externo", cor: "#0068a9",
    dica: "O que o ambiente oferece a favor." },
  { id: "ameaca", nome: "Ameaças", ambito: "externo", cor: "#d98a00",
    dica: "O que o ambiente traz de risco." },
];

export type ItemSwot = {
  id: string;
  quadrante: QuadranteSwot;
  descricao: string;
};

export type SwotDoSetor = {
  itens: ItemSwot[];
};
