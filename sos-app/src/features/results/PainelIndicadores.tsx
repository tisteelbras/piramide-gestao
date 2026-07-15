"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addIndicador, removeIndicador, toggleAusenciaIndicador, salvarMedicaoIndicador } from "./actions";
import type { IndicadorItem, DirecaoIndicador } from "./tipos";

const GREEN = "#47ad4b", INK = "#0e1a24";
const corAtingimento = (n: number) => (n >= 90 ? "#33853a" : n >= 70 ? "#d98a00" : "#c0392b");
const inputBase: React.CSSProperties = { border: "1px solid #dce6ee", borderRadius: 8, padding: "6px 8px", fontSize: 13, color: INK, width: "100%" };

/**
 * Tela da etapa "Indicadores de Desempenho" da Visão. Cada indicador criado
 * aqui vira automaticamente um processo (N3) e alimenta o Resultado de KPI
 * (N4) — um único cadastro conecta os três níveis.
 */
export default function PainelIndicadores({ setorId, setorNome, indicadores }: {
  setorId: string; setorNome: string; indicadores: IndicadorItem[];
}) {
  const [novo, setNovo] = useState("");
  const [, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn().then(() => router.refresh()); });
  const adicionar = () => { if (novo.trim()) { run(() => addIndicador(setorId, novo.trim())); setNovo(""); } };

  return (
    <main style={{ minHeight: "100vh", background: "#eef3f7", padding: "28px 20px" }}>
      <header style={{ maxWidth: 940, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${setorId}/avaliar`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Voltar à avaliação</Link>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>Indicadores de Desempenho · {setorNome}</h1>
      </header>

      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#5b6b78" }}>
            <b>Como a área se mede.</b> Cada indicador vira um <b>processo</b> em Processos e seu atingimento (valor × meta) forma o <b>Resultado de KPI</b> na pirâmide — você cadastra uma vez, aparece nos três níveis.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={novo} placeholder="Novo indicador (ex.: OTIF, Conversão, Retrabalho)"
            onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }}
            style={{ flex: 1, border: "1px solid #dce6ee", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: INK }} />
          <button onClick={adicionar} style={{ border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
        </div>

        {indicadores.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfdae4", borderRadius: 12, padding: 28, textAlign: "center", color: "#8493a0", fontSize: 14 }}>
            Nenhum indicador ainda. Comece pelos poucos que realmente dizem se a área entrega.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {indicadores.map((i) => <LinhaKpi key={i.id} i={i} setorId={setorId} run={run} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function LinhaKpi({ i, setorId, run }: {
  i: IndicadorItem; setorId: string; run: (fn: () => Promise<unknown>) => void;
}) {
  const [meta, setMeta] = useState(i.meta?.toString() ?? "");
  const [valor, setValor] = useState(i.valorAtual?.toString() ?? "");
  const [unidade, setUnidade] = useState(i.unidade ?? "");
  const num = (s: string) => { const t = s.trim().replace(",", "."); if (!t) return null; const n = Number(t); return Number.isFinite(n) ? n : null; };

  return (
    <div style={{ border: "1px solid #e3ebf1", borderRadius: 10, padding: "10px 12px", background: i.ehAusencia ? "#fffbfb" : "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i.ehAusencia ? 0 : 10 }}>
        <span style={{ fontWeight: 700, color: INK, fontSize: 13.5 }}>{i.nome}</span>
        <button onClick={() => run(() => toggleAusenciaIndicador(i.id, !i.ehAusencia))}
          title={i.ehAusencia ? "Não medido — conta 0 no Resultado." : "Marcar como ausente."}
          style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, cursor: "pointer", border: i.ehAusencia ? "1px solid #f0c0bd" : "1px solid #cfe0d0", background: i.ehAusencia ? "#fdecea" : "#eef7ef", color: i.ehAusencia ? "#c0392b" : "#33853a" }}>
          {i.ehAusencia ? "ausente" : "medido"}
        </button>
        {i.atingimento !== null ? (
          <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 800, color: corAtingimento(i.atingimento) }}>{i.atingimento}% da meta</span>
        ) : (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#a2afba", fontStyle: "italic" }}>sem medição</span>
        )}
        <button onClick={() => run(() => removeIndicador(i.id))} style={{ border: "none", background: "transparent", color: "#c0ccd6", fontSize: 18, cursor: "pointer", lineHeight: 1 }} aria-label="Remover">×</button>
      </div>
      {!i.ehAusencia && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.8fr 1.2fr", gap: 8 }}>
          <label style={{ fontSize: 11, color: "#5b6b78", fontWeight: 600 }}>Meta
            <input value={meta} inputMode="decimal" placeholder="95" onChange={(e) => setMeta(e.target.value)} onBlur={() => run(() => salvarMedicaoIndicador(i.id, { meta: num(meta) }))} style={{ ...inputBase, marginTop: 3 }} />
          </label>
          <label style={{ fontSize: 11, color: "#5b6b78", fontWeight: 600 }}>Valor atual
            <input value={valor} inputMode="decimal" placeholder="78" onChange={(e) => setValor(e.target.value)} onBlur={() => run(() => salvarMedicaoIndicador(i.id, { valorAtual: num(valor) }))} style={{ ...inputBase, marginTop: 3 }} />
          </label>
          <label style={{ fontSize: 11, color: "#5b6b78", fontWeight: 600 }}>Unidade
            <input value={unidade} placeholder="%" onChange={(e) => setUnidade(e.target.value)} onBlur={() => run(() => salvarMedicaoIndicador(i.id, { unidade }))} style={{ ...inputBase, marginTop: 3 }} />
          </label>
          <label style={{ fontSize: 11, color: "#5b6b78", fontWeight: 600 }}>Sentido
            <select value={i.direcao} onChange={(e) => run(() => salvarMedicaoIndicador(i.id, { direcao: e.target.value as DirecaoIndicador }))} style={{ ...inputBase, marginTop: 3, cursor: "pointer" }}>
              <option value="maior">Quanto maior, melhor</option>
              <option value="menor">Quanto menor, melhor</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
