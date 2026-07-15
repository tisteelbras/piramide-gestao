"use client";

import { useState, useTransition } from "react";
import type { GerarDocInput } from "./actions";
import { gerarDocumento } from "./actions";

/**
 * Botão "Salvar em PDF" reutilizável. Chama a action que gera o documento
 * rastreável (código + autor + data), e ao concluir mostra o código e um
 * link de download. Opcionalmente anexa à etapa da Visão.
 */
export default function BotaoGerarDoc({
  montarDoc,
  rotulo = "🖨️ Salvar em PDF",
  className,
}: {
  // Função que monta o input do documento no clique (dados atuais da tela).
  montarDoc: () => GerarDocInput;
  rotulo?: string;
  className?: string;
}) {
  const [, start] = useTransition();
  const [estado, setEstado] = useState<{ codigo: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  const gerar = () => {
    setErro(null);
    setGerando(true);
    start(async () => {
      try {
        const r = await gerarDocumento(montarDoc());
        setEstado({ codigo: r.codigo });
      } catch {
        setErro("Não foi possível gerar o PDF. Tente novamente.");
      } finally {
        setGerando(false);
      }
    });
  };

  if (estado) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#eef7ef", border: "1px solid #cfe0d0", borderRadius: 10, padding: "8px 12px" }}>
        <span style={{ fontSize: 12.5, color: "#256a2b", fontWeight: 700 }}>PDF gerado · {estado.codigo}</span>
        <a href={`/api/documento/${estado.codigo}`} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12.5, fontWeight: 800, color: "#0068a9", textDecoration: "none", border: "1px solid #cfe0ee", borderRadius: 8, padding: "5px 11px", background: "#fff" }}>
          ⭳ Baixar
        </a>
        <button onClick={() => setEstado(null)} style={{ border: "none", background: "transparent", color: "#8493a0", fontSize: 12.5, cursor: "pointer" }}>gerar de novo</button>
      </div>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <button onClick={gerar} disabled={gerando} className={className}
        style={{ border: "none", background: gerando ? "#7fb4d8" : "#0068a9", color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: gerando ? "default" : "pointer" }}>
        {gerando ? "Gerando…" : rotulo}
      </button>
      {erro && <span style={{ fontSize: 12, color: "#c0392b" }}>{erro}</span>}
    </span>
  );
}
