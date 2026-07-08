"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import PainelRecursos from "@/features/resources/PainelRecursos";
import PainelProcessos from "@/features/processes/PainelProcessos";
import PainelResultados from "@/features/results/PainelResultados";
import { EIXOS_RH, type RecursosDoSetor } from "@/features/resources/tipos";
import type { ProcessoComEixos } from "@/features/processes/tipos";
import type { ResultadosDoSetor } from "@/features/results/tipos";
import { salvarResposta } from "./actions";
import { NIVEIS, type CriterioAvaliado, type Nivel } from "./tipos";

const arred = (n: number) => Math.round(n);
const media = (vals: number[]): number | null =>
  vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

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

  const itensVisao = criterios.filter((c) => c.nivel === "visao");
  const itensResultado = criterios.filter(
    (c) => c.nivel === "resultados" && ["governanca", "monitoramento", "desempenho"].includes(c.grupo),
  );

  // % ao vivo de cada nível (modelo NEXO)
  const pct = useMemo(() => {
    const revisadas = itensVisao.filter((c) => c.status === "revisada").length;
    const visao = itensVisao.length ? (revisadas / itensVisao.length) * 100 : 0;

    const mediasColab = recursos.colaboradores
      .map((c) => media(EIXOS_RH.map((e) => c.notas[e.id]).filter((n): n is number => n != null)))
      .filter((m): m is number => m !== null);
    const rh = media(mediasColab);
    const sist = media(recursos.sistemas.filter((s) => !s.ehNecessidade && s.nota != null).map((s) => s.nota!));
    const estr = media(recursos.ativos.filter((a) => a.nota != null).map((a) => a.nota!));
    const grupos = [rh, sist, estr].filter((m): m is number => m !== null);
    const tatico = media(grupos) ?? 0;

    const processosPct = media(processos.map((p) => p.media).filter((m): m is number => m !== null)) ?? 0;
    const resultadosPct = media(itensResultado.map((i) => i.nota).filter((n): n is number => n != null)) ?? 0;

    return {
      visao, tatico, processos: processosPct, resultados: resultadosPct,
      grupos: { rh, sist, estr },
    };
  }, [itensVisao, itensResultado, recursos, processos]);

  function salva(id: string, patch: Partial<CriterioAvaliado>) {
    const alvo = criterios.find((c) => c.id === id)!;
    const novo = { ...alvo, ...patch };
    setCriterios((cs) => cs.map((c) => (c.id === id ? novo : c)));
    setSalvando(true);
    startTransition(async () => {
      await salvarResposta({ avaliacaoId, criterioId: id, nota: novo.nota, status: novo.status });
      setSalvando(false);
    });
  }

  const metaNivel = NIVEIS.find((n) => n.id === nivelAtivo)!;
  const pctDoNivel: Record<Nivel, number> = {
    visao: pct.visao, tatico: pct.tatico, processos: pct.processos, resultados: pct.resultados,
  };

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
            return (
              <button key={n.id} onClick={() => setNivelAtivo(n.id)}
                style={{ border: ativo ? `2px solid ${n.cor}` : "1px solid #dce6ee", background: ativo ? n.cor : "#fff", color: ativo ? "#fff" : "#46586a", fontWeight: 700, fontSize: 13, padding: "9px 14px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <span>{n.n} {n.titulo}</span>
                <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.85 }}>{arred(pctDoNivel[n.id])}%</span>
              </button>
            );
          })}
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: `6px solid ${metaNivel.cor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ background: metaNivel.cor, color: "#fff", fontWeight: 800, fontSize: 13, padding: "4px 11px", borderRadius: 999 }}>{metaNivel.n}</span>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{metaNivel.titulo}</h2>
            <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 800, color: metaNivel.cor, fontVariantNumeric: "tabular-nums" }}>{arred(pctDoNivel[nivelAtivo])}%</span>
          </div>

          {/* ——— N1 VISÃO: checklist Revisado / Não revisado ——— */}
          {nivelAtivo === "visao" && (
            <div>
              <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#8493a0" }}>
                Marque cada etapa que já foi <b>revisada com sinceridade</b>. O topo da pirâmide preenche conforme você avança — <b style={{ color: "#0e1a24" }}>{itensVisao.filter((c) => c.status === "revisada").length}</b> de <b style={{ color: "#0e1a24" }}>{itensVisao.length}</b> revisadas.
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {itensVisao.map((c) => {
                  const revisada = c.status === "revisada";
                  return (
                    <button key={c.id}
                      onClick={() => salva(c.id, revisada ? { status: "nao_iniciada", nota: null } : { status: "revisada", nota: 100 })}
                      style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", border: revisada ? "2px solid #47ad4b" : "1px solid #e3ebf1", background: revisada ? "#f2faf3" : "#fff", borderRadius: 12, padding: "13px 15px", cursor: "pointer", transition: "all .15s" }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", background: revisada ? "#47ad4b" : "#fff", border: revisada ? "none" : "2px solid #c6d3de", color: "#fff", fontWeight: 800, fontSize: 14 }}>{revisada ? "✓" : ""}</span>
                      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: "#0e1a24" }}>{c.titulo}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: revisada ? "#33853a" : "#8493a0", textTransform: "uppercase", letterSpacing: ".04em" }}>{revisada ? "Revisado" : "Não revisado"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ——— N2 RECURSOS: 3 grupos com médias ——— */}
          {nivelAtivo === "tatico" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 4 }}>
                {[
                  { label: "Humanos", v: pct.grupos.rh },
                  { label: "Sistêmico", v: pct.grupos.sist },
                  { label: "Estrutural", v: pct.grupos.estr },
                ].map((g) => (
                  <div key={g.label} style={{ background: "#f4f8fb", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#8493a0" }}>{g.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: g.v != null ? "#33853a" : "#c0ccd6", fontVariantNumeric: "tabular-nums" }}>{g.v != null ? `${arred(g.v)}%` : "—"}</div>
                  </div>
                ))}
              </div>
              <PainelRecursos setorId={setorId} avaliacaoId={avaliacaoId} recursos={recursos} />
            </div>
          )}

          {/* ——— N3 PROCESSOS: cards com 5 etapas ——— */}
          {nivelAtivo === "processos" && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 13.5, color: "#8493a0" }}>
                Cadastre cada processo da sua operação. Cada card expande com as 5 etapas de avaliação; a média geral considera todos os processos ativos.
              </p>
              <PainelProcessos setorId={setorId} processos={processos} />
            </div>
          )}

          {/* ——— N4 RESULTADO: 3 avaliações sinceras + indicadores ——— */}
          {nivelAtivo === "resultados" && (
            <div>
              <div style={{ display: "grid", gap: 10, marginBottom: 6 }}>
                {itensResultado.map((c) => (
                  <div key={c.id} style={{ border: "1px solid #e3ebf1", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0e1a24", marginBottom: 8 }}>{c.titulo}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11.5, color: "#8493a0", fontWeight: 600, width: 110 }}>Avaliação sincera</span>
                      <input type="range" min={0} max={100} step={5} value={c.nota ?? 0}
                        onChange={(e) => salva(c.id, { nota: Number(e.target.value), status: "em_andamento" })}
                        style={{ flex: 1, accentColor: metaNivel.cor }} />
                      <span style={{ width: 40, textAlign: "right", fontWeight: 800, color: metaNivel.corDark, fontVariantNumeric: "tabular-nums", fontSize: 14 }}>{c.nota ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
              <PainelResultados setorId={setorId} resultados={resultados} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
