// Linha de evolução da maturidade média da empresa por fechamento de
// ciclo (server component — SVG estático com tooltips nativos).
// O ponto "hoje" (média ao vivo) entra tracejado no fim da série.
import type { PontoHistorico } from "@/features/governanca/tipos";

const BLUE = "#0068a9", INK = "#0e1a24";

export default function EvolucaoChart({
  historico,
  mediaAtual,
}: {
  historico: PontoHistorico[];
  mediaAtual: number;
}) {
  if (historico.length === 0) {
    return (
      <p style={{ fontSize: 12.5, color: "#8493a0", margin: 0 }}>
        Sem histórico ainda: a evolução aparece aqui a cada <b>fechamento de ciclo</b> (Parâmetros → “Fechar ciclo agora”).
        Maturidade atual da empresa: <b style={{ color: BLUE }}>{mediaAtual}%</b>.
      </p>
    );
  }

  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  const pontos: (PontoHistorico & { hoje?: boolean })[] = [
    ...historico,
    { data: new Date().toISOString().slice(0, 10), media: mediaAtual, hoje: true },
  ];

  const W = 560, H = 210, M = { top: 22, right: 34, bottom: 30, left: 34 };
  const pw = W - M.left - M.right, ph = H - M.top - M.bottom;
  const n = pontos.length;
  const x = (i: number) => M.left + (n === 1 ? pw / 2 : (i / (n - 1)) * pw);
  const y = (v: number) => M.top + ((100 - v) / 100) * ph;

  const caminho = pontos.slice(0, historico.length).map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.media)}`).join(" ");
  const iUltimo = historico.length - 1;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Evolução da maturidade média da empresa"
        style={{ width: "100%", maxWidth: 620, display: "block" }}>
        {/* grade recessiva */}
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={M.left} y1={y(g)} x2={M.left + pw} y2={y(g)} stroke="#eef4f9" />
            <text x={M.left - 6} y={y(g) + 3} textAnchor="end" fontSize={9.5} fill="#a2afba">{g}</text>
          </g>
        ))}

        {/* série fechada */}
        {historico.length > 1 && <path d={caminho} fill="none" stroke={BLUE} strokeWidth={2} />}
        {/* trecho tracejado até o "hoje" */}
        <line x1={x(iUltimo)} y1={y(historico[iUltimo].media)} x2={x(n - 1)} y2={y(mediaAtual)}
          stroke={BLUE} strokeWidth={2} strokeDasharray="5 4" opacity={0.7} />

        {pontos.map((p, i) => (
          <g key={`${p.data}-${i}`}>
            <circle cx={x(i)} cy={y(p.media)} r={12} fill="transparent">
              <title>{`${p.hoje ? "Hoje (ao vivo)" : `Ciclo fechado em ${fmt(p.data)}`}: ${p.media}%`}</title>
            </circle>
            <circle cx={x(i)} cy={y(p.media)} r={4.5} fill={p.hoje ? "#fff" : BLUE} stroke={p.hoje ? BLUE : "#fff"} strokeWidth={2} pointerEvents="none" />
            <text x={x(i)} y={y(p.media) - 10} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={INK} pointerEvents="none">
              {Math.round(p.media)}
            </text>
            <text x={x(i)} y={M.top + ph + 16} textAnchor="middle" fontSize={9.5} fill="#8493a0">
              {p.hoje ? "hoje" : fmt(p.data)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
