"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addProcesso, removeProcesso, setNotaEixoProcesso } from "./actions";
import { EIXOS_PROCESSO, TIPOS_PROCESSO, type ProcessoComEixos, type TipoProcesso } from "./tipos";

type EixoProcesso = (typeof EIXOS_PROCESSO)[number]["id"];
const BLUE = "#0068a9", BLUE_D = "#004e80", INK = "#0e1a24", GREEN_D = "#33853a";

export default function PainelProcessos({
  setorId,
  processos,
}: {
  setorId: string;
  processos: ProcessoComEixos[];
}) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [novo, setNovo] = useState("");
  const [novoTipo, setNovoTipo] = useState<TipoProcesso>("outro");
  const [, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn(); });

  const adicionar = () => {
    if (!novo.trim()) return;
    run(() => addProcesso(setorId, novo.trim(), novoTipo));
    setNovo("");
    setNovoTipo("outro");
  };
  const rotuloTipo = (t: TipoProcesso) => TIPOS_PROCESSO.find((x) => x.id === t)?.label ?? t;

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
                {p.tipo === "kpi" && (
                  <span title="Processo que a área executa para atingir este KPI — medi-lo forma o Resultado de KPI." style={{ fontSize: 10.5, fontWeight: 800, color: "#7a4bd8", background: "#f2edfc", padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    📊 Execução de KPI
                  </span>
                )}
                {p.tipo !== "outro" && (
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: GREEN_D, background: "#eef7ef", padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    → Resultado
                  </span>
                )}
                {p.media != null && <span style={{ fontSize: 12, fontWeight: 700, color: BLUE_D, background: "#eaf2f8", padding: "2px 9px", borderRadius: 999 }}>média {p.media}</span>}
                <span style={{ marginLeft: "auto", color: BLUE_D, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s", fontWeight: 800 }}>›</span>
              </button>
              {isOpen && (
                <div style={{ padding: "6px 14px 14px", display: "grid", gap: 6 }}>
                  {EIXOS_PROCESSO.map((e) => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 140, fontSize: 12.5, color: "#5b6b78", fontWeight: 600 }}>{e.label}</span>
                      <input type="range" min={0} max={100} step={10} value={p.eixos[e.id] ?? 0}
                        onChange={(ev) => run(() => setNotaEixoProcesso(p.id, e.id as EixoProcesso, Number(ev.target.value)))}
                        style={{ flex: 1, accentColor: BLUE }} />
                      <span style={{ width: 34, textAlign: "right", fontWeight: 800, color: BLUE, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{p.eixos[e.id] ?? 0}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                    <button onClick={() => run(() => removeProcesso(p.id))} style={{ border: "1px solid #f0d0cd", background: "#fff", color: "#c0392b", fontWeight: 700, fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}>Remover processo</button>
                    <Link href={`/setor/${setorId}/mapa`} style={{ textDecoration: "none", border: "1px solid #cfe0ee", background: "#eef4f9", color: BLUE, fontWeight: 700, fontSize: 12, padding: "6px 12px", borderRadius: 8 }}>⇉ Mapa deste processo</Link>
                    <span style={{ fontSize: 11.5, color: "#8493a0" }}>Tipo: <b>{rotuloTipo(p.tipo)}</b></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <input value={novo} placeholder="Nome do processo" onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }}
          style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: INK, flex: 1, minWidth: 160 }} />
        {/* O tipo "kpi" fica fora do seletor: um processo de execução de KPI
            nasce ao declarar o indicador na etapa Indicadores da Visão. */}
        <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as TipoProcesso)}
          style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "7px 10px", fontSize: 12.5, color: INK, background: "#fff", maxWidth: 230 }}>
          {TIPOS_PROCESSO.filter((t) => t.id !== "kpi").map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <button onClick={adicionar}
          style={{ border: "none", background: BLUE, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
      </div>
      <p style={{ fontSize: 11.5, color: "#8493a0", margin: "6px 0 0" }}>
        Tipos <b>Avaliação de desempenho, Governança, Monitoramento e KPI</b> alimentam o nível Resultado; <b>Outros</b> conta só aqui em Processos.
      </p>
    </div>
  );
}
