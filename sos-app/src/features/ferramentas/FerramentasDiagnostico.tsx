"use client";

import { useState } from "react";
import Link from "next/link";
import { cor } from "@/design/tokens";
import { FERRAMENTAS_DIAGNOSTICO } from "./tipos";

// Ferramentas do diagnóstico: existem POR SETOR. O hub mostra um seletor
// de setor e, para cada ferramenta, o progresso real daquele setor —
// assim o card não é um link vago, e sim um retrato do que falta ali.
type StatusSetor = {
  setorId: string;
  setorNome: string;
  organograma: { pessoas: number };
  raci: { atividades: number; lacunas: number };
  mapa: { processos: number; documentados: number; padronizacao: number };
};

export default function FerramentasDiagnostico({ setores }: { setores: StatusSetor[] }) {
  const [setorId, setSetorId] = useState(setores[0]?.setorId ?? "");

  if (setores.length === 0) {
    return (
      <p style={{ fontSize: 13, color: cor.faint, margin: 0 }}>
        Cadastre um setor para usar as ferramentas do diagnóstico.
      </p>
    );
  }

  const atual = setores.find((s) => s.setorId === setorId) ?? setores[0];

  // Status curto de cada ferramenta, para o rodapé do card.
  const status: Record<string, { texto: string; alerta: boolean }> = {
    organograma: atual.organograma.pessoas
      ? { texto: `${atual.organograma.pessoas} pessoa${atual.organograma.pessoas === 1 ? "" : "s"} mapeadas`, alerta: false }
      : { texto: "ninguém cadastrado ainda", alerta: true },
    raci: !atual.raci.atividades
      ? { texto: "sem processos para atribuir", alerta: true }
      : atual.raci.lacunas
        ? { texto: `${atual.raci.lacunas} lacuna${atual.raci.lacunas === 1 ? "" : "s"} de responsabilidade`, alerta: true }
        : { texto: "responsabilidades definidas", alerta: false },
    mapa: !atual.mapa.processos
      ? { texto: "sem processos cadastrados", alerta: true }
      : {
          texto: `${atual.mapa.padronizacao}% padronizado (${atual.mapa.documentados}/${atual.mapa.processos})`,
          alerta: atual.mapa.padronizacao < 100,
        },
  };

  return (
    <div>
      {/* Seletor de setor */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: cor.muted }}>Setor:</span>
        <select
          value={setorId}
          onChange={(e) => setSetorId(e.target.value)}
          style={{ border: `1px solid ${cor.hairline}`, borderRadius: 9, padding: "8px 12px", fontSize: 13.5, fontWeight: 700, color: cor.ink, background: cor.surface }}
        >
          {setores.map((s) => (
            <option key={s.setorId} value={s.setorId}>{s.setorNome}</option>
          ))}
        </select>
        <Link
          href={`/setor/${atual.setorId}`}
          style={{ fontSize: 12.5, fontWeight: 700, color: cor.brand, textDecoration: "none" }}
        >
          ver diagnóstico do setor ›
        </Link>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {FERRAMENTAS_DIAGNOSTICO.map((f) => {
          const st = status[f.id];
          return (
            <Link
              key={f.id}
              href={f.rota(atual.setorId)}
              style={{
                textDecoration: "none",
                background: cor.surface,
                border: "1px solid #e3ebf1",
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 10px 30px rgba(14,26,36,.06)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span aria-hidden style={{ fontSize: 24 }}>{f.emoji}</span>
                <span style={{ fontSize: 15.5, fontWeight: 800, color: cor.ink }}>{f.nome}</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: cor.brand }}>{f.pergunta}</span>
              <span style={{ fontSize: 12.5, color: cor.muted, lineHeight: 1.45 }}>{f.descricao}</span>
              <span
                style={{
                  marginTop: "auto",
                  paddingTop: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: st.alerta ? cor.warnFg : cor.success,
                  borderTop: "1px dashed #e3ebf1",
                }}
              >
                {st.alerta ? "⚠ " : "✓ "}
                {st.texto}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
