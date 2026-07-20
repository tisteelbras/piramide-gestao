// Testes do motor de cálculo de maturidade.
// Foco nas REGRAS que definem a nota que o cliente vê — os limiares das
// faixas, o tratamento de item não respondido e o desconto do preenchimento.
// Roda sem banco: estas funções são puras por construção.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  grauMaturidade,
  mediaPonderada,
  percentualConclusao,
  consolidaNivel,
  maturidadeGeral,
} from "./maturidade";

describe("grauMaturidade", () => {
  test("classifica cada faixa pelo seu meio", () => {
    assert.equal(grauMaturidade(20), "inicial");
    assert.equal(grauMaturidade(50), "em_desenvolvimento");
    assert.equal(grauMaturidade(75), "consolidado");
    assert.equal(grauMaturidade(95), "referencia");
  });

  // Os limiares são a regra de negócio: 40, 65 e 85 são exclusivos na
  // faixa de baixo e inclusivos na de cima. Um off-by-one aqui muda o
  // diagnóstico exibido ao cliente.
  test("as bordas pertencem à faixa de cima", () => {
    assert.equal(grauMaturidade(39.9), "inicial");
    assert.equal(grauMaturidade(40), "em_desenvolvimento");
    assert.equal(grauMaturidade(64.9), "em_desenvolvimento");
    assert.equal(grauMaturidade(65), "consolidado");
    assert.equal(grauMaturidade(84.9), "consolidado");
    assert.equal(grauMaturidade(85), "referencia");
  });

  test("cobre os extremos da escala", () => {
    assert.equal(grauMaturidade(0), "inicial");
    assert.equal(grauMaturidade(100), "referencia");
  });
});

describe("mediaPonderada", () => {
  test("faz a média simples quando não há pesos", () => {
    assert.equal(mediaPonderada([{ nota: 40 }, { nota: 60 }]), 50);
  });

  test("respeita o peso de cada item", () => {
    // 100 pesando 3 contra 0 pesando 1 → 75.
    assert.equal(mediaPonderada([{ nota: 100, peso: 3 }, { nota: 0, peso: 1 }]), 75);
  });

  // A decisão central deste motor: não respondido é IGNORADO, não vale
  // zero. Contá-lo como zero puniria a área por ainda não ter preenchido.
  test("ignora item não respondido em vez de contá-lo como zero", () => {
    assert.equal(mediaPonderada([{ nota: 80 }, { nota: null }]), 80);
    assert.equal(mediaPonderada([{ nota: 80 }, { nota: NaN }]), 80);
  });

  test("devolve null quando nada foi respondido", () => {
    assert.equal(mediaPonderada([]), null);
    assert.equal(mediaPonderada([{ nota: null }, { nota: null }]), null);
  });

  test("arredonda para uma casa decimal", () => {
    // 100/3 = 33.333... → 33.3
    assert.equal(mediaPonderada([{ nota: 100 }, { nota: 0 }, { nota: 0 }]), 33.3);
  });
});

describe("percentualConclusao", () => {
  test("mede o quanto foi respondido, não a nota", () => {
    // Notas baixas, mas tudo respondido → 100% concluído.
    assert.equal(percentualConclusao([{ nota: 0 }, { nota: 10 }]), 100);
    assert.equal(percentualConclusao([{ nota: 90 }, { nota: null }]), 50);
  });

  test("lista vazia é 0, não divisão por zero", () => {
    assert.equal(percentualConclusao([]), 0);
  });
});

describe("consolidaNivel", () => {
  // A regra que impede a pirâmide de "mentir": notas altas com pouco
  // preenchido não podem desenhar um nível cheio.
  test("desconta o preenchimento pela fração não respondida", () => {
    const r = consolidaNivel([{ nota: 100 }, { nota: null }]);
    assert.equal(r.nota, 100, "a média considera só o que foi respondido");
    assert.equal(r.conclusao, 50);
    assert.equal(r.preenchimento, 50, "100 de nota com metade respondida vale 50");
  });

  test("nível totalmente respondido tem preenchimento igual à nota", () => {
    const r = consolidaNivel([{ nota: 80 }, { nota: 80 }]);
    assert.equal(r.preenchimento, 80);
    assert.equal(r.maturidade, "consolidado");
  });

  test("nível sem nenhuma resposta é inicial e vazio", () => {
    const r = consolidaNivel([{ nota: null }]);
    assert.equal(r.nota, null);
    assert.equal(r.conclusao, 0);
    assert.equal(r.preenchimento, 0);
    assert.equal(r.maturidade, "inicial", "sem nota, a faixa cai para inicial");
  });
});

describe("maturidadeGeral", () => {
  test("é a média dos preenchimentos dos níveis", () => {
    const niveis = [
      consolidaNivel([{ nota: 100 }]),
      consolidaNivel([{ nota: 50 }]),
      consolidaNivel([{ nota: 0 }]),
      consolidaNivel([{ nota: 50 }]),
    ];
    assert.equal(maturidadeGeral(niveis), 50);
  });

  test("sem níveis devolve 0", () => {
    assert.equal(maturidadeGeral([]), 0);
  });
});
