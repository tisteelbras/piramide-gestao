"use client";

import Link from "next/link";
import { useMemo } from "react";
import Piramide3D from "@/features/pyramid/Piramide3D";
import { consolidarPorNivel } from "./consolidar";
import { grauMaturidade, ROTULO_MATURIDADE } from "@/domain/maturidade";
import { NIVEIS, type CriterioAvaliado, type Nivel } from "./tipos";

// Tela do setor = VISUALIZAÇÃO. Mostra só o preenchimento/resultado por
// nível. A edição dos critérios fica em /setor/[id]/avaliar.
export default function AvaliacaoSetor({
  setorId,
  setorNome,
  criteriosIniciais,
}: {
  setorId: string;
  setorNome: string;
  criteriosIniciais: CriterioAvaliado[];
}) {
  const { porNivel, geral } = useMemo(() => consolidarPorNivel(criteriosIniciais), [criteriosIniciais]);
  const preenchimento = useMemo(() => {
    const p = {} as Record<Nivel, number>;
    for (const n of NIVEIS) p[n.id] = porNivel[n.id].preenchimento;
    return p;
  }, [porNivel]);

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 1160, margin: "0 auto 22px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Setores</Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, color: "#0e1a24" }}>{setorNome}</h1>
        <Link href={`/setor/${setorId}/avaliar`} style={{ marginLeft: "auto", textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#fff", background: "#0068a9", padding: "10px 16px", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,104,169,.25)" }}>✎ Avaliar</Link>
        <Link href={`/setor/${setorId}/relatorio`} style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "9px 14px", borderRadius: 10 }}>⭳ Relatório PDF</Link>
      </header>

      <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(300px,1fr) minmax(340px,1fr)", gap: "clamp(20px,3vw,44px)", alignItems: "center" }}>
        {/* Pirâmide 3D */}
        <div>
          <Piramide3D preenchimento={preenchimento} />
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <div style={{ fontSize: 13, color: "#8493a0", fontWeight: 600 }}>Maturidade geral</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#0068a9", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{Math.round(geral)}%</div>
            <span style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 800, color: "#fff", background: "#0068a9", padding: "3px 12px", borderRadius: 999 }}>{ROTULO_MATURIDADE[grauMaturidade(geral)]}</span>
          </div>
        </div>

        {/* Cartões de resultado por nível (só leitura) */}
        <div style={{ display: "grid", gap: 12 }}>
          {NIVEIS.map((n) => {
            const r = porNivel[n.id];
            const grau = grauMaturidade(r.preenchimento);
            return (
              <div key={n.id} style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", boxShadow: "0 10px 30px rgba(14,26,36,.06)", borderLeft: `5px solid ${n.cor}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ background: n.cor, color: "#fff", fontWeight: 800, fontSize: 12, padding: "3px 10px", borderRadius: 999 }}>{n.n}</span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "#0e1a24" }}>{n.titulo}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#8493a0", textTransform: "uppercase", letterSpacing: 1 }}>{n.tag}</span>
                  <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 800, color: n.cor, fontVariantNumeric: "tabular-nums" }}>{Math.round(r.preenchimento)}%</span>
                </div>
                {/* barra de preenchimento */}
                <div style={{ height: 10, background: "#eef4f9", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${r.preenchimento}%`, height: "100%", background: n.cor, transition: "width .5s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12.5, color: "#8493a0" }}>
                  <span>Nota <b style={{ color: "#46586a" }}>{r.nota ?? "—"}</b> · Concluído <b style={{ color: "#46586a" }}>{Math.round(r.conclusao)}%</b></span>
                  <span style={{ fontWeight: 700, color: n.corDark }}>{ROTULO_MATURIDADE[grau]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
