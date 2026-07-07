"use client";

import { NIVEIS, type Nivel } from "@/features/assessments/tipos";

// Pirâmide que se preenche conforme a maturidade de cada nível.
// Cada faixa é desenhada em cinza (vazio) e recebe um "líquido" colorido
// cuja altura corresponde ao preenchimento (0–100).

type Props = {
  preenchimento: Record<Nivel, number>; // 0–100 por nível
  ativo?: Nivel | null;
  onSelect?: (n: Nivel) => void;
};

export default function PiramideMaturidade({ preenchimento, ativo, onSelect }: Props) {
  const W = 460;
  const H = 420;
  const total = NIVEIS.length;
  const gap = 6;
  const th = (H - gap * (total - 1)) / total;
  const half = W / 2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 24}`}
      width="100%"
      role="group"
      aria-label="Pirâmide de maturidade"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <filter id="pmshadow" x="-30%" y="-10%" width="160%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0068a9" floodOpacity="0.18" />
        </filter>
      </defs>
      <ellipse cx={half} cy={H + 10} rx={half} ry="14" fill="#0068a9" opacity="0.08" />

      {NIVEIS.map((nivel, i) => {
        const top = i * (th + gap);
        const bottom = top + th;
        // Largura das bordas superior/inferior da faixa (pirâmide).
        const wTop = (i / total) * W;
        const wBot = ((i + 1) / total) * W;
        const pct = Math.max(0, Math.min(100, preenchimento[nivel.id] ?? 0));
        // Altura preenchida (de baixo para cima dentro da faixa).
        const fillH = (th * pct) / 100;
        const fillTop = bottom - fillH;
        // Largura da faixa na altura fillTop (interpola entre wTop e wBot).
        const wAtFill = wTop + ((wBot - wTop) * (bottom - fillTop)) / th;

        const outline =
          i === 0
            ? `${half},${top} ${half + wBot / 2},${bottom} ${half - wBot / 2},${bottom}`
            : `${half - wTop / 2},${top} ${half + wTop / 2},${top} ${half + wBot / 2},${bottom} ${half - wBot / 2},${bottom}`;

        // Polígono do "líquido" (parte de baixo da faixa até fillTop).
        const fillPoly =
          fillH <= 0
            ? ""
            : fillTop <= top
              ? outline // cheio: usa a faixa toda
              : `${half - wAtFill / 2},${fillTop} ${half + wAtFill / 2},${fillTop} ${half + wBot / 2},${bottom} ${half - wBot / 2},${bottom}`;

        const isAtivo = ativo === nivel.id;
        const cy = top + th * (i === 0 ? 0.66 : 0.5);

        return (
          <g
            key={nivel.id}
            style={{ cursor: onSelect ? "pointer" : "default", transition: "transform .25s" }}
            transform={isAtivo ? "translate(10 0)" : undefined}
            filter={isAtivo ? "url(#pmshadow)" : undefined}
            onClick={() => onSelect?.(nivel.id)}
            tabIndex={onSelect ? 0 : undefined}
            role={onSelect ? "button" : undefined}
            aria-label={`${nivel.titulo} — ${Math.round(pct)}% de maturidade`}
            onKeyDown={(e) => {
              if (onSelect && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelect(nivel.id);
              }
            }}
          >
            {/* fundo vazio */}
            <polygon points={outline} fill="#e8eef4" stroke="#fff" strokeWidth="1.5" />
            {/* líquido preenchido */}
            {fillPoly && (
              <polygon points={fillPoly} fill={nivel.cor} stroke="none" style={{ transition: "all .5s ease" }} />
            )}
            {/* rótulo */}
            <text
              x={half}
              y={cy - 3}
              textAnchor="middle"
              fontSize={i === 0 ? 12 : 15}
              fontWeight="800"
              fill={pct > 45 ? "#fff" : "#0e1a24"}
              style={{ pointerEvents: "none" }}
            >
              {nivel.n} {nivel.titulo}
            </text>
            <text
              x={half}
              y={cy + 14}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill={pct > 45 ? "rgba(255,255,255,.9)" : "#5b6b78"}
              style={{ pointerEvents: "none" }}
            >
              {Math.round(pct)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
