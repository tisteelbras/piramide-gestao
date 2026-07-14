// Tipos puros do organograma — seguros para o cliente (sem banco).
//
// O organograma É a lista de colaboradores do setor: cada pessoa tem
// nome, função (cargo) e a quem responde (gestorId). Por isso a mesma
// lista alimenta o Recurso Humano, sem duplicar pessoas.

export type PessoaOrganograma = {
  id: string;
  nome: string;
  cargo: string | null;
  gestorId: string | null;
};

/** Nó da árvore montada a partir da lista plana. */
export type NoOrganograma = PessoaOrganograma & {
  subordinados: NoOrganograma[];
};

/**
 * Monta a árvore de hierarquia a partir da lista plana de pessoas.
 * Quem não tem gestor (ou aponta para alguém fora da lista) vira raiz.
 * Função PURA — usada na tela e na geração do PDF.
 */
export function montarArvore(pessoas: PessoaOrganograma[]): NoOrganograma[] {
  const nos = new Map<string, NoOrganograma>();
  for (const p of pessoas) nos.set(p.id, { ...p, subordinados: [] });

  const raizes: NoOrganograma[] = [];
  for (const p of pessoas) {
    const no = nos.get(p.id)!;
    const pai = p.gestorId ? nos.get(p.gestorId) : undefined;
    if (pai && pai.id !== no.id) pai.subordinados.push(no);
    else raizes.push(no);
  }

  // Ordena por nome em cada nível, para o desenho ser estável.
  const ordena = (lista: NoOrganograma[]) => {
    lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    for (const n of lista) ordena(n.subordinados);
  };
  ordena(raizes);
  return raizes;
}

/**
 * Impede ciclos: retorna true se `candidatoId` está na descendência de
 * `pessoaId` (ou é ela mesma) — nesse caso não pode virar seu gestor.
 */
export function criariaCiclo(
  pessoas: PessoaOrganograma[],
  pessoaId: string,
  candidatoGestorId: string,
): boolean {
  if (pessoaId === candidatoGestorId) return true;
  const porId = new Map(pessoas.map((p) => [p.id, p]));
  // Sobe a cadeia a partir do candidato: se chegar em pessoaId, há ciclo.
  let atual = porId.get(candidatoGestorId);
  const visitados = new Set<string>();
  while (atual?.gestorId) {
    if (visitados.has(atual.id)) break; // dado inconsistente: aborta
    visitados.add(atual.id);
    if (atual.gestorId === pessoaId) return true;
    atual = porId.get(atual.gestorId);
  }
  return false;
}
