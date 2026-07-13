"use client";

import { useState, useTransition } from "react";
import { addItemBcg, setEixosItemBcg, removerItemBcg } from "./actions";
import { quadranteBcg, ROTULO_QUADRANTE, type ItemBcgDTO } from "./tipos";

const BLUE = "#0068a9", GREEN = "#47ad4b", INK = "#0e1a24";
const inputStyle: React.CSSProperties = { border: "1px solid #dce6ee", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: INK, minWidth: 0 };

const COR_QUADRANTE: Record<string, { bg: string; fg: string }> = {
  estrela: { bg: "#eef7ef", fg: "#33853a" },
  interrogacao: { bg: "#fdf3e0", fg: "#8a5a08" },
  vaca_leiteira: { bg: "#eaf2f8", fg: "#004e80" },
  abacaxi: { bg: "#fdecea", fg: "#c0392b" },
};

export default function PainelBcg({ itens }: { itens: ItemBcgDTO[] }) {
  const [nome, setNome] = useState("");
  const [, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn(); });

  const adicionar = () => {
    if (!nome.trim()) return;
    run(() => addItemBcg(nome.trim()));
    setNome("");
  };

  const plotaveis = itens.filter(
    (i): i is ItemBcgDTO & { participacao: number; crescimento: number } =>
      i.participacao != null && i.crescimento != null,
  );

  return (
    <div>
      <MatrizSvg itens={plotaveis} />

      {/* Cadastro e edição (também é a visão em tabela dos dados do gráfico) */}
      <div style={{ display: "flex", gap: 8, margin: "18px 0 12px" }}>
        <input value={nome} placeholder="Produto ou serviço (ex.: Linha AC Inox)" onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }} style={{ ...inputStyle, flex: 1 }} />
        <button onClick={adicionar} style={{ border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
      </div>

      {itens.length === 0 && (
        <p style={{ fontSize: 13.5, color: "#a2afba", fontStyle: "italic" }}>
          Nenhum item no portfólio. Adicione produtos/serviços e posicione cada um nos dois eixos.
        </p>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {itens.map((i) => <LinhaItem key={i.id} item={i} run={run} />)}
      </div>
    </div>
  );
}

// ————— Matriz 2×2 em SVG (orientação clássica: participação alta à esquerda) —————
function MatrizSvg({ itens }: { itens: (ItemBcgDTO & { participacao: number; crescimento: number })[] }) {
  const W = 640, H = 430, M = { top: 26, right: 16, bottom: 46, left: 52 };
  const pw = W - M.left - M.right, ph = H - M.top - M.bottom;
  // Eixo X clássico da BCG: participação 100 (esquerda) → 0 (direita).
  const x = (part: number) => M.left + ((100 - part) / 100) * pw;
  const y = (cresc: number) => M.top + ((100 - cresc) / 100) * ph;

  const quadrantes = [
    { rotulo: "⭐ Estrela", sub: "investir", cx: M.left + pw * 0.25, cy: M.top + 16, bg: "#f2f8f3" },
    { rotulo: "❓ Interrogação", sub: "avaliar", cx: M.left + pw * 0.75, cy: M.top + 16, bg: "#fdf8ec" },
    { rotulo: "🐄 Vaca leiteira", sub: "sustentar", cx: M.left + pw * 0.25, cy: M.top + ph / 2 + 16, bg: "#eef4f9" },
    { rotulo: "🍍 Abacaxi", sub: "repensar", cx: M.left + pw * 0.75, cy: M.top + ph / 2 + 16, bg: "#fbf1f0" },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Matriz BCG: participação de mercado × crescimento"
        style={{ width: "100%", maxWidth: 720, display: "block", margin: "0 auto" }}>
        {/* fundos dos quadrantes (regiões, com rótulo em texto — a cor é reforço) */}
        <rect x={M.left} y={M.top} width={pw / 2} height={ph / 2} fill={quadrantes[0].bg} />
        <rect x={M.left + pw / 2} y={M.top} width={pw / 2} height={ph / 2} fill={quadrantes[1].bg} />
        <rect x={M.left} y={M.top + ph / 2} width={pw / 2} height={ph / 2} fill={quadrantes[2].bg} />
        <rect x={M.left + pw / 2} y={M.top + ph / 2} width={pw / 2} height={ph / 2} fill={quadrantes[3].bg} />

        {/* moldura e divisórias (recessivas) */}
        <rect x={M.left} y={M.top} width={pw} height={ph} fill="none" stroke="#dce6ee" />
        <line x1={M.left + pw / 2} y1={M.top} x2={M.left + pw / 2} y2={M.top + ph} stroke="#c6d3de" strokeDasharray="4 4" />
        <line x1={M.left} y1={M.top + ph / 2} x2={M.left + pw} y2={M.top + ph / 2} stroke="#c6d3de" strokeDasharray="4 4" />

        {/* rótulos dos quadrantes */}
        {quadrantes.map((q) => (
          <g key={q.rotulo}>
            <text x={q.cx} y={q.cy} textAnchor="middle" fontSize={13} fontWeight={800} fill="#46586a">{q.rotulo}</text>
            <text x={q.cx} y={q.cy + 14} textAnchor="middle" fontSize={10.5} fill="#8493a0">{q.sub}</text>
          </g>
        ))}

        {/* eixos */}
        <text x={M.left + pw / 2} y={H - 12} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#5b6b78">
          Participação de mercado — alta ← → baixa
        </text>
        <text x={16} y={M.top + ph / 2} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#5b6b78"
          transform={`rotate(-90 16 ${M.top + ph / 2})`}>
          Crescimento do mercado — baixo → alto
        </text>
        <text x={M.left} y={M.top + ph + 16} fontSize={10} fill="#8493a0">100</text>
        <text x={M.left + pw} y={M.top + ph + 16} textAnchor="end" fontSize={10} fill="#8493a0">0</text>
        <text x={M.left - 8} y={M.top + 8} textAnchor="end" fontSize={10} fill="#8493a0">100</text>
        <text x={M.left - 8} y={M.top + ph} textAnchor="end" fontSize={10} fill="#8493a0">0</text>

        {/* pontos: marca única da marca com anel branco; nome em cor de texto */}
        {itens.map((i) => {
          const cx = x(i.participacao), cy = y(i.crescimento);
          const nomeADireita = cx < M.left + pw - 90;
          return (
            <g key={i.id}>
              {/* alvo de hover maior que a marca */}
              <circle cx={cx} cy={cy} r={14} fill="transparent">
                <title>{`${i.nome} — participação ${i.participacao} · crescimento ${i.crescimento} (${ROTULO_QUADRANTE[quadranteBcg(i.participacao, i.crescimento)]})`}</title>
              </circle>
              <circle cx={cx} cy={cy} r={7} fill={BLUE} stroke="#fff" strokeWidth={2} pointerEvents="none" />
              <text x={nomeADireita ? cx + 11 : cx - 11} y={cy + 4} textAnchor={nomeADireita ? "start" : "end"}
                fontSize={11.5} fontWeight={700} fill={INK} pointerEvents="none">{i.nome}</text>
            </g>
          );
        })}

        {itens.length === 0 && (
          <text x={M.left + pw / 2} y={M.top + ph / 2 + 40} textAnchor="middle" fontSize={12.5} fill="#a2afba" fontStyle="italic">
            Posicione os itens abaixo para vê-los na matriz.
          </text>
        )}
      </svg>
    </div>
  );
}

function LinhaItem({ item: i, run }: { item: ItemBcgDTO; run: (fn: () => Promise<unknown>) => void }) {
  const [part, setPart] = useState(i.participacao ?? 50);
  const [cresc, setCresc] = useState(i.crescimento ?? 50);
  const definido = i.participacao != null && i.crescimento != null;
  const quad = definido ? quadranteBcg(i.participacao!, i.crescimento!) : null;
  const cor = quad ? COR_QUADRANTE[quad] : null;

  const salvar = (p: number, c: number) => run(() => setEixosItemBcg(i.id, p, c));

  return (
    <div style={{ border: "1px solid #e3ebf1", borderRadius: 10, padding: "10px 12px", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, color: INK, fontSize: 13.5, minWidth: 120 }}>{i.nome}</span>
        {quad && cor
          ? <span style={{ fontSize: 11, fontWeight: 800, color: cor.fg, background: cor.bg, padding: "3px 10px", borderRadius: 999 }}>{ROTULO_QUADRANTE[quad]}</span>
          : <span style={{ fontSize: 11.5, fontWeight: 700, color: "#d98a00", background: "#fdf3e0", padding: "3px 10px", borderRadius: 999 }}>posicione os eixos</span>}
        <button onClick={() => run(() => removerItemBcg(i.id))} aria-label={`Remover ${i.nome}`}
          style={{ marginLeft: "auto", border: "none", background: "transparent", color: "#c0ccd6", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "6px 18px", marginTop: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 105, fontSize: 12, color: "#5b6b78", fontWeight: 600 }}>Participação</span>
          <input type="range" min={0} max={100} step={10} value={part}
            onChange={(e) => setPart(Number(e.target.value))}
            onMouseUp={() => salvar(part, cresc)} onTouchEnd={() => salvar(part, cresc)}
            style={{ flex: 1, accentColor: BLUE }} />
          <span style={{ width: 30, textAlign: "right", fontWeight: 800, color: BLUE, fontVariantNumeric: "tabular-nums", fontSize: 12.5 }}>{part}</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 105, fontSize: 12, color: "#5b6b78", fontWeight: 600 }}>Crescimento</span>
          <input type="range" min={0} max={100} step={10} value={cresc}
            onChange={(e) => setCresc(Number(e.target.value))}
            onMouseUp={() => salvar(part, cresc)} onTouchEnd={() => salvar(part, cresc)}
            style={{ flex: 1, accentColor: BLUE }} />
          <span style={{ width: 30, textAlign: "right", fontWeight: 800, color: BLUE, fontVariantNumeric: "tabular-nums", fontSize: 12.5 }}>{cresc}</span>
        </label>
      </div>
    </div>
  );
}
