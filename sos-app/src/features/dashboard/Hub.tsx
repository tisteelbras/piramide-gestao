import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/logout-action";
import AddSetor from "./AddSetor";
import { grauMaturidade, ROTULO_MATURIDADE } from "@/domain/maturidade";
import type { ResumoSetor } from "@/features/assessments/queries-resumo";
import { ROTULO_ESTADO, type CicloSetor } from "@/features/governanca/tipos";

const CORES_MATUR: Record<string, string> = {
  inicial: "#c0392b",
  em_desenvolvimento: "#d98a00",
  consolidado: "#0068a9",
  referencia: "#33853a",
};
const COR_ESTADO: Record<string, { bg: string; fg: string }> = {
  em_dia: { bg: "#eef7ef", fg: "#33853a" },
  alerta: { bg: "#fdf3e0", fg: "#8a5a08" },
  atrasada: { bg: "#fdecea", fg: "#c0392b" },
};

export default function Hub({
  usuarioNome,
  setores,
  ciclos,
  mostrarConfiguracoes,
}: {
  usuarioNome: string | null;
  setores: ResumoSetor[];
  // Situação do ciclo de avaliação por setor (opcional — sem ela o
  // card renderiza como antes).
  ciclos?: CicloSetor[];
  mostrarConfiguracoes?: boolean;
}) {
  const cicloDe = (setorId: string) => ciclos?.find((c) => c.setorId === setorId);
  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header
        style={{
          maxWidth: 1160,
          margin: "0 auto 28px",
          display: "flex",
          alignItems: "flex-end",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Image src="/steelbras-logo.svg" alt="Steelbras" width={130} height={47} style={{ height: 34, width: "auto" }} priority />
          </div>
          <h1 style={{ fontSize: "clamp(24px,3.6vw,38px)", fontWeight: 800, margin: "12px 0 2px", color: "#0e1a24", letterSpacing: "-.01em" }}>
            NEXO
          </h1>
          <p style={{ margin: 0, color: "#5b6b78", fontSize: 15 }}>
            <b style={{ color: "#0068a9" }}>Conectar. Executar. Evoluir.</b> · Escolha um setor para diagnosticar a maturidade da gestão.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {mostrarConfiguracoes && (
            <Link href="/configuracoes" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>⚙ Parâmetros</Link>
          )}
          <Link href="/ferramentas" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>🧰 Ferramentas</Link>
          <Link href="/dashboard" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#fff", background: "#0068a9", padding: "9px 14px", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,104,169,.25)" }}>▤ Dashboard</Link>
          {usuarioNome && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/conta" style={{ fontSize: 12.5, fontWeight: 700, color: "#46586a", textDecoration: "none" }}>{usuarioNome}</Link>
            <form action={logoutAction}>
              <button
                type="submit"
                style={{ border: "1px solid #d9e2ea", background: "#fff", color: "#5b6b78", fontWeight: 700, fontSize: 12, padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}
              >
                Sair
              </button>
            </form>
          </div>
          )}
        </div>
      </header>

      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {setores.map((s) => {
          const grau = grauMaturidade(s.geral);
          const cor = CORES_MATUR[grau];
          return (
            <Link
              key={s.id}
              href={`/setor/${s.id}`}
              style={{
                textDecoration: "none",
                background: "#fff",
                border: "1px solid #e3ebf1",
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 10px 30px rgba(14,26,36,.06)",
                display: "block",
                transition: "transform .15s, box-shadow .15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: "#0e1a24" }}>{s.nome}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#fff",
                    background: cor,
                    padding: "3px 9px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  {ROTULO_MATURIDADE[grau]}
                </span>
              </div>
              {/* barra de maturidade */}
              <div style={{ height: 10, background: "#eef4f9", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${s.geral}%`, height: "100%", background: cor, transition: "width .5s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 12.5, color: "#8493a0", fontWeight: 600 }}>
                  {s.temAvaliacao ? "Maturidade" : "Não avaliado"}
                </span>
                <span style={{ fontSize: 15, fontWeight: 800, color: cor, fontVariantNumeric: "tabular-nums" }}>
                  {Math.round(s.geral)}%
                </span>
              </div>
              {(() => {
                const c = cicloDe(s.id);
                if (!c) return null;
                const ce = COR_ESTADO[c.estado];
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: ce.fg, background: ce.bg, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
                      {c.estado === "em_dia"
                        ? `${ROTULO_ESTADO.em_dia} · vence em ${c.diasRestantes}d`
                        : c.estado === "alerta"
                          ? `Vence em ${c.diasRestantes}d`
                          : `Atrasada há ${-c.diasRestantes}d`}
                    </span>
                    {c.tendencia != null && (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: c.tendencia >= 0 ? "#33853a" : "#c0392b", whiteSpace: "nowrap" }}>
                        {c.tendencia >= 0 ? `▲ +${c.tendencia}` : `▼ ${c.tendencia}`} vs. ciclo anterior
                      </span>
                    )}
                  </div>
                );
              })()}
            </Link>
          );
        })}
        <AddSetor />
      </div>
    </div>
  );
}
