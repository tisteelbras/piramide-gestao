"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSetor } from "./actions";

export default function AddSetor() {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const salvar = () => {
    const v = nome.trim();
    if (!v) return;
    start(async () => {
      await addSetor(v);
      setNome("");
      setAberto(false);
      router.refresh();
    });
  };

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)}
        style={{ border: "2px dashed #c3d3df", background: "rgba(255,255,255,.5)", color: "#5b6b78", fontWeight: 700, fontSize: 14, borderRadius: 16, padding: 20, cursor: "pointer", minHeight: 118, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        + Adicionar setor
      </button>
    );
  }

  return (
    <div style={{ border: "1px solid #cfe0ee", background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(14,26,36,.06)", display: "flex", flexDirection: "column", gap: 10, minHeight: 118 }}>
      <input autoFocus value={nome} placeholder="Nome do setor" onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") salvar(); if (e.key === "Escape") { setAberto(false); setNome(""); } }}
        style={{ border: "1.5px solid #0068a9", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#0e1a24" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={salvar} disabled={pending} style={{ flex: 1, border: "none", background: pending ? "#7fb4d8" : "#0068a9", color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px", borderRadius: 8, cursor: "pointer" }}>{pending ? "Salvando…" : "Criar"}</button>
        <button onClick={() => { setAberto(false); setNome(""); }} style={{ border: "1px solid #d9e2ea", background: "#fff", color: "#5b6b78", fontWeight: 700, fontSize: 13, padding: "9px 14px", borderRadius: 8, cursor: "pointer" }}>Cancelar</button>
      </div>
    </div>
  );
}
