// Relatório executivo consolidado — 1 página imprimível para a reunião
// de diretoria: maturidade geral, evolução, ciclos, metas e prioridades.
// Sempre renderizado na hora (dados ao vivo, nunca congelados no build).
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { papelDoUsuario } from "@/features/governanca/queries";
import { montarRelatorioExecutivo } from "@/features/pdf-export/queries-executivo";
import BotaoImprimir from "@/features/pdf-export/BotaoImprimir";
import EvolucaoChart from "@/features/dashboard/EvolucaoChart";
import { grauMaturidade, ROTULO_MATURIDADE } from "@/domain/maturidade";
import { NIVEIS } from "@/features/assessments/tipos";
import { ROTULO_ESTADO } from "@/features/governanca/tipos";

const PRIO_COR: Record<number, string> = { 1: "#c0392b", 2: "#d98a00", 3: "#0068a9", 4: "#5b6b78", 5: "#8493a0" };
const COR_ESTADO: Record<string, string> = { em_dia: "#33853a", alerta: "#8a5a08", atrasada: "#c0392b" };

export default async function RelatorioExecutivoPage() {
  // Relatório de TODAS as áreas — só admin/direção. Líder volta para a home.
  const session = await auth();
  const perfil = await papelDoUsuario(session?.user?.id);
  if (perfil?.papel === "lider") redirect("/");

  const rel = await montarRelatorioExecutivo();
  const grau = grauMaturidade(rel.dashboard.mediaEmpresa);
  const dataFmt = rel.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const cicloDe = (id: string) => rel.governanca.ciclos.find((c) => c.setorId === id);

  return (
    <div style={{ background: "#fff", color: "#0e1a24", minHeight: "100vh" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 14mm; }
          .rel-bloco { break-inside: avoid; }
        }
        .rel-wrap { max-width: 900px; margin: 0 auto; padding: 40px 32px 80px; font-family: 'Montserrat', system-ui, sans-serif; }
      `}</style>

      <div className="rel-wrap">
        <div className="no-print" style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <Link href="/" style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", padding: "10px 14px", borderRadius: 10 }}>‹ Dashboard</Link>
          <BotaoImprimir />
          <span style={{ alignSelf: "center", fontSize: 12.5, color: "#8493a0" }}>Use “Salvar em PDF” na janela de impressão.</span>
        </div>

        <header style={{ borderBottom: "3px solid #0068a9", paddingBottom: 18, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#0068a9", letterSpacing: "-.01em" }}>NEXO</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#8493a0" }}>Conectar. Executar. Evoluir.</span>
            <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 800, color: "#0068a9" }}>Steel<span style={{ color: "#47ad4b" }}>bras</span></span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "10px 0 2px" }}>Relatório Executivo de Maturidade — {rel.empresaNome}</h1>
          <p style={{ margin: 0, color: "#5b6b78", fontSize: 14 }}>Emitido em {dataFmt} · {rel.dashboard.setores.length} áreas avaliadas</p>
        </header>

        {/* Resumo */}
        <section className="rel-bloco" style={{ display: "flex", gap: 20, alignItems: "center", background: "#f4f8fb", borderRadius: 14, padding: 20, marginBottom: 26 }}>
          <div style={{ textAlign: "center", minWidth: 130 }}>
            <div style={{ fontSize: 46, fontWeight: 800, color: "#0068a9", lineHeight: 1 }}>{rel.dashboard.mediaEmpresa}%</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: "#0068a9", padding: "3px 10px", borderRadius: 999, display: "inline-block", marginTop: 6 }}>{ROTULO_MATURIDADE[grau]}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#8493a0", marginBottom: 6 }}>Resumo executivo</div>
            <p style={{ margin: 0, fontSize: 14, color: "#46586a", lineHeight: 1.5 }}>
              A maturidade média da empresa é <b>{rel.dashboard.mediaEmpresa}%</b>, com meta padrão de <b>{rel.governanca.politica.metaPadrao}%</b> e
              reavaliação a cada <b>{rel.governanca.politica.periodicidadeDias} dias</b>. {rel.dashboard.totalPendencias > 0 && <>Há <b>{rel.dashboard.totalPendencias}</b> pendências de preenchimento.</>}
            </p>
          </div>
        </section>

        {/* Evolução */}
        <section className="rel-bloco" style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", borderBottom: "2px solid #e3ebf1", paddingBottom: 6 }}>Evolução da maturidade</h2>
          <EvolucaoChart historico={rel.governanca.historico} mediaAtual={rel.dashboard.mediaEmpresa} />
        </section>

        {/* Setores × níveis + ciclo/meta */}
        <section className="rel-bloco" style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", borderBottom: "2px solid #e3ebf1", paddingBottom: 6 }}>Maturidade por área</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e3ebf1" }}>
                <th style={{ textAlign: "left", padding: "6px 4px", color: "#8493a0", fontSize: 11, textTransform: "uppercase" }}>Área</th>
                {NIVEIS.map((n) => <th key={n.id} style={{ textAlign: "center", padding: "6px 4px", color: "#8493a0", fontSize: 11, textTransform: "uppercase" }}>{n.titulo}</th>)}
                {["Geral", "Meta", "Tendência", "Ciclo"].map((h) => <th key={h} style={{ textAlign: "center", padding: "6px 4px", color: "#8493a0", fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rel.dashboard.setores.map((s) => {
                const c = cicloDe(s.id);
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid #eef2f6" }}>
                    <td style={{ padding: "7px 4px", fontWeight: 700 }}>{s.nome}</td>
                    {NIVEIS.map((n) => <td key={n.id} style={{ textAlign: "center", padding: "7px 4px", fontVariantNumeric: "tabular-nums", color: "#46586a" }}>{Math.round(s.porNivel[n.id])}</td>)}
                    <td style={{ textAlign: "center", padding: "7px 4px", fontWeight: 800, color: "#0068a9", fontVariantNumeric: "tabular-nums" }}>{Math.round(s.geral)}%</td>
                    <td style={{ textAlign: "center", padding: "7px 4px", fontVariantNumeric: "tabular-nums", color: c && s.geral >= c.meta ? "#33853a" : "#8493a0", fontWeight: 700 }}>{c ? `${c.meta}%` : "—"}</td>
                    <td style={{ textAlign: "center", padding: "7px 4px", fontWeight: 800, color: c?.tendencia == null ? "#a2afba" : c.tendencia >= 0 ? "#33853a" : "#c0392b" }}>
                      {c?.tendencia == null ? "—" : c.tendencia >= 0 ? `▲ +${c.tendencia}` : `▼ ${c.tendencia}`}
                    </td>
                    <td style={{ textAlign: "center", padding: "7px 4px", fontWeight: 700, color: c ? COR_ESTADO[c.estado] : "#a2afba", whiteSpace: "nowrap" }}>
                      {c ? ROTULO_ESTADO[c.estado] : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Prioridades */}
        {rel.recomendacoes.length > 0 && (
          <section className="rel-bloco" style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", borderBottom: "2px solid #e3ebf1", paddingBottom: 6 }}>Prioridades da empresa (diagnóstico)</h2>
            <div style={{ display: "grid", gap: 6 }}>
              {rel.recomendacoes.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, borderLeft: `4px solid ${PRIO_COR[r.prioridade] ?? "#0068a9"}`, paddingLeft: 10 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: PRIO_COR[r.prioridade] ?? "#0068a9", padding: "1px 7px", borderRadius: 999 }}>P{r.prioridade}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{r.titulo}</span>
                  <span style={{ fontSize: 11.5, color: "#8493a0", marginLeft: "auto", whiteSpace: "nowrap" }}>{r.setorNome}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ferramentas de apoio */}
        <section className="rel-bloco">
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", borderBottom: "2px solid #e3ebf1", paddingBottom: 6 }}>Ferramentas de apoio em uso</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "#46586a", lineHeight: 1.6 }}>
            <b>5W2H:</b> {rel.ferramentas.planos5w2h} plano(s), {rel.ferramentas.acoesConcluidas}/{rel.ferramentas.acoes5w2h} ações concluídas ·{" "}
            <b>Ishikawa:</b> {rel.ferramentas.analisesIshikawa} análise(s), {rel.ferramentas.causasIshikawa} causas mapeadas ·{" "}
            <b>BCG:</b> {rel.ferramentas.itensBcg} item(ns) no portfólio.
          </p>
        </section>
      </div>
    </div>
  );
}
