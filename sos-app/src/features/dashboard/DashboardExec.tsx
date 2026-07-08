import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/logout-action";
import { grauMaturidade, ROTULO_MATURIDADE } from "@/domain/maturidade";
import { NIVEIS } from "@/features/assessments/tipos";
import Radar from "./Radar";
import type { DadosDashboard } from "./queries";

// Cor sequencial de maturidade (claro→escuro no azul da marca).
// O número aparece em toda célula, então a cor é reforço, não a única info.
function corCelula(v: number): { bg: string; fg: string } {
  if (v <= 0) return { bg: "#f0f4f8", fg: "#a2afba" };
  if (v < 40) return { bg: "#fbe4e2", fg: "#8a2a22" };
  if (v < 65) return { bg: "#fde7cf", fg: "#8a5a08" };
  if (v < 85) return { bg: "#d7e8f4", fg: "#0e4a70" };
  return { bg: "#cfe9d2", fg: "#1f5b28" };
}

export default function DashboardExec({
  usuarioNome,
  dados,
}: {
  usuarioNome: string | null;
  dados: DadosDashboard;
}) {
  const grauEmpresa = grauMaturidade(dados.mediaEmpresa);

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 1160, margin: "0 auto 24px", display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <Image src="/steelbras-logo.svg" alt="Steelbras" width={130} height={47} style={{ height: 34, width: "auto" }} priority />
          <h1 style={{ fontSize: "clamp(22px,3.4vw,32px)", fontWeight: 800, margin: "12px 0 4px", color: "#0e1a24" }}>NEXO · Dashboard executivo</h1>
          <p style={{ margin: 0, color: "#5b6b78", fontSize: 15 }}>Visão consolidada da maturidade de gestão por área.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>Setores</Link>
          {usuarioNome && (
            <>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#46586a" }}>{usuarioNome}</span>
              <form action={logoutAction}><button type="submit" style={{ border: "1px solid #d9e2ea", background: "#fff", color: "#5b6b78", fontWeight: 700, fontSize: 12, padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>Sair</button></form>
            </>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gap: 16 }}>
        {/* Linha 1: hero + radar + pendências */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1fr", gap: 16 }}>
          <Card>
            <Titulo>Maturidade da empresa</Titulo>
            <div style={{ fontSize: 52, fontWeight: 800, color: "#0068a9", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{dados.mediaEmpresa}%</div>
            <span style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 800, color: "#fff", background: "#0068a9", padding: "3px 10px", borderRadius: 999 }}>{ROTULO_MATURIDADE[grauEmpresa]}</span>
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#8493a0" }}>Média de {dados.setores.length} áreas avaliadas.</p>
          </Card>
          <Card>
            <Titulo>Radar dos 4 níveis</Titulo>
            <Radar valores={dados.radarEmpresa} />
          </Card>
          <Card>
            <Titulo>Pendências</Titulo>
            <div style={{ fontSize: 52, fontWeight: 800, color: dados.totalPendencias > 0 ? "#d98a00" : "#33853a", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{dados.totalPendencias}</div>
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#8493a0" }}>Critérios ainda não respondidos em todas as áreas.</p>
          </Card>
        </div>

        {/* Heatmap setores × níveis */}
        <Card>
          <Titulo>Maturidade por setor e nível</Titulo>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4, minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: 12, color: "#8493a0", fontWeight: 700, padding: "4px 8px" }}>Setor</th>
                  {NIVEIS.map((n) => (
                    <th key={n.id} style={{ fontSize: 11.5, color: "#8493a0", fontWeight: 700, padding: "4px 8px", textAlign: "center" }}>{n.titulo}</th>
                  ))}
                  <th style={{ fontSize: 11.5, color: "#46586a", fontWeight: 800, padding: "4px 8px", textAlign: "center" }}>Geral</th>
                </tr>
              </thead>
              <tbody>
                {dados.setores.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontSize: 13.5, fontWeight: 700, color: "#0e1a24", padding: "6px 8px", whiteSpace: "nowrap" }}>
                      <Link href={`/setor/${s.id}`} style={{ color: "inherit", textDecoration: "none" }}>{s.nome}</Link>
                    </td>
                    {NIVEIS.map((n) => {
                      const v = Math.round(s.porNivel[n.id]);
                      const c = corCelula(v);
                      return (
                        <td key={n.id} style={{ textAlign: "center", background: c.bg, color: c.fg, fontWeight: 800, fontSize: 13, borderRadius: 8, padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{v}</td>
                      );
                    })}
                    {(() => { const c = corCelula(Math.round(s.geral)); return (
                      <td style={{ textAlign: "center", background: c.bg, color: c.fg, fontWeight: 800, fontSize: 13.5, borderRadius: 8, padding: "10px 8px", fontVariantNumeric: "tabular-nums", border: "2px solid #fff", outline: "1px solid #e3ebf1" }}>{Math.round(s.geral)}</td>
                    ); })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "#8493a0" }}>Clique num setor para abrir a avaliação. Cores: vermelho (inicial) → verde (referência).</p>
        </Card>

        {/* Ranking / comparação */}
        <Card>
          <Titulo>Comparação de áreas</Titulo>
          <div style={{ display: "grid", gap: 8 }}>
            {dados.setores.map((s, i) => {
              const c = corCelula(Math.round(s.geral));
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 20, fontSize: 13, fontWeight: 800, color: "#8493a0", textAlign: "right" }}>{i + 1}</span>
                  <span style={{ width: 110, fontSize: 13.5, fontWeight: 700, color: "#0e1a24" }}>{s.nome}</span>
                  <div style={{ flex: 1, height: 14, background: "#eef4f9", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${s.geral}%`, height: "100%", background: c.fg, transition: "width .4s" }} />
                  </div>
                  <span style={{ width: 42, fontSize: 13, fontWeight: 800, color: c.fg, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Math.round(s.geral)}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(14,26,36,.06)" }}>{children}</div>;
}
function Titulo({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#8493a0", marginBottom: 12 }}>{children}</div>;
}
