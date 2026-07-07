"use client";

import { useState, useTransition } from "react";
import { addProcesso, removeProcesso, setNotaEixoProcesso } from "./actions";
import { EIXOS_PROCESSO, type ProcessoComEixos } from "./tipos";

type EixoProcesso = (typeof EIXOS_PROCESSO)[number]["id"];
const BLUE = "#0068a9", BLUE_D = "#004e80", INK = "#0e1a24";

export default function PainelProcessos({
  setorId,
  processos,
}: {
  setorId: string;
  processos: ProcessoComEixos[];
}) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [novo, setNovo] = useState("");
  const [, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn(); });

  return (
    <div style={{ marginTop: 18, borderTop: "1px solid #e3ebf1", paddingTop: 16 }}>
      {processos.length === 0 && <p style={{ fontSize: 13, color: "#a2afba", fontStyle: "italic", margin: "4px 0 10px" }}>Nenhum processo cadastrado. Adicione o primeiro abaixo.</p>}
      <div style={{ display: "grid", gap: 10 }}>
        {processos.map((p) => {
          const isOpen = aberto === p.id;
          return (
            <div key={p.id} style={{ border: "1px solid #e3ebf1", borderRadius: 12, overflow: "hidden" }}>
              <button onClick={() => setAberto(isOpen ? null : p.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: isOpen ? "#f4f8fb" : "#fff", border: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontWeight: 800, color: INK, fontSize: 14.5 }}>{p.nome}</span>
                {p.media != null && <span style={{ fontSize: 12, fontWeight: 700, color: BLUE_D, background: "#eaf2f8", padding: "2px 9px", borderRadius: 999 }}>média {p.media}</span>}
                <span style={{ marginLeft: "auto", color: BLUE_D, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s", fontWeight: 800 }}>›</span>
              </button>
              {isOpen && (
                <div style={{ padding: "6px 14px 14px", display: "grid", gap: 6 }}>
                  {EIXOS_PROCESSO.map((e) => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 130, fontSize: 12.5, color: "#5b6b78", fontWeight: 600 }}>{e.label}</span>
                      <input type="range" min={0} max={100} step={5} value={p.eixos[e.id] ?? 0}
                        onChange={(ev) => run(() => setNotaEixoProcesso(p.id, e.id as EixoProcesso, Number(ev.target.value)))}
                        style={{ flex: 1, accentColor: BLUE }} />
                      <span style={{ width: 34, textAlign: "right", fontWeight: 800, color: BLUE, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{p.eixos[e.id] ?? 0}</span>
                    </div>
                  ))}
                  <button onClick={() => run(() => removeProcesso(p.id))} style={{ justifySelf: "start", marginTop: 6, border: "1px solid #f0d0cd", background: "#fff", color: "#c0392b", fontWeight: 700, fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}>Remover processo</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input value={novo} placeholder="Nome do processo" onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && novo.trim()) { run(() => addProcesso(setorId, novo.trim())); setNovo(""); } }}
          style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: INK, flex: 1 }} />
        <button onClick={() => { if (novo.trim()) { run(() => addProcesso(setorId, novo.trim())); setNovo(""); } }}
          style={{ border: "none", background: BLUE, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
      </div>
    </div>
  );
}
