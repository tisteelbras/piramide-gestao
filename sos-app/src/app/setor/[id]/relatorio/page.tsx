import { notFound } from "next/navigation";
import Link from "next/link";
import { montarRelatorio } from "@/features/pdf-export/queries";
import BotaoImprimir from "@/features/pdf-export/BotaoImprimir";

const PRIO_COR: Record<number, string> = { 1: "#c0392b", 2: "#d98a00", 3: "#0068a9", 4: "#5b6b78", 5: "#8493a0" };

export default async function RelatorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rel = await montarRelatorio(id);
  if (!rel) notFound();

  const dataFmt = rel.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div style={{ background: "#fff", color: "#0e1a24", minHeight: "100vh" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 16mm; }
          .rel-nivel { break-inside: avoid; }
        }
        .rel-wrap { max-width: 820px; margin: 0 auto; padding: 40px 32px 80px; font-family: 'Montserrat', system-ui, sans-serif; }
      `}</style>

      <div className="rel-wrap">
        <div className="no-print" style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <Link href={`/setor/${id}`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", padding: "10px 14px", borderRadius: 10 }}>‹ Voltar</Link>
          <BotaoImprimir />
          <span style={{ alignSelf: "center", fontSize: 12.5, color: "#8493a0" }}>Use “Salvar em PDF” e escolha o destino “PDF” na janela de impressão.</span>
        </div>

        <header style={{ borderBottom: "3px solid #0068a9", paddingBottom: 18, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#0068a9", letterSpacing: "-.01em" }}>NEXO</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#8493a0" }}>Conectar. Executar. Evoluir.</span>
            <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 800, color: "#0068a9" }}>Steel<span style={{ color: "#47ad4b" }}>bras</span></span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "10px 0 2px" }}>Diagnóstico de Maturidade — {rel.setor}</h1>
          <p style={{ margin: 0, color: "#5b6b78", fontSize: 14 }}>Emitido em {dataFmt}</p>
        </header>

        <section style={{ display: "flex", gap: 20, alignItems: "center", background: "#f4f8fb", borderRadius: 14, padding: 20, marginBottom: 26 }}>
          <div style={{ textAlign: "center", minWidth: 120 }}>
            <div style={{ fontSize: 46, fontWeight: 800, color: "#0068a9", lineHeight: 1 }}>{Math.round(rel.geral)}%</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: "#0068a9", padding: "3px 10px", borderRadius: 999, display: "inline-block", marginTop: 6 }}>{rel.grau}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#8493a0", marginBottom: 6 }}>Resumo executivo</div>
            <p style={{ margin: 0, fontSize: 14, color: "#46586a", lineHeight: 1.5 }}>
              O setor <b>{rel.setor}</b> apresenta maturidade geral de <b>{Math.round(rel.geral)}%</b> ({rel.grau}), medida pela conexão entre Visão, Recursos, Processos e Resultados — o nexo da gestão.
            </p>
          </div>
        </section>

        {rel.niveis.map((n) => (
          <section key={n.id} className="rel-nivel" style={{ marginBottom: 22, borderLeft: `4px solid ${n.cor}`, paddingLeft: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{n.titulo}</h2>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#8493a0", textTransform: "uppercase" }}>{n.tag}</span>
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: n.cor }}>{Math.round(n.pct)}% · {n.grau}</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {n.linhas.map((l, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eef2f6" }}>
                    <td style={{ padding: "6px 4px", color: l.titulo.startsWith("—") ? "#8493a0" : "#46586a" }}>{l.titulo}</td>
                    <td style={{ padding: "6px 4px", textAlign: "right", width: 110, fontWeight: 800, color: l.ok === true ? "#33853a" : l.ok === false ? "#8493a0" : n.cor, fontVariantNumeric: "tabular-nums" }}>{l.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}

        {rel.recomendacoes.length > 0 && (
          <section style={{ marginTop: 30, breakInside: "avoid" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px", borderBottom: "2px solid #e3ebf1", paddingBottom: 6 }}>Plano de ação recomendado</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {rel.recomendacoes.map((r, i) => (
                <div key={i} style={{ border: "1px solid #e3ebf1", borderRadius: 8, padding: "10px 12px", borderLeft: `4px solid ${PRIO_COR[r.prioridade] ?? "#0068a9"}` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: PRIO_COR[r.prioridade] ?? "#0068a9", padding: "2px 7px", borderRadius: 999 }}>P{r.prioridade}</span>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{r.titulo}</span>
                  </div>
                  {r.detalhe && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#5b6b78" }}>{r.detalhe}</p>}
                  {r.impacto && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#33853a", fontWeight: 600 }}>Impacto: {r.impacto}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer style={{ marginTop: 40, paddingTop: 14, borderTop: "1px solid #e3ebf1", fontSize: 11.5, color: "#8493a0", textAlign: "center" }}>
          NEXO — Conectar. Executar. Evoluir. · Metodologia de diagnóstico Steelbras · Relatório gerado automaticamente
        </footer>
      </div>
    </div>
  );
}
