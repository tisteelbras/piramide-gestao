"use client";

import { useMemo } from "react";
import { cor } from "@/design/tokens";
import { montarArvore, type PessoaOrganograma } from "./tipos";
import { calcularLayout, iniciais, CAIXA_L, CAIXA_A } from "./layout";

// Organograma visual: caixas conectadas por linhas em ângulo reto, em
// níveis horizontais. As linhas são um SVG atrás das caixas (posicionadas
// em absoluto), o que mantém o texto selecionável e acessível.
//
// Sem foto: o sistema não guarda imagem das pessoas, então o avatar traz
// as INICIAIS, com a cor variando por nível hierárquico.

const CORES_NIVEL = [cor.brand, cor.green, cor.warn, cor.brandDark, cor.greenDark];
const corDoNivel = (n: number) => CORES_NIVEL[n % CORES_NIVEL.length];

export default function ArvoreVisual({
  pessoas,
  onSelecionar,
  selecionadoId,
}: {
  pessoas: PessoaOrganograma[];
  onSelecionar?: (id: string) => void;
  selecionadoId?: string | null;
}) {
  const { caixas, ligacoes, largura, altura } = useMemo(
    () => calcularLayout(montarArvore(pessoas)),
    [pessoas],
  );

  if (caixas.length === 0) return null;

  return (
    // Rola horizontalmente quando a estrutura é larga — nunca estoura a página.
    <div style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: 8 }}>
      <div style={{ position: "relative", width: largura, height: altura, minWidth: "100%" }}>
        {/* Linhas de conexão (atrás das caixas) */}
        <svg
          width={largura}
          height={altura}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          aria-hidden
        >
          {ligacoes.map((l, i) => {
            // Cotovelo: desce do pai, corre na horizontal, desce até o filho.
            const meioY = (l.de.y + l.para.y) / 2;
            const d = `M ${l.de.x} ${l.de.y} V ${meioY} H ${l.para.x} V ${l.para.y}`;
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#cfdae4"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </svg>

        {/* Caixas das pessoas */}
        {caixas.map((c) => {
          const cn = corDoNivel(c.nivel);
          const ativo = selecionadoId === c.id;
          const clicavel = !!onSelecionar;
          return (
            <div
              key={c.id}
              onClick={clicavel ? () => onSelecionar!(c.id) : undefined}
              style={{
                position: "absolute",
                left: c.x,
                top: c.y,
                width: CAIXA_L,
                height: CAIXA_A,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "8px 10px",
                background: cor.surface,
                border: `1px solid ${ativo ? cn : "#e3ebf1"}`,
                borderTop: `3px solid ${cn}`,
                borderRadius: 12,
                boxShadow: ativo
                  ? `0 8px 22px ${cn}38`
                  : "0 4px 14px rgba(14,26,36,.08)",
                cursor: clicavel ? "pointer" : "default",
                transition: "box-shadow .15s, border-color .15s",
              }}
            >
              {/* Avatar com as iniciais (o sistema não tem foto) */}
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: cn,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  letterSpacing: 0.3,
                }}
                aria-hidden
              >
                {iniciais(c.nome)}
              </span>

              <span style={{ minWidth: 0, display: "grid", gap: 1 }}>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: cor.ink,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={c.nome}
                >
                  {c.nome}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: c.cargo ? cor.muted : cor.faint2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={c.cargo ?? undefined}
                >
                  {c.cargo || "sem função"}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
