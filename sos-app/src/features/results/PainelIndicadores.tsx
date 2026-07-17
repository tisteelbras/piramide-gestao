"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addIndicador, removeIndicador, toggleAusenciaIndicador } from "./actions";
import type { IndicadorItem } from "./tipos";

const GREEN = "#47ad4b", INK = "#0e1a24";

/**
 * Tela da etapa "Indicadores de Desempenho" da Visão. Aqui a área apenas
 * DECLARA quais KPIs ela tem (ou reconhece que precisa ter). O valor do KPI
 * em si é medido em outra plataforma — o NEXO não coleta meta × valor.
 *
 * Cada KPI declarado cria automaticamente um PROCESSO (N3): "o processo que
 * a área executa para atingir aquele indicador". É ESSE processo que é
 * medido (5 eixos) e forma o Resultado de KPI (N4) — um cadastro conecta os
 * três níveis.
 */
export default function PainelIndicadores({ setorId, setorNome, indicadores }: {
  setorId: string; setorNome: string; indicadores: IndicadorItem[];
}) {
  const [novo, setNovo] = useState("");
  const [, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn().then(() => router.refresh()); });
  const adicionar = () => { if (novo.trim()) { run(() => addIndicador(setorId, novo.trim())); setNovo(""); } };

  return (
    <main style={{ minHeight: "100vh", background: "#eef3f7", padding: "28px 20px" }}>
      <header style={{ maxWidth: 940, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${setorId}/avaliar`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Voltar à avaliação</Link>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>Indicadores de Desempenho · {setorNome}</h1>
      </header>

      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#5b6b78" }}>
            <b>Quais KPIs a área tem?</b> Declare aqui os indicadores que dizem se a área entrega. O <b>valor de cada KPI é medido fora do NEXO</b> — aqui a pergunta é <i>“tenho esse indicador e faço o processo para chegar nele?”</i>. Cada KPI declarado vira um <b>processo</b> em Processos: é a <b>execução desse processo</b> que é avaliada e forma o Resultado de KPI na pirâmide.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={novo} placeholder="Novo indicador (ex.: OTIF, Conversão, Retrabalho)"
            onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }}
            style={{ flex: 1, border: "1px solid #dce6ee", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: INK }} />
          <button onClick={adicionar} style={{ border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
        </div>

        {indicadores.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfdae4", borderRadius: 12, padding: 28, textAlign: "center", color: "#8493a0", fontSize: 14 }}>
            Nenhum indicador ainda. Comece pelos poucos que realmente dizem se a área entrega.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {indicadores.map((i) => <LinhaKpi key={i.id} i={i} setorId={setorId} run={run} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function LinhaKpi({ i, setorId, run }: {
  i: IndicadorItem; setorId: string; run: (fn: () => Promise<unknown>) => void;
}) {
  return (
    <div style={{ border: "1px solid #e3ebf1", borderRadius: 10, padding: "10px 12px", background: i.ehAusencia ? "#fffbfb" : "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontWeight: 700, color: INK, fontSize: 13.5 }}>{i.nome}</span>
        <button onClick={() => run(() => toggleAusenciaIndicador(i.id, !i.ehAusencia))}
          title={i.ehAusencia ? "A área reconhece que precisa deste KPI, mas ainda não o tem." : "A área tem este KPI."}
          style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, cursor: "pointer", border: i.ehAusencia ? "1px solid #f0c0bd" : "1px solid #cfe0d0", background: i.ehAusencia ? "#fdecea" : "#eef7ef", color: i.ehAusencia ? "#c0392b" : "#33853a" }}>
          {i.ehAusencia ? "não tenho ainda" : "tenho"}
        </button>
        {!i.ehAusencia && (
          <Link href={`/setor/${setorId}/avaliar#processos`}
            style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 700, color: "#0068a9", textDecoration: "none" }}>
            processo em Processos ›
          </Link>
        )}
        <button onClick={() => run(() => removeIndicador(i.id))} style={{ border: "none", background: "transparent", color: "#c0ccd6", fontSize: 18, cursor: "pointer", lineHeight: 1, marginLeft: i.ehAusencia ? "auto" : 0 }} aria-label="Remover">×</button>
      </div>
      {i.ehAusencia && (
        <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "#c0392b" }}>
          KPI reconhecido como necessário, mas ainda inexistente — vira recomendação no diagnóstico.
        </p>
      )}
    </div>
  );
}
