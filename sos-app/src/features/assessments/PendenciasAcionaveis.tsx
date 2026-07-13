"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarPlanoDaRecomendacao, criarIshikawa } from "@/features/ferramentas/actions";
import { cor } from "@/design/tokens";
import { NIVEIS, type Nivel } from "./tipos";

// Pendências acionáveis: para cada nível abaixo de 100%, oferece dois
// atalhos que transformam a lacuna em ação — um plano 5W2H ("o que fazer")
// ou uma análise de causa Ishikawa ("por que acontece") — já vinculados
// ao setor. É o elo diagnóstico → ação: a mancha vermelha vira trabalho.
export default function PendenciasAcionaveis({
  setorId,
  setorNome,
  porNivel,
}: {
  setorId: string;
  setorNome: string;
  porNivel: Record<Nivel, number>;
}) {
  const router = useRouter();
  const [processando, start] = useTransition();
  // Guarda qual botão está em ação (nivel+tipo) para feedback local.
  const [ocupado, setOcupado] = useState<string | null>(null);

  const pendentes = NIVEIS.map((n) => ({
    ...n,
    pct: Math.round(porNivel[n.id] ?? 0),
  })).filter((n) => n.pct < 100);

  if (pendentes.length === 0) return null;

  function abrirPlano(nivel: Nivel, titulo: string, cor: string) {
    const chave = `${nivel}-5w2h`;
    setOcupado(chave);
    start(async () => {
      const r = await criarPlanoDaRecomendacao(
        setorId,
        `${titulo} — ${setorNome}`,
        `Lacuna identificada no diagnóstico NEXO: nível ${titulo} do setor ${setorNome} está incompleto.`,
      );
      setOcupado(null);
      if (r.ok) router.push("/ferramentas/5w2h");
    });
  }

  function investigarCausa(nivel: Nivel, titulo: string) {
    const chave = `${nivel}-ishikawa`;
    setOcupado(chave);
    start(async () => {
      const r = await criarIshikawa(
        `Baixa maturidade em ${titulo} — ${setorNome}`,
        setorId,
      );
      setOcupado(null);
      if (r.ok) router.push("/ferramentas/ishikawa");
    });
  }

  return (
    <section style={{ marginTop: 8 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: cor.ink, margin: "0 0 4px" }}>
        Pendências acionáveis
      </h2>
      <p style={{ fontSize: 13, color: cor.faint, margin: "0 0 14px" }}>
        Transforme cada lacuna em trabalho: gere um plano de ação ou investigue a causa raiz.
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        {pendentes.map((n) => {
          const chave5w2h = `${n.id}-5w2h`;
          const chaveIsh = `${n.id}-ishikawa`;
          return (
            <div
              key={n.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                background: cor.surface,
                border: "1px solid #e6edf3",
                borderLeft: `5px solid ${n.cor}`,
                borderRadius: 12,
                padding: "12px 16px",
              }}
            >
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: cor.ink }}>{n.titulo}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: n.corDark, fontVariantNumeric: "tabular-nums" }}>
                    {n.pct}%
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: cor.faint }}>
                  faltam {100 - n.pct}% — {n.tag}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={processando}
                  onClick={() => abrirPlano(n.id, n.titulo, n.cor)}
                  style={{
                    cursor: processando ? "default" : "pointer",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#fff",
                    background: n.cor,
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 9,
                    opacity: processando && ocupado !== chave5w2h ? 0.5 : 1,
                  }}
                >
                  {ocupado === chave5w2h ? "Criando…" : "🗂️ Plano de ação"}
                </button>
                <button
                  type="button"
                  disabled={processando}
                  onClick={() => investigarCausa(n.id, n.titulo)}
                  style={{
                    cursor: processando ? "default" : "pointer",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: n.corDark,
                    background: "#fff",
                    border: `1px solid ${n.cor}55`,
                    padding: "8px 14px",
                    borderRadius: 9,
                    opacity: processando && ocupado !== chaveIsh ? 0.5 : 1,
                  }}
                >
                  {ocupado === chaveIsh ? "Criando…" : "🐟 Investigar causa"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
