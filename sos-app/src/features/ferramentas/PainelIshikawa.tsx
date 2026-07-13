"use client";

import { useState, useTransition } from "react";
import { criarIshikawa, removerIshikawa, addCausaIshikawa, removerCausaIshikawa } from "./actions";
import { CATEGORIAS_ISHIKAWA, type CategoriaIshikawa, type IshikawaComCausas, type SetorOpcao } from "./tipos";

const GREEN = "#47ad4b", INK = "#0e1a24";
const inputStyle: React.CSSProperties = { border: "1px solid #dce6ee", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: INK, minWidth: 0 };

export default function PainelIshikawa({ analises, setores }: { analises: IshikawaComCausas[]; setores: SetorOpcao[] }) {
  const [problema, setProblema] = useState("");
  const [setorId, setSetorId] = useState("");
  const [, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn(); });

  const criar = () => {
    if (!problema.trim()) return;
    run(() => criarIshikawa(problema.trim(), setorId || null));
    setProblema(""); setSetorId("");
  };

  return (
    <div>
      {/* Nova análise */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <input value={problema} placeholder="Problema / efeito a analisar (ex.: Atraso na expedição)" onChange={(e) => setProblema(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") criar(); }} style={{ ...inputStyle, flex: 1, minWidth: 220 }} />
        <select value={setorId} onChange={(e) => setSetorId(e.target.value)} style={{ ...inputStyle, background: "#fff", maxWidth: 200 }}>
          <option value="">Sem setor vinculado</option>
          {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <button onClick={criar} style={{ border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>+ Nova análise</button>
      </div>

      {analises.length === 0 && (
        <p style={{ fontSize: 13.5, color: "#a2afba", fontStyle: "italic" }}>
          Nenhuma análise ainda. Descreva um problema acima e distribua as causas nos 6M.
        </p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {analises.map((i) => <CardIshikawa key={i.id} analise={i} run={run} />)}
      </div>
    </div>
  );
}

function CardIshikawa({ analise: i, run }: { analise: IshikawaComCausas; run: (fn: () => Promise<unknown>) => void }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div style={{ border: "1px solid #e3ebf1", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
      <button onClick={() => setAberto((a) => !a)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: aberto ? "#f4f8fb" : "#fff", border: "none", cursor: "pointer", textAlign: "left", flexWrap: "wrap" }}>
        <span aria-hidden style={{ fontSize: 16 }}>🐟</span>
        <span style={{ fontWeight: 800, color: INK, fontSize: 15 }}>{i.problema}</span>
        {i.setorNome && <span style={{ fontSize: 10.5, fontWeight: 800, color: "#004e80", background: "#eaf2f8", padding: "2px 8px", borderRadius: 999 }}>{i.setorNome}</span>}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#5b6b78" }}>{i.causas.length} causa{i.causas.length === 1 ? "" : "s"}</span>
          <span style={{ color: "#004e80", transform: aberto ? "rotate(90deg)" : "none", transition: "transform .2s", fontWeight: 800 }}>›</span>
        </span>
      </button>

      {aberto && (
        <div style={{ padding: "4px 16px 16px" }}>
          {/* Efeito em destaque (a "cabeça do peixe") */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0 12px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#8493a0", textTransform: "uppercase", letterSpacing: ".05em" }}>Efeito</span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: "#c0392b", background: "#fdecea", border: "1px solid #f0c0bd", padding: "5px 12px", borderRadius: 999 }}>{i.problema}</span>
          </div>

          {/* 6M em grade */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
            {CATEGORIAS_ISHIKAWA.map((cat) => (
              <CelulaCategoria key={cat.id} ishikawaId={i.id} categoria={cat.id} rotulo={cat.label}
                causas={i.causas.filter((c) => c.categoria === cat.id)} run={run} />
            ))}
          </div>

          <button onClick={() => { if (confirm(`Remover a análise "${i.problema}" e todas as causas?`)) run(() => removerIshikawa(i.id)); }}
            style={{ marginTop: 12, border: "1px solid #f0d0cd", background: "#fff", color: "#c0392b", fontWeight: 700, fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}>
            Remover análise
          </button>
        </div>
      )}
    </div>
  );
}

function CelulaCategoria({
  ishikawaId, categoria, rotulo, causas, run,
}: {
  ishikawaId: string;
  categoria: CategoriaIshikawa;
  rotulo: string;
  causas: { id: string; descricao: string }[];
  run: (fn: () => Promise<unknown>) => void;
}) {
  const [nova, setNova] = useState("");
  const adicionar = () => {
    if (!nova.trim()) return;
    run(() => addCausaIshikawa(ishikawaId, categoria, nova.trim()));
    setNova("");
  };

  return (
    <div style={{ border: "1px solid #e3ebf1", borderRadius: 10, padding: "10px 12px", background: "#fbfdfe" }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: "#004e80", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>{rotulo}</div>
      <div style={{ display: "grid", gap: 4, marginBottom: 8 }}>
        {causas.length === 0 && <span style={{ fontSize: 12, color: "#a2afba", fontStyle: "italic" }}>Sem causas registradas.</span>}
        {causas.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span aria-hidden style={{ color: "#0068a9", fontWeight: 800 }}>›</span>
            <span style={{ flex: 1, fontSize: 12.5, color: INK }}>{c.descricao}</span>
            <button onClick={() => run(() => removerCausaIshikawa(c.id))} aria-label={`Remover causa: ${c.descricao}`}
              style={{ border: "none", background: "transparent", color: "#c0ccd6", fontSize: 15, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>
      <input value={nova} placeholder="+ causa (Enter salva)" onChange={(e) => setNova(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }}
        style={{ ...inputStyle, width: "100%", fontSize: 12.5, padding: "6px 9px" }} />
    </div>
  );
}
