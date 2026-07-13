"use client";

import { useState } from "react";
import { NIVEIS, type Nivel } from "@/features/assessments/tipos";
import { cor } from "@/design/tokens";

type SetorComparavel = {
  id: string;
  nome: string;
  geral: number;
  porNivel: Record<Nivel, number>;
};

// Comparativo par-a-par: dois setores lado a lado nos 4 níveis, com barras
// espelhadas a partir do centro. Complementa o ranking (visão geral) com o
// detalhe "onde exatamente um setor supera o outro". Para a diretoria.
export default function CompararSetores({ setores }: { setores: SetorComparavel[] }) {
  const [idA, setIdA] = useState(setores[0]?.id ?? "");
  const [idB, setIdB] = useState(setores[1]?.id ?? setores[0]?.id ?? "");

  if (setores.length < 2) {
    return (
      <p style={{ fontSize: 12.5, color: cor.faint, margin: 0 }}>
        Cadastre ao menos dois setores para comparar áreas lado a lado.
      </p>
    );
  }

  const a = setores.find((s) => s.id === idA) ?? setores[0];
  const b = setores.find((s) => s.id === idB) ?? setores[1];

  const seletor = (valor: string, onChange: (v: string) => void, corTexto: string) => (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontSize: 13.5,
        fontWeight: 800,
        color: corTexto,
        border: `1px solid ${cor.hairline}`,
        borderRadius: 8,
        padding: "6px 10px",
        background: cor.surface,
        maxWidth: 180,
      }}
    >
      {setores.map((s) => (
        <option key={s.id} value={s.id}>
          {s.nome}
        </option>
      ))}
    </select>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        {seletor(idA, setIdA, cor.brand)}
        <span style={{ fontSize: 12, fontWeight: 800, color: cor.faint }}>VS</span>
        {seletor(idB, setIdB, cor.green)}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {NIVEIS.map((n) => {
          const va = Math.round(a.porNivel[n.id] ?? 0);
          const vb = Math.round(b.porNivel[n.id] ?? 0);
          const lider = va === vb ? "empate" : va > vb ? "a" : "b";
          return (
            <div key={n.id}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: cor.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {n.titulo}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
                {/* Lado A (cresce para a esquerda) */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: cor.brand, fontVariantNumeric: "tabular-nums", minWidth: 34, textAlign: "right", opacity: lider === "b" ? 0.5 : 1 }}>
                    {va}%
                  </span>
                  <div style={{ flex: 1, height: 12, background: cor.surfaceSunk, borderRadius: 999, overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: `${va}%`, height: "100%", background: cor.brand, opacity: lider === "b" ? 0.55 : 1, transition: "width .4s" }} />
                  </div>
                </div>

                {/* Marcador central de liderança */}
                <span style={{ fontSize: 12, width: 16, textAlign: "center" }} aria-hidden>
                  {lider === "empate" ? "=" : lider === "a" ? "◄" : "►"}
                </span>

                {/* Lado B (cresce para a direita) */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 12, background: cor.surfaceSunk, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${vb}%`, height: "100%", background: cor.green, opacity: lider === "a" ? 0.55 : 1, transition: "width .4s" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: cor.greenDark, fontVariantNumeric: "tabular-nums", minWidth: 34, opacity: lider === "a" ? 0.5 : 1 }}>
                    {vb}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé: geral dos dois */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTop: `1px solid ${cor.hairline}` }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: cor.brand }}>
          {a.nome}: {Math.round(a.geral)}%
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: cor.greenDark }}>
          {b.nome}: {Math.round(b.geral)}%
        </span>
      </div>
    </div>
  );
}
