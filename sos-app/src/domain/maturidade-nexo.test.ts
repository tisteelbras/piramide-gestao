// Testes do cálculo de maturidade NEXO — o número que o cliente vê.
// As regras aqui são deliberadamente ASSIMÉTRICAS (às vezes "sem dado" é
// ignorado, às vezes vale zero); cada teste fixa qual vale onde, para que
// uma refatoração futura não uniformize por engano.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculaMaturidade, media, type EntradaMaturidade } from "./maturidade-nexo";

const TIPOS = [
  { id: "kpi", resultado: "Resultado de KPI" },
  { id: "governanca", resultado: "Resultado de Governança" },
];

/** Setor vazio: nada cadastrado, nada avaliado. */
const vazio: EntradaMaturidade = {
  itensVisao: [],
  colaboradores: [],
  sistemas: [],
  ativos: [],
  processos: [],
  tiposComResultado: TIPOS,
};

const entrada = (patch: Partial<EntradaMaturidade>): EntradaMaturidade => ({ ...vazio, ...patch });

describe("media", () => {
  test("lista vazia é null, não zero", () => {
    // A distinção que sustenta o resto do motor: null = "não medido",
    // zero = "medido e ruim". Confundir os dois falsifica o diagnóstico.
    assert.equal(media([]), null);
    assert.equal(media([0]), 0);
  });

  test("arredonda para uma casa", () => {
    assert.equal(media([100, 0, 0]), 33.3);
  });
});

describe("nível VISÃO (checklist binário)", () => {
  test("conta só as etapas revisadas", () => {
    const r = calculaMaturidade(
      entrada({
        itensVisao: [
          { id: "a", status: "revisada", respondido: true },
          { id: "b", status: "em_andamento", respondido: true },
          { id: "c", status: "nao_iniciada", respondido: true },
          { id: "d", status: null, respondido: false },
        ],
      }),
    );
    assert.equal(r.porNivel.visao, 25, "1 revisada de 4 = 25%");
    assert.deepEqual(r.detalhe.visao, { revisadas: 1, total: 4 });
  });

  // "em_andamento" não vale meia etapa — o checklist é binário de propósito.
  test("em_andamento não pontua", () => {
    const r = calculaMaturidade(
      entrada({ itensVisao: [{ id: "a", status: "em_andamento", respondido: true }] }),
    );
    assert.equal(r.porNivel.visao, 0);
  });

  test("sem critérios cadastrados é 0, não divisão por zero", () => {
    assert.equal(calculaMaturidade(vazio).porNivel.visao, 0);
  });
});

describe("nível RECURSOS (3 grupos)", () => {
  test("é a média dos grupos que têm dados", () => {
    const r = calculaMaturidade(
      entrada({
        colaboradores: [{ id: "c1", notas: [100, 100] }],
        sistemas: [{ nota: 50, ehNecessidade: false }],
        ativos: [{ nota: 0 }],
      }),
    );
    assert.equal(r.detalhe.tatico.rh, 100);
    assert.equal(r.detalhe.tatico.sistemico, 50);
    assert.equal(r.detalhe.tatico.estrutural, 0);
    assert.equal(r.porNivel.tatico, 50, "(100+50+0)/3");
  });

  // Grupo sem dado nenhum sai da conta em vez de entrar como zero — senão
  // um setor que ainda não cadastrou ativos seria punido por isso.
  test("grupo sem dados não entra na média como zero", () => {
    const r = calculaMaturidade(entrada({ colaboradores: [{ id: "c1", notas: [80] }] }));
    assert.equal(r.detalhe.tatico.estrutural, null);
    assert.equal(r.porNivel.tatico, 80, "só o grupo com dado conta");
  });

  // Regra de negócio explícita: marcar um sistema como "necessidade" é
  // declarar uma falta. Isso vira recomendação, e não pode derrubar a nota.
  test("sistema marcado como necessidade fica fora da média", () => {
    const r = calculaMaturidade(
      entrada({
        sistemas: [
          { nota: 100, ehNecessidade: false },
          { nota: 0, ehNecessidade: true },
        ],
      }),
    );
    assert.equal(r.detalhe.tatico.sistemico, 100, "a necessidade não puxa a nota para baixo");
  });

  test("colaborador sem nenhuma nota não entra na média do time", () => {
    const r = calculaMaturidade(
      entrada({
        colaboradores: [
          { id: "c1", notas: [60] },
          { id: "c2", notas: [] },
        ],
      }),
    );
    assert.equal(r.detalhe.tatico.rh, 60);
  });
});

