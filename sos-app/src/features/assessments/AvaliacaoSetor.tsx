"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import PiramideMaturidade from "@/features/pyramid/PiramideMaturidade";
import { consolidarPorNivel } from "./consolidar";
import { salvarResposta } from "./actions";
import { NIVEIS, type CriterioAvaliado, type Nivel, type StatusResposta } from "./tipos";

const STATUS_OPCOES: { v: StatusResposta; label: string; cor: string }[] = [
  { v: "nao_iniciada", label: "Não iniciada", cor: "#8493a0" },
  { v: "em_andamento", label: "Em andamento", cor: "#d98a00" },
  { v: "revisada", label: "Revisada", cor: "#33853a" },
];

export default function AvaliacaoSetor({
  setorNome,
  avaliacaoId,
  criteriosIniciais,
}: {
  setorNome: string;
  avaliacaoId: string;
  criteriosIniciais: CriterioAvaliado[];
}) {
  const [criterios, setCriterios] = useState(criteriosIniciais);
  const [nivelAtivo, setNivelAtivo] = useState<Nivel>("visao");
  const [, startTransition] = useTransition();
  const [salvando, setSalvando] = useState(false);

  const { porNivel, geral } = useMemo(() => consolidarPorNivel(criterios), [criterios]);
  const preenchimento = useMemo(() => {
    const p = {} as Record<Nivel, number>;
    for (const n of NIVEIS) p[n.id] = porNivel[n.id].preenchimento;
    return p;
  }, [porNivel]);

  const doCriterios = criterios.filter((c) => c.nivel === nivelAtivo);
  const metaNivel = NIVEIS.find((n) => n.id === nivelAtivo)!;

  function atualiza(id: string, patch: Partial<CriterioAvaliado>) {
    setCriterios((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const alvo = criterios.find((c) => c.id === id)!;
    const novo = { ...alvo, ...patch };
    setSalvando(true);
    startTransition(async () => {
      await salvarResposta({
        avaliacaoId,
        criterioId: id,
        nota: novo.nota,
        status: novo.status,
      });
      setSalvando(false);
    });
  }

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 1160, margin: "0 auto 22px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>
          ‹ Setores
        </Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, color: "#0e1a24" }}>{setorNome}</h1>
        <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, color: salvando ? "#d98a00" : "#33853a" }}>
          {salvando ? "salvando…" : "✓ salvo"}
        </span>
      </header>

      <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(300px,1fr) minmax(340px,1.15fr)", gap: "clamp(20px,3vw,44px)", alignItems: "start" }}>
        {/* Pirâmide + geral */}
        <div>
          <PiramideMaturidade preenchimento={preenchimento} ativo={nivelAtivo} onSelect={setNivelAtivo} />
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <div style={{ fontSize: 13, color: "#8493a0", fontWeight: 600 }}>Maturidade geral</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#0068a9", fontVariantNumeric: "tabular-nums" }}>
              {Math.round(geral)}%
            </div>
          </div>
        </div>

        {/* Avaliação do nível ativo */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: `6px solid ${metaNivel.cor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ background: metaNivel.cor, color: "#fff", fontWeight: 800, fontSize: 13, padding: "4px 11px", borderRadius: 999 }}>{metaNivel.n}</span>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{metaNivel.titulo}</h2>
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: metaNivel.corDark, textTransform: "uppercase", letterSpacing: 1 }}>{metaNivel.tag}</span>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#8493a0" }}>
            Nota do nível: <b style={{ color: "#0e1a24" }}>{porNivel[nivelAtivo].nota ?? "—"}</b> ·
            {" "}Concluído: <b style={{ color: "#0e1a24" }}>{Math.round(porNivel[nivelAtivo].conclusao)}%</b>
          </p>

          <div style={{ display: "grid", gap: 10 }}>
            {doCriterios.map((c) => (
              <div key={c.id} style={{ border: "1px solid #e3ebf1", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0e1a24", marginBottom: 10 }}>{c.titulo}</div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Nota 0–100 via slider */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 180 }}>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={c.nota ?? 0}
                      onChange={(e) => atualiza(c.id, { nota: Number(e.target.value), status: c.status === "nao_iniciada" ? "em_andamento" : c.status })}
                      style={{ flex: 1, accentColor: metaNivel.cor }}
                    />
                    <span style={{ width: 40, textAlign: "right", fontWeight: 800, color: metaNivel.corDark, fontVariantNumeric: "tabular-nums", fontSize: 14 }}>
                      {c.nota ?? 0}
                    </span>
                  </div>
                  {/* Status */}
                  <div style={{ display: "flex", gap: 5 }}>
                    {STATUS_OPCOES.map((s) => (
                      <button
                        key={s.v}
                        onClick={() => atualiza(c.id, { status: s.v })}
                        style={{
                          border: c.status === s.v ? `2px solid ${s.cor}` : "1px solid #dce6ee",
                          background: c.status === s.v ? s.cor : "#fff",
                          color: c.status === s.v ? "#fff" : "#5b6b78",
                          fontWeight: 700,
                          fontSize: 11.5,
                          padding: "5px 9px",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {doCriterios.length === 0 && (
              <p style={{ fontSize: 13.5, color: "#a2afba", fontStyle: "italic" }}>Nenhum critério neste nível ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
