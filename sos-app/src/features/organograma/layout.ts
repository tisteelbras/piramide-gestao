// Layout do organograma: converte a árvore em posições x/y, para desenhar
// caixas conectadas por linhas (e não uma lista indentada).
//
// Algoritmo clássico de árvore: as FOLHAS são distribuídas lado a lado, e
// cada pai é centralizado sobre seus filhos. Isso produz a forma familiar
// de organograma, com cada nível numa faixa horizontal.

import type { NoOrganograma } from "./tipos";

export type CaixaPosicionada = {
  id: string;
  nome: string;
  cargo: string | null;
  nivel: number;
  x: number; // canto esquerdo
  y: number; // topo
  cx: number; // centro horizontal (para as linhas)
};

export type Ligacao = {
  de: { x: number; y: number }; // base do pai
  para: { x: number; y: number }; // topo do filho
};

export type LayoutOrganograma = {
  caixas: CaixaPosicionada[];
  ligacoes: Ligacao[];
  largura: number;
  altura: number;
};

export const CAIXA_L = 168; // largura da caixa
export const CAIXA_A = 74; // altura da caixa
const GAP_X = 22; // espaço entre irmãos
const GAP_Y = 54; // espaço vertical entre níveis

/**
 * Calcula posições para uma floresta (pode haver mais de uma raiz).
 * Percorre em pós-ordem: primeiro posiciona os filhos, depois centraliza
 * o pai sobre eles. Folhas ocupam colunas sequenciais.
 */
export function calcularLayout(raizes: NoOrganograma[]): LayoutOrganograma {
  const caixas: CaixaPosicionada[] = [];
  const ligacoes: Ligacao[] = [];
  let cursorX = 0; // próxima coluna livre para uma folha

  const posiciona = (no: NoOrganograma, nivel: number): CaixaPosicionada => {
    const y = nivel * (CAIXA_A + GAP_Y);

    if (no.subordinados.length === 0) {
      // Folha: ocupa a próxima coluna e avança o cursor.
      const x = cursorX;
      cursorX += CAIXA_L + GAP_X;
      const caixa: CaixaPosicionada = {
        id: no.id, nome: no.nome, cargo: no.cargo, nivel,
        x, y, cx: x + CAIXA_L / 2,
      };
      caixas.push(caixa);
      return caixa;
    }

    // Nó com filhos: posiciona os filhos primeiro…
    const filhos = no.subordinados.map((f) => posiciona(f, nivel + 1));
    // …e centraliza o pai sobre o primeiro e o último filho.
    const cx = (filhos[0].cx + filhos[filhos.length - 1].cx) / 2;
    const x = cx - CAIXA_L / 2;

    const caixa: CaixaPosicionada = {
      id: no.id, nome: no.nome, cargo: no.cargo, nivel,
      x, y, cx,
    };
    caixas.push(caixa);

    for (const f of filhos) {
      ligacoes.push({
        de: { x: caixa.cx, y: caixa.y + CAIXA_A },
        para: { x: f.cx, y: f.y },
      });
    }
    return caixa;
  };

  for (const raiz of raizes) {
    posiciona(raiz, 0);
    cursorX += GAP_X * 2; // respiro entre árvores independentes
  }

  // Normaliza: se o pai ficou à esquerda de zero (não ocorre aqui, mas
  // protege), desloca tudo para dentro do quadro.
  const minX = caixas.length ? Math.min(...caixas.map((c) => c.x)) : 0;
  if (minX < 0) {
    for (const c of caixas) { c.x -= minX; c.cx -= minX; }
    for (const l of ligacoes) { l.de.x -= minX; l.para.x -= minX; }
  }

  const largura = caixas.length
    ? Math.max(...caixas.map((c) => c.x + CAIXA_L))
    : 0;
  const altura = caixas.length
    ? Math.max(...caixas.map((c) => c.y + CAIXA_A))
    : 0;

  return { caixas, ligacoes, largura, altura };
}

/** Iniciais do nome, para o avatar (o sistema não tem foto). */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
