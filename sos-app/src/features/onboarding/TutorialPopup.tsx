"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { marcarTutorialVisto } from "./actions";
import { SECOES_SOBRE, TAGLINE } from "./conteudo";

const BLUE = "#0068a9", INK = "#0e1a24";

/** Boas-vindas do primeiro acesso: apresenta a ferramenta em passos.
 *  Ao fechar, fica registrado e não aparece mais — o conteúdo completo
 *  segue disponível em /sobre. */
export default function TutorialPopup({ nome }: { nome: string | null }) {
  const [aberto, setAberto] = useState(true);
  const [passo, setPasso] = useState(0);
  const [, start] = useTransition();
  const primeiroNome = nome?.trim().split(/\s+/)[0] ?? "";

  const fechar = () => {
    setAberto(false);
    start(async () => { await marcarTutorialVisto(); });
  };
  if (!aberto) return null;

  const s = SECOES_SOBRE[passo];
  const ultimo = passo === SECOES_SOBRE.length - 1;

  return (
    <div role="dialog" aria-modal="true" aria-label="Boas-vindas ao NEXO"
      style={{ position: "fixed", inset: 0, background: "rgba(14,26,36,.55)", zIndex: 100, display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 20, maxWidth: 520, width: "100%", boxShadow: "0 30px 80px rgba(14,26,36,.35)", overflow: "hidden" }}>
        <div style={{ background: BLUE, color: "#fff", padding: "18px 22px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>Bem-vindo{primeiroNome ? `, ${primeiroNome}` : ""}! 👋</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.01em" }}>NEXO</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.9 }}>{TAGLINE}</div>
        </div>

        <div style={{ padding: "20px 22px", minHeight: 170 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span aria-hidden style={{ fontSize: 24 }}>{s.emoji}</span>
            <h2 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: INK }}>{s.titulo}</h2>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: "#46586a", lineHeight: 1.6 }}>{s.texto}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 22px 20px" }}>
          {/* progresso */}
          <div style={{ display: "flex", gap: 5 }}>
            {SECOES_SOBRE.map((_, i) => (
              <button key={i} onClick={() => setPasso(i)} aria-label={`Passo ${i + 1}`}
                style={{ width: i === passo ? 18 : 7, height: 7, borderRadius: 999, border: "none", cursor: "pointer", background: i === passo ? BLUE : "#d9e2ea", transition: "width .2s" }} />
            ))}
          </div>
          <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={fechar}
              style={{ border: "none", background: "transparent", color: "#8493a0", fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: "9px 6px" }}>
              Pular
            </button>
            {passo > 0 && (
              <button onClick={() => setPasso((p) => p - 1)}
                style={{ border: "1px solid #dce6ee", background: "#fff", color: "#5b6b78", fontWeight: 700, fontSize: 12.5, padding: "9px 14px", borderRadius: 8, cursor: "pointer" }}>
                ‹ Voltar
              </button>
            )}
            <button onClick={() => (ultimo ? fechar() : setPasso((p) => p + 1))}
              style={{ border: "none", background: BLUE, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "9px 16px", borderRadius: 8, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,104,169,.25)" }}>
              {ultimo ? "Começar a usar ✓" : "Próximo ›"}
            </button>
          </span>
        </div>

        <div style={{ borderTop: "1px solid #eef2f6", padding: "10px 22px", fontSize: 11.5, color: "#8493a0" }}>
          O texto completo da metodologia está em <Link href="/sobre" style={{ color: BLUE, fontWeight: 700 }}>Sobre o NEXO</Link>, disponível a qualquer momento.
        </div>
      </div>
    </div>
  );
}
