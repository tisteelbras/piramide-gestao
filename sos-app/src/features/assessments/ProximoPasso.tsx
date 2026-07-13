import Link from "next/link";
import { maiorLacuna } from "@/domain/proximo-passo";
import { cor } from "@/design/tokens";
import type { Nivel } from "./tipos";

// Faixa "o que fazer agora?" no topo do setor. Aponta a maior lacuna de
// maturidade e leva direto para avaliá-la. Remove a fricção de decisão:
// o gestor não precisa interpretar a pirâmide sozinho.
export default function ProximoPasso({
  setorId,
  porNivel,
}: {
  setorId: string;
  porNivel: Record<Nivel, number>;
}) {
  const lacuna = maiorLacuna(porNivel);

  // Tudo completo: mensagem de conclusão, sem chamada para ação.
  if (!lacuna) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: cor.successBg,
          border: "1px solid #cfe8d2",
          borderRadius: 14,
          padding: "14px 18px",
          marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 22 }} aria-hidden>
          ✅
        </span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: cor.greenDark }}>
            Diagnóstico completo
          </div>
          <div style={{ fontSize: 13, color: cor.success }}>
            Todos os níveis foram avaliados. Reavalie periodicamente para acompanhar a evolução.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        background: "#fff",
        border: `1px solid ${lacuna.cor}33`,
        borderLeft: `5px solid ${lacuna.cor}`,
        borderRadius: 14,
        padding: "14px 18px",
        marginBottom: 18,
        boxShadow: "0 8px 24px rgba(14,26,36,.06)",
      }}
    >
      <span style={{ fontSize: 22 }} aria-hidden>
        🎯
      </span>
      <div style={{ flex: "1 1 260px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: cor.faint, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Sua maior lacuna
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: cor.ink }}>
          {lacuna.titulo}{" "}
          <span style={{ color: lacuna.corDark, fontVariantNumeric: "tabular-nums" }}>
            ({lacuna.preenchido}%)
          </span>{" "}
          <span style={{ fontSize: 13, fontWeight: 600, color: cor.faint }}>
            — faltam {lacuna.faltando}% para completar
          </span>
        </div>
      </div>
      <Link
        href={`/setor/${setorId}/avaliar#${lacuna.nivel}`}
        style={{
          textDecoration: "none",
          fontSize: 13.5,
          fontWeight: 800,
          color: "#fff",
          background: lacuna.cor,
          padding: "10px 18px",
          borderRadius: 10,
          boxShadow: `0 4px 12px ${lacuna.cor}40`,
          whiteSpace: "nowrap",
        }}
      >
        Avaliar agora →
      </Link>
    </div>
  );
}
