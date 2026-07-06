"use client";

import { LEVELS } from "@/lib/sos-data";

function tierPath(i: number, total: number, W: number, H: number) {
  const gap = 6;
  const th = (H - gap * (total - 1)) / total;
  const top = i * (th + gap);
  const bottom = top + th;
  const half = W / 2;
  const wTop = (i / total) * W;
  const wBot = ((i + 1) / total) * W;
  if (i === 0)
    return {
      poly: `${half},${top} ${half + wBot / 2},${bottom} ${half - wBot / 2},${bottom}`,
      cy: top + th * 0.62,
      top,
      bottom,
    };
  return {
    poly: `${half - wTop / 2},${top} ${half + wTop / 2},${top} ${half + wBot / 2},${bottom} ${half - wBot / 2},${bottom}`,
    cy: top + th / 2,
    top,
    bottom,
  };
}

type PyramidProps = {
  open: number | null;
  onSelect: (index: number | null) => void;
};

export default function Pyramid({ open, onSelect }: PyramidProps) {
  const W = 520;
  const H = 460;
  const total = LEVELS.length;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H + 30}`}
        width="100%"
        role="group"
        aria-label="Pirâmide de gestão"
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          {LEVELS.map((l, i) => (
            <linearGradient id={`grad${i}`} key={i} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={l.color} />
              <stop offset="1" stopColor={l.dark} />
            </linearGradient>
          ))}
          <filter id="drop" x="-30%" y="-10%" width="160%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0068a9" floodOpacity="0.22" />
          </filter>
        </defs>
        <ellipse cx={W / 2} cy={H + 14} rx={W / 2 + 6} ry="16" fill="#0068a9" opacity="0.10" />
        {LEVELS.map((l, i) => {
          const g = tierPath(i, total, W, H);
          const isOpen = open === i;
          return (
            <g
              key={l.id}
              className="tier cursor-pointer transition-transform duration-300 hover:brightness-110 focus-visible:outline-3 focus-visible:outline-brand-ink"
              tabIndex={0}
              role="button"
              aria-pressed={isOpen}
              aria-label={`${l.n} ${l.title} — ${l.tag}`}
              onClick={() => onSelect(isOpen ? null : i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(isOpen ? null : i);
                }
              }}
              style={{ transform: isOpen ? "translateX(16px)" : "none" }}
              filter={isOpen ? "url(#drop)" : undefined}
            >
              <polygon
                points={
                  i === 0
                    ? `${W / 2},${g.top} ${W / 2 + ((i + 1) / total) * (W / 2)},${g.bottom} ${W / 2 + ((i + 1) / total) * (W / 2) + 12},${g.bottom - 6} ${W / 2 + 8},${g.top}`
                    : `${W / 2 + (i / total) * (W / 2)},${g.top} ${W / 2 + ((i + 1) / total) * (W / 2)},${g.bottom} ${W / 2 + ((i + 1) / total) * (W / 2) + 12},${g.bottom - 6} ${W / 2 + (i / total) * (W / 2) + 12},${g.top - 6}`
                }
                fill={l.dark}
                opacity="0.85"
              />
              <polygon points={g.poly} fill={`url(#grad${i})`} stroke="#fff" strokeWidth="1.5" />
              <text
                x={W / 2}
                y={g.cy - (i === 0 ? -4 : 6)}
                textAnchor="middle"
                fontSize={i === 0 ? 13 : 17}
                fontWeight="800"
                fill="#fff"
                style={{ pointerEvents: "none" }}
              >
                {l.n} {l.title}
              </text>
              {i !== 0 && (
                <text
                  x={W / 2}
                  y={g.cy + 13}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="600"
                  fill="#fff"
                  fillOpacity="0.82"
                  style={{ pointerEvents: "none" }}
                >
                  {l.tag}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="text-center text-[12.5px] text-faint mt-1">Toque em um nível para abrir</p>
    </div>
  );
}
