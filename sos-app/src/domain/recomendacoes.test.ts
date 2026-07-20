// Testes do motor de recomendações por regra.
// O que importa aqui não é o texto, é QUAIS regras disparam e com que
// PRIORIDADE — é isso que define a ordem do que o cliente faz primeiro.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { gerarRecomendacoes, type RetratoSetor } from "./recomendacoes";

/** Setor saudável: nenhuma regra deve disparar. Cada teste estressa um
 *  campo por vez a partir daqui, para isolar a regra sob teste. */
const setorSaudavel: RetratoSetor = {
  maturidadePorNivel: { visao: 80, tatico: 80, processos: 80, resultados: 80 },
  sistemasFaltantes: [],
  kpisAusentes: [],
  kpisSemProcessoAvaliado: [],
  kpisProcessoFraco: [],
  processosFracos: [],
  colaboradoresBaixaMedia: [],
};

const retrato = (patch: Partial<RetratoSetor>): RetratoSetor => ({ ...setorSaudavel, ...patch });

describe("gerarRecomendacoes", () => {
  test("setor saudável não gera recomendação", () => {
    assert.deepEqual(gerarRecomendacoes(setorSaudavel), []);
  });

  test("devolve as recomendações ordenadas por prioridade", () => {
    const recs = gerarRecomendacoes(
      retrato({
        colaboradoresBaixaMedia: ["Ana"], // prioridade 2
        sistemasFaltantes: ["ERP"], // prioridade 1
        processosFracos: [{ nome: "Compras", media: 30 }], // prioridade 3
      }),
    );
    const prioridades = recs.map((r) => r.prioridade);
    assert.deepEqual(prioridades, [...prioridades].sort((a, b) => a - b), "deve sair ordenado");
    assert.equal(prioridades[0], 1, "o mais urgente vem primeiro");
  });
});

describe("regra da Política Comercial", () => {
  // É a única obrigatória do sistema — quando falta, é sempre prioridade 1.
  test("dispara com prioridade máxima quando não confirmada", () => {
    const recs = gerarRecomendacoes(retrato({ politicaComercialFaltante: true }));
    assert.equal(recs.length, 1);
    assert.equal(recs[0].prioridade, 1);
    assert.match(recs[0].titulo, /Política Comercial/);
  });

  test("não dispara quando o campo está ausente ou false", () => {
    assert.equal(gerarRecomendacoes(retrato({ politicaComercialFaltante: false })).length, 0);
    assert.equal(gerarRecomendacoes(setorSaudavel).length, 0);
  });
});

describe("regras de KPI", () => {
  test("KPI ausente aponta para o sistema quando há sistema faltante", () => {
    const semSistema = gerarRecomendacoes(retrato({ kpisAusentes: ["Giro"] }));
    const comSistema = gerarRecomendacoes(
      retrato({ kpisAusentes: ["Giro"], sistemasFaltantes: ["WMS"] }),
    );
    const kpiSem = semSistema.find((r) => r.titulo.includes("Giro"))!;
    const kpiCom = comSistema.find((r) => r.titulo.includes("Giro"))!;
    assert.match(kpiCom.detalhe, /fonte de dados/, "cruza o KPI com o sistema que o alimenta");
    assert.doesNotMatch(kpiSem.detalhe, /fonte de dados/);
  });

  test("KPI sem processo avaliado vira pedido de avaliação", () => {
    const recs = gerarRecomendacoes(retrato({ kpisSemProcessoAvaliado: ["OTIF"] }));
    assert.equal(recs.length, 1);
    assert.equal(recs[0].prioridade, 2);
    assert.match(recs[0].titulo, /Avaliar a execução/);
  });

  // Escalonamento: execução muito fraca (<25) sobe de prioridade 2 para 1.
  test("execução de KPI muito fraca escala para prioridade 1", () => {
    const fraco = gerarRecomendacoes(retrato({ kpisProcessoFraco: [{ nome: "OTIF", media: 24 }] }));
    const moderado = gerarRecomendacoes(retrato({ kpisProcessoFraco: [{ nome: "OTIF", media: 25 }] }));
    assert.equal(fraco[0].prioridade, 1, "abaixo de 25 é urgente");
    assert.equal(moderado[0].prioridade, 2, "25 já não escala");
  });
});

describe("regra de maturidade por nível", () => {
  test("só dispara abaixo de 40", () => {
    const noLimite = gerarRecomendacoes(
      retrato({ maturidadePorNivel: { visao: 40, tatico: 80, processos: 80, resultados: 80 } }),
    );
    const abaixo = gerarRecomendacoes(
      retrato({ maturidadePorNivel: { visao: 39, tatico: 80, processos: 80, resultados: 80 } }),
    );
    assert.equal(noLimite.length, 0, "40 é saudável");
    assert.equal(abaixo.length, 1);
  });

  // Segundo escalonamento do motor: abaixo de 20 vira urgência.
  test("nível abaixo de 20 escala para prioridade 1", () => {
    const critico = gerarRecomendacoes(
      retrato({ maturidadePorNivel: { visao: 19, tatico: 80, processos: 80, resultados: 80 } }),
    );
    const baixo = gerarRecomendacoes(
      retrato({ maturidadePorNivel: { visao: 20, tatico: 80, processos: 80, resultados: 80 } }),
    );
    assert.equal(critico[0].prioridade, 1);
    assert.equal(baixo[0].prioridade, 3);
  });

  test("gera uma recomendação por nível fraco", () => {
    const recs = gerarRecomendacoes(
      retrato({ maturidadePorNivel: { visao: 10, tatico: 10, processos: 90, resultados: 90 } }),
    );
    assert.equal(recs.length, 2);
  });
});

describe("regras de processo e pessoas", () => {
  test("cada processo fraco vira uma recomendação", () => {
    const recs = gerarRecomendacoes(
      retrato({
        processosFracos: [
          { nome: "Compras", media: 20 },
          { nome: "Expedição", media: 35 },
        ],
      }),
    );
    assert.equal(recs.length, 2);
    assert.ok(recs.every((r) => r.prioridade === 3));
  });

  // Pessoas são agrupadas: um único plano de desenvolvimento para o time,
  // não uma recomendação por colaborador.
  test("colaboradores fracos geram UMA recomendação agrupada", () => {
    const recs = gerarRecomendacoes(retrato({ colaboradoresBaixaMedia: ["Ana", "Bruno", "Caio"] }));
    assert.equal(recs.length, 1);
    assert.match(recs[0].detalhe, /Ana, Bruno, Caio/);
  });
});
