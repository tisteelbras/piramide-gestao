"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarFerramentasAnalise } from "./actions";
import {
  FERRAMENTAS_ANALISE,
  normalizaFerramentas,
  type FerramentaAnalise,
} from "@/domain/ferramentas-analise";

const INK = "#0e1a24", BLUE = "#0068a9", GREEN = "#47ad4b";

/**
 * "Habilitar ferramentas para esta análise" — aparece no topo da avaliação
 * quando a escolha ainda não foi feita (e pode ser reaberto depois).
 * Análise COMPLETA liga todas; PARCIAL deixa escolher. Ferramenta desligada
 * some das etapas.
 */
export default function HabilitarFerramentas({ avaliacaoId, habilitadas }: {
  avaliacaoId: string;
  habilitadas: string[] | null; // null = escolha não feita ainda
}) {
  const [, start] = useTransition();
  const router = useRouter();
  const escolhaFeita = habilitadas !== null;
  const [aberto, setAberto] = useState(!escolhaFeita);
  const [modo, setModo] = useState<"completa" | "parcial" | null>(escolhaFeita ? "parcial" : null);
  const [marcadas, setMarcadas] = useState<Set<FerramentaAnalise>>(
    () => new Set(normalizaFerramentas(habilitadas ?? [])),
  );
  const [salvando, setSalvando] = useState(false);

  const salvar = (m: "completa" | "parcial") => {
    setSalvando(true);
    start(async () => {
      await salvarFerramentasAnalise(avaliacaoId, m, [...marcadas]);
      setSalvando(false);
      setAberto(false);
      router.refresh();
    });
  };

  const alterna = (id: FerramentaAnalise) =>
    setMarcadas((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });

  // Fechado: só a barrinha para reabrir e ajustar.
  if (!aberto) {
    const total = escolhaFeita ? normalizaFerramentas(habilitadas).length : FERRAMENTAS_ANALISE.length;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f4f8fb", border: "1px solid #d7e8f4", borderRadius: 10, padding: "9px 14px", marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, color: "#3a5a72" }}>
          🧰 Ferramentas desta análise: <b>{total} de {FERRAMENTAS_ANALISE.length}</b> habilitadas.
        </span>
        <button onClick={() => setAberto(true)}
          style={{ marginLeft: "auto", border: "1px solid #cfe0ee", background: "#fff", color: BLUE, fontWeight: 700, fontSize: 12, padding: "5px 12px", borderRadius: 8, cursor: "pointer" }}>
          ajustar ›
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "2px solid #cfe0ee", borderRadius: 14, padding: 18, marginBottom: 16, boxShadow: "0 6px 18px rgba(0,104,169,.08)" }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: INK, marginBottom: 4 }}>
        Habilitar ferramentas para esta análise
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#5b6b78" }}>
        Escolha como analisar este setor. Ferramenta desabilitada <b>não aparece</b> nas etapas — menos poluição para análises mais simples. Dá para ajustar depois.
      </p>

      {/* Escolha do modo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginBottom: modo === "parcial" ? 14 : 0 }}>
        <button onClick={() => { setModo("completa"); salvar("completa"); }} disabled={salvando}
          style={{ textAlign: "left", border: modo === "completa" ? `2px solid ${GREEN}` : "1px solid #dce6ee", background: "#fff", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: GREEN }}>✓ Análise completa</div>
          <div style={{ fontSize: 12, color: "#5b6b78", marginTop: 2 }}>Todas as {FERRAMENTAS_ANALISE.length} ferramentas habilitadas.</div>
        </button>
        <button onClick={() => setModo("parcial")} disabled={salvando}
          style={{ textAlign: "left", border: modo === "parcial" ? `2px solid ${BLUE}` : "1px solid #dce6ee", background: "#fff", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: BLUE }}>⚙ Análise parcial</div>
          <div style={{ fontSize: 12, color: "#5b6b78", marginTop: 2 }}>Você escolhe quais ferramentas usar.</div>
        </button>
      </div>

      {/* Parcial: as ferramentas por etapa */}
      {modo === "parcial" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
            {FERRAMENTAS_ANALISE.map((f) => {
              const ativa = marcadas.has(f.id);
              return (
                <label key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, border: ativa ? "1.5px solid #9fc8e8" : "1px solid #e3ebf1", background: ativa ? "#f4f9fd" : "#fff", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>
                  <input type="checkbox" checked={ativa} onChange={() => alterna(f.id)} style={{ marginTop: 3, cursor: "pointer" }} />
                  <span>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: INK }}>{f.icone} {f.nome}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#8493a0" }}>{f.etapa} · {f.descricao}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <button onClick={() => salvar("parcial")} disabled={salvando}
              style={{ border: "none", background: salvando ? "#7fb4d8" : BLUE, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 18px", borderRadius: 8, cursor: salvando ? "default" : "pointer" }}>
              {salvando ? "Salvando…" : `Usar ${marcadas.size} ${marcadas.size === 1 ? "ferramenta" : "ferramentas"}`}
            </button>
            {escolhaFeita && (
              <button onClick={() => setAberto(false)} style={{ border: "none", background: "transparent", color: "#8493a0", fontSize: 12.5, cursor: "pointer" }}>cancelar</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
