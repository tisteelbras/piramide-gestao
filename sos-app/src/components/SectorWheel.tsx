"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND, type Sector } from "@/lib/sos-data";

const { blue: BLUE, green: GREEN, blueDark: BLUE_D, greenDark: GREEN_D, ink: INK } = BRAND;

const btn = (c: string): React.CSSProperties => ({
  border: "none",
  background: c,
  color: "#fff",
  fontWeight: 700,
  fontSize: 12.5,
  padding: "8px 14px",
  borderRadius: 8,
  cursor: "pointer",
});

type Props = {
  sectors: Sector[];
  locked: boolean;
  onPick: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
};

export default function SectorWheel({ sectors, locked, onPick, onAdd, onRename, onRemove }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const size = 440;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 195;
  const rInner = 78;
  const n = sectors.length;

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  const colorFor = (i: number) => (i % 2 === 0 ? GREEN : BLUE);
  const polar = (r: number, d: number): [number, number] => {
    const a = ((d - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const wedge = (i: number) => {
    const slice = 360 / n;
    const pad = n > 1 ? 2.2 : 0;
    const a0 = i * slice + pad;
    const a1 = (i + 1) * slice - pad;
    const [x0o, y0o] = polar(rOuter, a0);
    const [x1o, y1o] = polar(rOuter, a1);
    const [x0i, y0i] = polar(rInner, a0);
    const [x1i, y1i] = polar(rInner, a1);
    const lg = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0i} ${y0i} L ${x0o} ${y0o} A ${rOuter} ${rOuter} 0 ${lg} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 ${lg} 0 ${x0i} ${y0i} Z`;
  };
  const labelPos = (i: number): [number, number] => {
    const slice = 360 / n;
    const mid = i * slice + slice / 2;
    return polar((rOuter + rInner) / 2, mid);
  };

  const doAdd = () => {
    const v = draft.trim();
    if (v) onAdd(v);
    setDraft("");
    setAdding(false);
  };

  return (
    <div>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        style={{ display: "block", overflow: "visible", maxWidth: 440, margin: "0 auto" }}
        role="group"
        aria-label="Roda de setores"
      >
        <defs>
          <radialGradient id="hubg" cx="45%" cy="40%" r="70%">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#eef4f9" />
          </radialGradient>
          <filter id="wsh" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0068a9" floodOpacity="0.20" />
          </filter>
        </defs>
        {sectors.map((s, i) => {
          const isSel = selected === i;
          const [lx, ly] = labelPos(i);
          const slice = 360 / n;
          const mid = i * slice + slice / 2;
          const rot = mid > 180 ? mid - 270 : mid - 90;
          const [ox, oy] = polar(12, mid);
          return (
            <g
              key={s.id}
              style={{ cursor: "pointer" }}
              onClick={() => (locked ? onPick(s.id) : setSelected(isSel ? null : i))}
              onDoubleClick={() => onPick(s.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick(s.id);
                }
              }}
              role="button"
              aria-label={`Setor ${s.name}. Abrir checklist`}
            >
              <path
                d={wedge(i)}
                fill={colorFor(i)}
                stroke="#fff"
                strokeWidth="2.5"
                style={{
                  transition: "transform .25s cubic-bezier(.34,1.4,.5,1), filter .2s",
                  transform: isSel ? `translate(${ox - cx}px,${oy - cy}px)` : "none",
                  filter: isSel ? "url(#wsh) brightness(1.08)" : "none",
                }}
              />
              <text
                x={lx}
                y={ly}
                fill="#fff"
                fontSize="13.5"
                fontWeight="800"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${rot} ${lx} ${ly})`}
                style={{ pointerEvents: "none" }}
              >
                {s.name.length > 13 ? s.name.slice(0, 12) + "…" : s.name}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={rInner} fill="url(#hubg)" stroke={BLUE} strokeWidth="3" />
        <circle
          cx={cx}
          cy={cy}
          r={rInner - 9}
          fill="none"
          stroke={GREEN}
          strokeWidth="1.5"
          strokeDasharray="3 5"
          opacity="0.6"
        />
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize="15" fontWeight="800" fill={BLUE_D}>
          PLANNER
        </text>
        <text x={cx} y={cy + 9} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={GREEN_D}>
          onde eu atuo
        </text>
        <text x={cx} y={cy + 27} textAnchor="middle" fontSize="10" fill="#8493a0">
          {n} setores
        </text>
      </svg>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
        {!locked && selected != null && sectors[selected] && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#f4f8fb", borderRadius: 12, padding: "8px 10px" }}>
            <input
              value={sectors[selected].name}
              onChange={(e) => onRename(sectors[selected].id, e.target.value)}
              style={{ border: `2px solid ${colorFor(selected)}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, fontWeight: 700, color: INK, width: 140 }}
            />
            <button onClick={() => onPick(sectors[selected].id)} style={btn(colorFor(selected))}>
              Abrir
            </button>
            <button
              onClick={() => {
                onRemove(sectors[selected].id);
                setSelected(null);
              }}
              style={btn("#e5484d")}
            >
              Remover
            </button>
            <button onClick={() => setSelected(null)} style={btn("#8493a0")}>
              Ok
            </button>
          </div>
        )}
        {!locked &&
          (adding ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#f4f8fb", borderRadius: 12, padding: "8px 10px" }}>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") doAdd();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setDraft("");
                  }
                }}
                placeholder="Nome do setor"
                style={{ border: `2px solid ${GREEN}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, fontWeight: 700, color: INK, width: 150 }}
              />
              <button onClick={doAdd} style={btn(GREEN)}>
                Adicionar
              </button>
            </div>
          ) : (
            selected == null && (
              <button onClick={() => setAdding(true)} style={{ ...btn(BLUE), padding: "10px 18px" }}>
                + Adicionar setor
              </button>
            )
          ))}
      </div>
      <p style={{ textAlign: "center", fontSize: 12.5, color: "#8493a0", marginTop: 8 }}>
        {locked ? "Clique numa fatia para abrir o checklist." : "1 clique: editar setor · 2 cliques: abrir checklist."}
      </p>
    </div>
  );
}
