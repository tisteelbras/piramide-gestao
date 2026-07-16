"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { atualizarObjetivo } from "./actions";
import { PERSPECTIVAS_BSC, STATUS_OBJETIVO, type ObjetivosDoSetor, type PerspectivaBsc } from "./tipos";
import BotaoGerarDoc from "@/features/documentos/BotaoGerarDoc";

const INK = "#0e1a24";
const corStatus = (s: string) => STATUS_OBJETIVO.find((x) => x.id === s)?.cor ?? "#8493a0";

/**
 * Mapa Estratégico (Balanced Scorecard) — os MESMOS objetivos da ferramenta
 * Objetivos Estratégicos, organizados nas 4 perspectivas do BSC, de
 * Financeira (topo, o fim) a Aprendizado (base, o meio). Classificar aqui é
 * só escolher a perspectiva de cada objetivo — sem cadastrar duas vezes.
 */
export default function PainelBsc({ setorId, setorNome, dados }: {
  setorId: string; setorNome: string; dados: ObjetivosDoSetor;
}) {
  const [, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn().then(() => router.refresh()); });

  const daPerspectiva = (p: PerspectivaBsc) => dados.objetivos.filter((o) => o.perspectiva === p);
  const semPerspectiva = dados.objetivos.filter((o) => o.perspectiva === null);

  return (
    <main style={{ minHeight: "100vh", background: "#eef3f7", padding: "28px 20px" }}>
      <header style={{ maxWidth: 940, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${setorId}/avaliar`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Voltar à avaliação</Link>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>Mapa Estratégico (BSC) · {setorNome}</h1>
        <div style={{ marginLeft: "auto" }}>
          <BotaoGerarDoc montarDoc={() => ({
            tipo: "Mapa Estratégico BSC", titulo: setorNome, setorId, setorNome,
            secoes: PERSPECTIVAS_BSC.map((p) => ({
              tipo: "lista" as const,
              titulo: `${p.nome} — ${p.pergunta}`,
              itens: daPerspectiva(p.id).map((o) => `${o.titulo}${o.meta ? ` (meta: ${o.meta})` : ""}`)
                .concat(daPerspectiva(p.id).length ? [] : ["(nenhum objetivo nesta perspectiva)"]),
            })),
          })} />
        </div>
      </header>

      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <p style={{ fontSize: 13, color: "#5b6b78", margin: "0 0 14px" }}>
          Os <b>mesmos objetivos</b> da ferramenta Objetivos Estratégicos, vistos nas 4 perspectivas do Balanced Scorecard. Escolha a perspectiva de cada um — quem ainda não tem fica em “A classificar”.
          {" "}<Link href={`/setor/${setorId}/objetivos`} style={{ color: "#0068a9", fontWeight: 700, textDecoration: "none" }}>gerir objetivos ›</Link>
        </p>

        {/* A classificar */}
        {semPerspectiva.length > 0 && (
          <div style={{ background: "#fffbea", border: "1px dashed #e8d48a", borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#8a6d00", marginBottom: 8 }}>A classificar ({semPerspectiva.length})</div>
            <div style={{ display: "grid", gap: 6 }}>
              {semPerspectiva.map((o) => (
                <LinhaObjetivoBsc key={o.id} o={o} setorId={setorId} run={run} />
              ))}
            </div>
          </div>
        )}

        {/* As 4 perspectivas, de cima (fim) para baixo (meio) */}
        <div style={{ display: "grid", gap: 12 }}>
          {PERSPECTIVAS_BSC.map((p) => {
            const objs = daPerspectiva(p.id);
            return (
              <section key={p.id} style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 14, padding: 16, borderLeft: `5px solid ${p.cor}` }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: p.cor }}>{p.nome}</h2>
                  <span style={{ fontSize: 12, color: "#8493a0" }}>{p.pergunta}</span>
                </div>
                {objs.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: "#c0ccd6", fontStyle: "italic", margin: 0 }}>Nenhum objetivo nesta perspectiva.</p>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {objs.map((o) => <LinhaObjetivoBsc key={o.id} o={o} setorId={setorId} run={run} />)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function LinhaObjetivoBsc({ o, setorId, run }: {
  o: ObjetivosDoSetor["objetivos"][number]; setorId: string; run: (fn: () => Promise<unknown>) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #eef3f7", borderRadius: 8, padding: "8px 11px", flexWrap: "wrap" }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: corStatus(o.status), flexShrink: 0 }} title={o.status} />
      <span style={{ flex: "1 1 180px", fontSize: 13.5, fontWeight: 700, color: INK }}>{o.titulo}</span>
      {o.meta && <span style={{ fontSize: 12, color: "#5b6b78" }}>meta {o.meta}</span>}
      <select value={o.perspectiva ?? ""} onChange={(e) => run(() => atualizarObjetivo(setorId, o.id, { perspectiva: (e.target.value || null) as never }))}
        style={{ marginLeft: "auto", border: "1px solid #dce6ee", borderRadius: 8, padding: "5px 8px", fontSize: 12, color: INK, background: "#fff", cursor: "pointer" }}>
        <option value="">— perspectiva —</option>
        {PERSPECTIVAS_BSC.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
    </div>
  );
}
