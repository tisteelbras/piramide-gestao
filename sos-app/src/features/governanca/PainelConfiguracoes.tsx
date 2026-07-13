"use client";

import { useState, useTransition } from "react";
import { salvarPolitica, salvarMetaSetor, fecharCiclo } from "./actions";
import { ROTULO_ESTADO, type GovernancaDTO } from "./tipos";

const BLUE = "#0068a9", GREEN = "#47ad4b", INK = "#0e1a24";
const COR_ESTADO: Record<string, { bg: string; fg: string }> = {
  em_dia: { bg: "#eef7ef", fg: "#33853a" },
  alerta: { bg: "#fdf3e0", fg: "#8a5a08" },
  atrasada: { bg: "#fdecea", fg: "#c0392b" },
};
const inputStyle: React.CSSProperties = { border: "1px solid #dce6ee", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: INK, width: 90 };

export default function PainelConfiguracoes({ dados }: { dados: GovernancaDTO }) {
  const [pol, setPol] = useState(dados.politica);
  const [salvandoPol, setSalvandoPol] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn(); });

  const salvarPol = () => {
    setSalvandoPol(true);
    start(async () => { await salvarPolitica(pol); setSalvandoPol(false); });
  };
  const fechar = () => {
    if (!confirm("Fechar o ciclo agora? A maturidade atual de todos os setores será registrada no histórico e o próximo vencimento passa a contar de hoje.")) return;
    setFechando(true);
    start(async () => { await fecharCiclo(); setFechando(false); });
  };

  const fmtData = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Política do ciclo */}
      <section style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e3ebf1", boxShadow: "0 10px 30px rgba(14,26,36,.06)" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: INK }}>Ritmo do diagnóstico</h2>
        <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "#8493a0" }}>Definido pela direção: de quanto em quanto tempo cada setor deve passar pela análise NEXO.</p>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#5b6b78", textTransform: "uppercase" }}>Periodicidade (dias)</span>
            <input type="number" min={7} max={365} value={pol.periodicidadeDias}
              onChange={(e) => setPol((p) => ({ ...p, periodicidadeDias: Number(e.target.value) }))} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#5b6b78", textTransform: "uppercase" }}>Aviso com (dias)</span>
            <input type="number" min={1} max={60} value={pol.avisoDias}
              onChange={(e) => setPol((p) => ({ ...p, avisoDias: Number(e.target.value) }))} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#5b6b78", textTransform: "uppercase" }}>Meta padrão (%)</span>
            <input type="number" min={0} max={100} step={10} value={pol.metaPadrao}
              onChange={(e) => setPol((p) => ({ ...p, metaPadrao: Number(e.target.value) }))} style={inputStyle} />
          </label>
          <button onClick={salvarPol} disabled={salvandoPol}
            style={{ border: "none", background: salvandoPol ? "#7fb4d8" : BLUE, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 8, cursor: salvandoPol ? "default" : "pointer" }}>
            {salvandoPol ? "Salvando…" : "Salvar política"}
          </button>
        </div>
      </section>

      {/* Ciclos por setor + metas */}
      <section style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e3ebf1", boxShadow: "0 10px 30px rgba(14,26,36,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: INK }}>Ciclos e metas por setor</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#8493a0" }}>Fechar o ciclo registra a fotografia da maturidade e reinicia a contagem do prazo.</p>
          </div>
          <button onClick={fechar} disabled={fechando}
            style={{ marginLeft: "auto", border: "none", background: fechando ? "#9fcda1" : GREEN, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 16px", borderRadius: 10, cursor: fechando ? "default" : "pointer", boxShadow: "0 4px 12px rgba(71,173,75,.3)" }}>
            {fechando ? "Fechando…" : "📸 Fechar ciclo agora"}
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px", minWidth: 640 }}>
            <thead>
              <tr>
                {["Setor", "Situação", "Vencimento", "Último ciclo", "Atual", "Tendência", "Meta (%)"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, color: "#8493a0", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", padding: "0 10px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dados.ciclos.map((c) => {
                const cor = COR_ESTADO[c.estado];
                return (
                  <tr key={c.setorId} style={{ background: "#fbfdfe" }}>
                    <td style={{ padding: "9px 10px", fontSize: 13.5, fontWeight: 700, color: INK, borderRadius: "8px 0 0 8px" }}>{c.setorNome}</td>
                    <td style={{ padding: "9px 10px" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: cor.fg, background: cor.bg, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
                        {ROTULO_ESTADO[c.estado]}{c.estado !== "em_dia" && ` (${c.diasRestantes < 0 ? `${-c.diasRestantes}d atrás` : `${c.diasRestantes}d`})`}
                      </span>
                    </td>
                    <td style={{ padding: "9px 10px", fontSize: 12.5, color: "#5b6b78" }}>{fmtData(c.vencimento)}</td>
                    <td style={{ padding: "9px 10px", fontSize: 12.5, color: "#5b6b78" }}>
                      {c.ultimoFechamento ? `${fmtData(c.ultimoFechamento)} · ${Math.round(c.ultimoGeral!)}%` : "— (1º ciclo)"}
                    </td>
                    <td style={{ padding: "9px 10px", fontSize: 13, fontWeight: 800, color: BLUE, fontVariantNumeric: "tabular-nums" }}>{Math.round(c.geralAtual)}%</td>
                    <td style={{ padding: "9px 10px", fontSize: 12.5, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: c.tendencia == null ? "#a2afba" : c.tendencia >= 0 ? "#33853a" : "#c0392b" }}>
                      {c.tendencia == null ? "—" : c.tendencia >= 0 ? `▲ +${c.tendencia}` : `▼ ${c.tendencia}`}
                    </td>
                    <td style={{ padding: "9px 10px", borderRadius: "0 8px 8px 0" }}>
                      <CampoMeta setorId={c.setorId} meta={c.meta} metaPadrao={dados.politica.metaPadrao} run={run} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "#8493a0" }}>
          Metas seguem a escala oficial (de 10 em 10). Deixar em branco volta a valer a meta padrão da empresa.
        </p>
      </section>
    </div>
  );
}

function CampoMeta({ setorId, meta, metaPadrao, run }: { setorId: string; meta: number; metaPadrao: number; run: (fn: () => Promise<unknown>) => void }) {
  const [valor, setValor] = useState(String(meta));
  const salvar = () => {
    const n = valor.trim() === "" ? null : Number(valor);
    if (n != null && (Number.isNaN(n) || n < 0 || n > 100)) { setValor(String(meta)); return; }
    run(() => salvarMetaSetor(setorId, n != null && n === metaPadrao ? null : n));
  };
  return (
    <input type="number" min={0} max={100} step={10} value={valor}
      onChange={(e) => setValor(e.target.value)} onBlur={salvar}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "5px 8px", fontSize: 12.5, color: INK, width: 70 }} />
  );
}
