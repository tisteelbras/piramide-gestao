"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import PainelRecursos from "@/features/resources/PainelRecursos";
import PainelProcessos from "@/features/processes/PainelProcessos";
import PainelResultados from "@/features/results/PainelResultados";
import type { RecursosDoSetor } from "@/features/resources/tipos";
import type { ProcessoComEixos } from "@/features/processes/tipos";
import type { ResultadosDoSetor } from "@/features/results/tipos";
import { consolidarPorNivel } from "./consolidar";
import { salvarResposta } from "./actions";
import { NIVEIS, type CriterioAvaliado, type Nivel, type StatusResposta } from "./tipos";

const STATUS_OPCOES: { v: StatusResposta; label: string; cor: string }[] = [
  { v: "nao_iniciada", label: "Não iniciada", cor: "#8493a0" },
  { v: "em_andamento", label: "Em andamento", cor: "#d98a00" },
  { v: "revisada", label: "Revisada", cor: "#33853a" },
];

export default function AvaliarSetor({
  setorId,
  setorNome,
  avaliacaoId,
  criteriosIniciais,
  recursos,
  processos,
  resultados,
}: {
  setorId: string;
  setorNome: string;
  avaliacaoId: string;
  criteriosIniciais: CriterioAvaliado[];
  recursos: RecursosDoSetor;
  processos: ProcessoComEixos[];
  resultados: ResultadosDoSetor;
}) {
  const [criterios, setCriterios] = useState(criteriosIniciais);
  const [nivelAtivo, setNivelAtivo] = useState<Nivel>("visao");
  const [, startTransition] = useTransition();
  const [salvando, setSalvando] = useState(false);

  const { porNivel } = useMemo(() => consolidarPorNivel(criterios), [criterios]);
  const doCriterios = criterios.filter((c) => c.nivel === nivelAtivo);
  const metaNivel = NIVEIS.find((n) => n.id === nivelAtivo)!;

  function atualiza(id: string, patch: Partial<CriterioAvaliado>) {
    const alvo = criterios.find((c) => c.id === id)!;
    const novo = { ...alvo, ...patch };
    setCriterios((cs) => cs.map((c) => (c.id === id ? novo : c)));
    setSalvando(true);
    startTransition(async () => {
      await salvarResposta({ avaliacaoId, criterioId: id, nota: novo.nota, status: novo.status });
      setSalvando(false);
    });
  }

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 900, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${setorId}`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Ver resultado</Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, color: "#0e1a24" }}>Avaliar — {setorNome}</h1>
        <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, color: salvando ? "#d98a00" : "#33853a" }}>{salvando ? "salvando…" : "✓ salvo"}</span>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Abas de nível */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {NIVEIS.map((n) => {
            const ativo = nivelAtivo === n.id;
            const pct = Math.round(porNivel[n.id].conclusao);
            return (
              <button key={n.id} onClick={() => setNivelAtivo(n.id)}
                style={{ border: ativo ? `2px solid ${n.cor}` : "1px solid #dce6ee", background: ativo ? n.cor : "#fff", color: ativo ? "#fff" : "#46586a", fontWeight: 700, fontSize: 13, padding: "9px 14px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <span>{n.n} {n.titulo}</span>
                <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.85 }}>{pct}%</span>
              </button>
            );
          })}
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: `6px solid ${metaNivel.cor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ background: metaNivel.cor, color: "#fff", fontWeight: 800, fontSize: 13, padding: "4px 11px", borderRadius: 999 }}>{metaNivel.n}</span>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{metaNivel.titulo}</h2>
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: metaNivel.corDark, textTransform: "uppercase", letterSpacing: 1 }}>{metaNivel.tag}</span>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#8493a0" }}>
            Nota do nível: <b style={{ color: "#0e1a24" }}>{porNivel[nivelAtivo].nota ?? "—"}</b> · Concluído: <b style={{ color: "#0e1a24" }}>{Math.round(porNivel[nivelAtivo].conclusao)}%</b>
          </p>

          <div style={{ display: "grid", gap: 10 }}>
            {doCriterios.map((c) => (
              <div key={c.id} style={{ border: "1px solid #e3ebf1", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0e1a24", marginBottom: 10 }}>{c.titulo}</div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 180 }}>
                    <input type="range" min={0} max={100} step={5} value={c.nota ?? 0}
                      onChange={(e) => atualiza(c.id, { nota: Number(e.target.value), status: c.status === "nao_iniciada" ? "em_andamento" : c.status })}
                      style={{ flex: 1, accentColor: metaNivel.cor }} />
                    <span style={{ width: 40, textAlign: "right", fontWeight: 800, color: metaNivel.corDark, fontVariantNumeric: "tabular-nums", fontSize: 14 }}>{c.nota ?? 0}</span>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    {STATUS_OPCOES.map((s) => (
                      <button key={s.v} onClick={() => atualiza(c.id, { status: s.v })}
                        style={{ border: c.status === s.v ? `2px solid ${s.cor}` : "1px solid #dce6ee", background: c.status === s.v ? s.cor : "#fff", color: c.status === s.v ? "#fff" : "#5b6b78", fontWeight: 700, fontSize: 11.5, padding: "5px 9px", borderRadius: 8, cursor: "pointer" }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {doCriterios.length === 0 && <p style={{ fontSize: 13.5, color: "#a2afba", fontStyle: "italic" }}>Nenhum critério neste nível ainda.</p>}
          </div>

          {nivelAtivo === "tatico" && <PainelRecursos setorId={setorId} avaliacaoId={avaliacaoId} recursos={recursos} />}
          {nivelAtivo === "processos" && <PainelProcessos setorId={setorId} processos={processos} />}
          {nivelAtivo === "resultados" && <PainelResultados setorId={setorId} resultados={resultados} />}
        </div>
      </div>
    </div>
  );
}
