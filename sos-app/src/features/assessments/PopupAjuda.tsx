"use client";

import { useEffect } from "react";
import { cor } from "@/design/tokens";
import type { BlocoAjuda } from "./ajuda-visao";

// Popup de ajuda: mostra a explicação completa de uma etapa da Visão (ou a
// introdução do nível). Fecha no Esc, no clique fora e no botão.
export default function PopupAjuda({
  titulo,
  perguntaChave,
  blocos,
  onFechar,
}: {
  titulo: string;
  perguntaChave?: string;
  blocos: BlocoAjuda[];
  onFechar: () => void;
}) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={onFechar}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(14,26,36,.55)",
        zIndex: 200,
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: cor.surface,
          borderRadius: 18,
          maxWidth: 620,
          width: "100%",
          maxHeight: "82vh",
          overflowY: "auto",
          boxShadow: "0 30px 70px rgba(14,26,36,.35)",
          borderTop: `6px solid ${cor.brand}`,
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            position: "sticky",
            top: 0,
            background: cor.surface,
            padding: "20px 24px 12px",
            borderBottom: `1px solid ${cor.hairline}`,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: cor.ink }}>{titulo}</h2>
            {perguntaChave && (
              <p style={{ margin: "6px 0 0", fontSize: 13.5, fontWeight: 700, color: cor.brand }}>
                {perguntaChave}
              </p>
            )}
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            style={{
              border: "none",
              background: cor.surfaceSunk,
              color: cor.muted,
              width: 30,
              height: 30,
              borderRadius: 8,
              fontSize: 16,
              lineHeight: 1,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: "16px 24px 24px", display: "grid", gap: 14 }}>
          {blocos.map((b, i) => {
            if (b.tipo === "paragrafo") {
              return (
                <p key={i} style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: cor.muted }}>
                  {b.texto}
                </p>
              );
            }
            if (b.tipo === "destaque") {
              return (
                <div
                  key={i}
                  style={{
                    background: cor.surfaceSunk,
                    borderLeft: `4px solid ${cor.brand}`,
                    borderRadius: 8,
                    padding: "12px 14px",
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    color: cor.ink,
                    fontWeight: 600,
                  }}
                >
                  {b.texto}
                </div>
              );
            }
            return (
              <div key={i}>
                {b.titulo && (
                  <div style={{ fontSize: 13, fontWeight: 800, color: cor.ink, marginBottom: 7 }}>
                    {b.titulo}
                  </div>
                )}
                <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 5 }}>
                  {b.itens.map((it, j) => (
                    <li key={j} style={{ fontSize: 13.5, lineHeight: 1.5, color: cor.muted }}>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