describe("nível PROCESSOS", () => {
  test("é a média das médias de cada processo", () => {
    const r = calculaMaturidade(
      entrada({
        processos: [
          { id: "p1", nome: "Compras", tipo: "outro", notas: [100, 80] },
          { id: "p2", nome: "Vendas", tipo: "outro", notas: [60] },
        ],
      }),
    );
    assert.equal(r.porNivel.processos, 75, "(90+60)/2");
  });

  // Aqui "sem nota" é ignorado (≠ do nível RESULTADOS, logo abaixo).
  test("processo sem nota é ignorado na média, mas vira pendência", () => {
    const r = calculaMaturidade(
      entrada({
        processos: [
          { id: "p1", nome: "Compras", tipo: "outro", notas: [80] },
          { id: "p2", nome: "Vendas", tipo: "outro", notas: [] },
        ],
      }),
    );
    assert.equal(r.porNivel.processos, 80);
    assert.equal(r.detalhe.processos.porProcesso.find((p) => p.nome === "Vendas")?.media, null);
  });
});

describe("nível RESULTADOS (processo tipado)", () => {
  test("um tópico por tipo com resultado", () => {
    const r = calculaMaturidade(
      entrada({ processos: [{ id: "p1", nome: "OTIF", tipo: "kpi", notas: [80] }] }),
    );
    assert.equal(r.detalhe.resultados.itens.length, 2, "um por tipo, mesmo sem processo");
    const kpi = r.detalhe.resultados.itens.find((i) => i.titulo === "Resultado de KPI");
    assert.equal(kpi?.nota, 80);
  });

  // A assimetria mais importante do motor: aqui, ao contrário de PROCESSOS,
  // processo tipado sem nota vale ZERO. Existir sem ser executado tem que
  // derrubar o resultado — é o que provoca o preenchimento.
  test("processo tipado SEM nota vale zero (≠ nível Processos)", () => {
    const r = calculaMaturidade(
      entrada({
        processos: [
          { id: "p1", nome: "OTIF", tipo: "kpi", notas: [100] },
          { id: "p2", nome: "Giro", tipo: "kpi", notas: [] },
        ],
      }),
    );
    const kpi = r.detalhe.resultados.itens.find((i) => i.titulo === "Resultado de KPI");
    assert.equal(kpi?.nota, 50, "(100 + 0)/2 — o não executado pesa");
    assert.equal(r.porNivel.processos, 100, "no nível Processos, o mesmo dado é ignorado");
  });

  test("tipo sem nenhum processo fica null e não entra na média do nível", () => {
    const r = calculaMaturidade(
      entrada({ processos: [{ id: "p1", nome: "OTIF", tipo: "kpi", notas: [60] }] }),
    );
    const gov = r.detalhe.resultados.itens.find((i) => i.titulo === "Resultado de Governança");
    assert.equal(gov?.nota, null);
    assert.equal(r.porNivel.resultados, 60, "só o tipo com processo conta");
  });

  // Processo "outro" não tem resultado no catálogo: conta em Processos e
  // some em Resultados.
  test('processo tipo "outro" não aparece em Resultados', () => {
    const r = calculaMaturidade(
      entrada({ processos: [{ id: "p1", nome: "Diversos", tipo: "outro", notas: [100] }] }),
    );
    assert.equal(r.porNivel.processos, 100);
    assert.equal(r.porNivel.resultados, 0, "nenhum tipo com resultado foi alimentado");
  });
});

describe("geral e pendências", () => {
  test("geral é a média dos 4 níveis", () => {
    const r = calculaMaturidade(
      entrada({
        itensVisao: [{ id: "a", status: "revisada", respondido: true }], // 100
        ativos: [{ nota: 50 }], // tatico 50
        processos: [{ id: "p1", nome: "OTIF", tipo: "kpi", notas: [10] }], // proc 10 / result 10
      }),
    );
    assert.equal(r.porNivel.visao, 100);
    assert.equal(r.geral, 42.5, "(100+50+10+10)/4");
  });

  test("setor vazio é tudo zero, sem quebrar", () => {
    const r = calculaMaturidade(vazio);
    assert.deepEqual(r.porNivel, { visao: 0, tatico: 0, processos: 0, resultados: 0 });
    assert.equal(r.geral, 0);
  });

  test("pendências somam o que ainda não foi tocado", () => {
    const r = calculaMaturidade(
      entrada({
        itensVisao: [
          { id: "a", status: "revisada", respondido: true },
          { id: "b", status: null, respondido: false }, // +1
        ],
        colaboradores: [{ id: "c1", notas: [] }], // +1
        sistemas: [{ nota: null, ehNecessidade: false }], // +1
        ativos: [{ nota: null }], // +1
        processos: [{ id: "p1", nome: "Compras", tipo: "outro", notas: [] }], // +1
      }),
    );
    // +2: nenhum dos dois tipos com resultado tem processo.
    assert.equal(r.pendencias, 7);
  });

  // Necessidade é uma falta declarada, não um campo esquecido.
  test("sistema marcado como necessidade não conta como pendência", () => {
    const r = calculaMaturidade(entrada({ sistemas: [{ nota: null, ehNecessidade: true }] }));
    assert.equal(r.pendencias, 2, "só as 2 dos tipos sem processo");
  });
});
