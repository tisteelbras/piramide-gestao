"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addControle, setSituacaoControle, removerControle } from "./actions";
import { SITUACOES_CONTROLE, PROXIMA_SITUACAO, CONTROLES_SUGERIDOS } from "./tipos";
import type { ControlesDoSetor } from "./tipos";

const INK = "#0e1a24", GREEN = "#47ad4b";
const sit = (id: string) => SITUACOES_CONTROLE.find((x) => x.id === id)!;

export default function PainelControles({ setorId, setorNome, dados }: {
  setorId: string; setorNome: string; dados: ControlesDoSetor;
}) {
  const [, start] = useTransition();
  const router = useRouter();
  const [novo, setNovo] = useState("");
  const run = (fn: () => Promise<unknown>) => start(() => { void fn().then(() => router.refresh()); });

  const jaTem = new Set(dados.itens.map((i) => i.nome.toLowerCase()));
  const sugestoes = CONTROLES_SUGERIDOS.filter((s) => !jaTem.has(s.toLowerCase()));

  const adicionar = (nome: string) => { if (nome.trim()) { run(() => addControle(setorId, nome.trim())); setNovo(""); } };

  const corCob = dados.cobertura >= 70 ? "#33853a" : dados.cobertura >= 40 ? "#d98a00" : "#c0392b";

  return (
    <main style={{ minHeight: "100vh", background: "#eef3f7", padding: "28px 20px" }}>
      <header style={{ maxWidth: 900, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${setorId}/avaliar`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Voltar à avaliação</Link>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>Controles operacionais · {setorNome}</h1>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: corCob, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{dados.cobertura}%</div>
            <div style={{ fontSize: 11.5, color: "#5b6b78", marginTop: 4 }}>de cobertura</div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#5b6b78" }}>
            <b>Pilar 3 · Controles operacionais.</b> Existe acompanhamento da execução? Marque cada controle como não existe, parcial ou existe.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: sugestoes.length ? 8 : 16 }}>
          <input value={novo} placeholder="Novo controle (ex.: Checklist de fechamento)"
            onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") adicionar(novo); }}
            style={{ flex: 1, border: "1px solid #dce6ee", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: INK }} />
          <button onClick={() => adicionar(novo)} style={{ border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
        </div>
        {sugestoes.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {sugestoes.map((s) => (
              <button key={s} onClick={() => adicionar(s)} style={{ border: "1px dashed #cfdae4", background: "#fff", color: "#5b6b78", fontSize: 11.5, padding: "5px 10px", borderRadius: 999, cursor: "pointer" }}>+ {s}</button>
            ))}
          </div>
        )}

        {dados.itens.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfdae4", borderRadius: 12, padding: 28, textAlign: "center", color: "#8493a0", fontSize: 14 }}>
            Nenhum controle listado. Comece pelas sugestões acima.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {dados.itens.map((c) => {
              const s = sit(c.situacao);
              return (
                <div key={c.id} style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, borderLeft: `4px solid ${s.cor}` }}>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: INK }}>{c.nome}</span>
                  <button onClick={() => run(() => setSituacaoControle(setorId, c.id, PROXIMA_SITUACAO[c.situacao]))}
                    style={{ fontSize: 11.5, fontWeight: 800, padding: "5px 12px", borderRadius: 999, cursor: "pointer", border: "none", color: "#fff", background: s.cor, minWidth: 92 }}>
                    {s.label}
                  </button>
                  <button onClick={() => run(() => removerControle(setorId, c.id))} style={{ border: "none", background: "transparent", color: "#c0ccd6", fontSize: 18, cursor: "pointer", lineHeight: 1 }} aria-label="Remover">×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
