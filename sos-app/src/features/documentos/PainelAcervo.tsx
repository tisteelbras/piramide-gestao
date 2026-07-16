"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Acervo } from "./queries";

const INK = "#0e1a24", BLUE = "#0068a9";

// Cor por tipo de documento — ajuda a bater o olho e reconhecer.
const COR_TIPO: Record<string, string> = {
  "Plano de ação": "#0068a9",
  "Registro de Visão": "#6b3fa0",
  "Objetivos Estratégicos": "#33853a",
  "Controles Operacionais": "#d98a00",
  "Matriz de Sucessão": "#c0392b",
};
const corTipo = (t: string) => COR_TIPO[t] ?? "#5b6b78";

/**
 * Acervo — a casa de todos os documentos gerados pelo NEXO: o quê, de qual
 * setor, quem gerou e quando, com busca e download. É a tela da trilha
 * ISO 9001 (tabela documento_gerado) que antes só existia no banco.
 */
export default function PainelAcervo({ acervo, escopoSetor }: {
  acervo: Acervo;
  // Nome do setor quando o acervo está restrito ao líder (null = empresa toda).
  escopoSetor: string | null;
}) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [setorF, setSetorF] = useState("");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return acervo.documentos.filter((d) => {
      if (tipo && d.tipo !== tipo) return false;
      if (setorF && d.setorNome !== setorF) return false;
      if (q && !`${d.codigo} ${d.titulo} ${d.autorNome} ${d.setorNome ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [acervo.documentos, busca, tipo, setorF]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <main style={{ minHeight: "100vh", background: "#eef3f7", padding: "28px 20px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Voltar</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "16px 0 4px", color: INK }}>Acervo de documentos</h1>
        <p style={{ margin: "0 0 20px", color: "#5b6b78", fontSize: 14 }}>
          Tudo que o NEXO gerou{escopoSetor ? <> na área <b>{escopoSetor}</b></> : null} — com código, autor e data. Rastreável para reunião e auditoria (ISO 9001).
        </p>

        {/* Busca + filtros */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input value={busca} placeholder="Buscar por código, título, autor…"
            onChange={(e) => setBusca(e.target.value)}
            style={{ flex: "2 1 240px", border: "1px solid #dce6ee", borderRadius: 8, padding: "9px 12px", fontSize: 13.5, color: INK, background: "#fff" }} />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}
            style={{ flex: "1 1 160px", border: "1px solid #dce6ee", borderRadius: 8, padding: "9px 10px", fontSize: 13, color: INK, background: "#fff", cursor: "pointer" }}>
            <option value="">Todos os tipos</option>
            {acervo.tipos.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {!escopoSetor && (
            <select value={setorF} onChange={(e) => setSetorF(e.target.value)}
              style={{ flex: "1 1 140px", border: "1px solid #dce6ee", borderRadius: 8, padding: "9px 10px", fontSize: 13, color: INK, background: "#fff", cursor: "pointer" }}>
              <option value="">Todos os setores</option>
              {acervo.setores.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>

        {/* Lista */}
        {filtrados.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfdae4", borderRadius: 12, padding: 32, textAlign: "center", color: "#8493a0", fontSize: 14 }}>
            {acervo.documentos.length === 0
              ? "Nenhum documento gerado ainda. Use o botão 'Salvar em PDF' nas ferramentas — cada documento aparece aqui."
              : "Nada encontrado com esses filtros."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {filtrados.map((d) => (
              <div key={d.codigo} style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderLeft: `4px solid ${corTipo(d.tipo)}` }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: corTipo(d.tipo), padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{d.tipo}</span>
                <div style={{ flex: "1 1 200px", minWidth: 160 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: INK }}>{d.titulo}</div>
                  <div style={{ fontSize: 11.5, color: "#8493a0" }}>
                    {d.codigo}{d.setorNome ? ` · ${d.setorNome}` : ""} · por <b>{d.autorNome}</b> · {fmt(d.geradoEm)}
                  </div>
                </div>
                <a href={`/api/documento/${d.codigo}`} target="_blank" rel="noopener noreferrer"
                  style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 800, color: BLUE, textDecoration: "none", border: "1px solid #cfe0ee", borderRadius: 8, padding: "6px 12px", background: "#fff", whiteSpace: "nowrap" }}>
                  ⭳ Baixar
                </a>
              </div>
            ))}
          </div>
        )}

        <p style={{ marginTop: 14, fontSize: 12, color: "#8493a0" }}>
          {filtrados.length} de {acervo.documentos.length} {acervo.documentos.length === 1 ? "documento" : "documentos"}.
        </p>
      </div>
    </main>
  );
}
