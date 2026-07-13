"use client";

import { NIVEIS, type Nivel } from "@/features/assessments/tipos";

// Radar dos 4 níveis. Um polígono; valores 0–100 nos eixos.
// O canvas é maior que o gráfico para os rótulos não serem cortados.
export default function Radar({ valores }: { valores: Record<Nivel, number> }) {
  const W = 330;
  const H = 302;
  const cx = W / 2;
  const cy = H / 2 - 4;
  const r = 96;
  const eixos = NIVEIS.map((n) => n.id);
  const N = eixos.length;

  const ponto = (i: number, valor: number): [number, number] => {
    const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
    const rr = (r * valor) / 100;
    return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
  };
  const labelPos = (i: number): [number, number] => {
    const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
    return [cx + (r + 22) * Math.cos(ang), cy + (r + 22) * Math.sin(ang)];
  };

  const poly = eixos.map((id, i) => ponto(i, valores[id] ?? 0).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="Radar dos quatro níveis">
      {/* grades concêntricas */}
      {[25, 50, 75, 100].map((g) => (
        <polygon key={g}
          points={eixos.map((_, i) => ponto(i, g).join(",")).join(" ")}
          fill="none" stroke="#e3ebf1" strokeWidth="1" />
      ))}
      {/* raios */}
      {eixos.map((_, i) => {
        const [x, y] = ponto(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e3ebf1" strokeWidth="1" />;
      })}
      {/* polígono de valores */}
      <polygon points={poly} fill="#0068a9" fillOpacity="0.18" stroke="#0068a9" strokeWidth="2" />
      {eixos.map((id, i) => {
        const [x, y] = ponto(i, valores[id] ?? 0);
        return <circle key={id} cx={x} cy={y} r="3.5" fill="#0068a9" />;
      })}
      {/* rótulos */}
      {NIVEIS.map((n, i) => {
        const [x, y] = labelPos(i);
        return (
          <text key={n.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#46586a">
            {n.titulo}
            <tspan x={x} dy="13" fontSize="10.5" fill={n.cor} fontWeight="800">{Math.round(valores[n.id] ?? 0)}%</tspan>
          </text>
        );
      })}
    </svg>
  );
}
