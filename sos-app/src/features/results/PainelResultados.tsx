"use client";

import { useState, useTransition } from "react";
import { addIndicador, removeIndicador, toggleAusenciaIndicador, gerarDiagnostico } from "./actions";
import type { ResultadosDoSetor } from "./tipos";

const GREEN = "#47ad4b", BLUE = "#0068a9", BLUE_D = "#004e80", INK = "#0e1a24";
const PRIO_COR: Record<number, string> = { 1: "#c0392b", 2: "#d98a00", 3: "#0068a9", 4: "#5b6b78", 5: "#8493a0" };

export default function PainelResultados({
  setorId,
  resultados,
}: {
  setorId: string;
  resultados: ResultadosDoSetor;
}) {
  const [novo, setNovo] = useState("");
  const [gerando, setGerando] = useState(false);
  const [, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn(); });

  return (
    <div style={{ marginTop: 18, borderTop: "1px solid #e3ebf1", paddingTop: 16 }}>
      {/* Indicadores */}
      <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: INK }}>Indicadores (KPIs)</h4>
      {resultados.indicadores.length === 0 && <p style={{ fontSize: 13, color: "#a2afba", fontStyle: "italic", margin: "4px 0" }}>Nenhum KPI cadastrado.</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {resultados.indicadores.map((i) => (
          <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e3ebf1", borderRadius: 10, padding: "8px 12px" }}>
            <span style={{ fontWeight: 700, color: INK, fontSize: 13.5 }}>{i.nome}</span>
            <button onClick={() => run(() => toggleAusenciaIndicador(i.id, !i.ehAusencia))}
              style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, cursor: "pointer",
                border: i.ehAusencia ? "1px solid #f0c0bd" : "1px solid #cfe0d0",
                background: i.ehAusencia ? "#fdecea" : "#eef7ef",
                color: i.ehAusencia ? "#c0392b" : "#33853a" }}>
              {i.ehAusencia ? "ausente" : "ativo"}
            </button>
            <button onClick={() => run(() => removeIndicador(i.id))} style={{ marginLeft: "auto", border: "none", background: "transparent", color: "#c0ccd6", fontSize: 18, cursor: "pointer", lineHeight: 1 }} aria-label="Remover">×</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input value={novo} placeholder="Nome do indicador (ex.: OTIF)" onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && novo.trim()) { run(() => addIndicador(setorId, novo.trim())); setNovo(""); } }}
          style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: INK, flex: 1 }} />
        <button onClick={() => { if (novo.trim()) { run(() => addIndicador(setorId, novo.trim())); setNovo(""); } }}
          style={{ border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
      </div>
      <p style={{ fontSize: 12, color: "#8493a0", marginTop: 6 }}>Marque um KPI como <b>ausente</b> para o diagnóstico sugerir ações.</p>

      {/* Diagnóstico */}
      <div style={{ marginTop: 20, background: "#f4f8fb", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: resultados.recomendacoes.length ? 14 : 0, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: BLUE_D }}>Diagnóstico automático</div>
            <div style={{ fontSize: 12, color: "#5b6b78" }}>Analisa todos os níveis e gera recomendações priorizadas.</div>
          </div>
          <button
            onClick={() => { setGerando(true); run(async () => { await gerarDiagnostico(setorId); setGerando(false); }); }}
            disabled={gerando}
            style={{ marginLeft: "auto", border: "none", background: gerando ? "#7fb4d8" : BLUE, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 16px", borderRadius: 10, cursor: gerando ? "default" : "pointer", boxShadow: "0 4px 12px rgba(0,104,169,.25)" }}>
            {gerando ? "Analisando…" : "⚡ Gerar diagnóstico"}
          </button>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {resultados.recomendacoes.map((r) => (
            <div key={r.id} style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 10, padding: "10px 12px", borderLeft: `4px solid ${PRIO_COR[r.prioridade] ?? BLUE}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: PRIO_COR[r.prioridade] ?? BLUE, padding: "2px 7px", borderRadius: 999 }}>P{r.prioridade}</span>
                <span style={{ fontWeight: 800, fontSize: 13.5, color: INK }}>{r.titulo}</span>
              </div>
              {r.detalhe && <p style={{ margin: "2px 0", fontSize: 12.5, color: "#5b6b78" }}>{r.detalhe}</p>}
              {r.impactoEsperado && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#33853a", fontWeight: 600 }}>Impacto: {r.impactoEsperado}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
