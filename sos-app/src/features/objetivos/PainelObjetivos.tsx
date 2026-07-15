"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addObjetivo, atualizarObjetivo, removerObjetivo } from "./actions";
import { STATUS_OBJETIVO, PROXIMO_STATUS_OBJETIVO, objetivoCompleto } from "./tipos";
import BotaoGerarDoc from "@/features/documentos/BotaoGerarDoc";
import type { ObjetivosDoSetor, ObjetivoItem } from "./tipos";

const BLUE = "#0068a9", INK = "#0e1a24", GREEN = "#47ad4b";
const corStatus = (s: string) => STATUS_OBJETIVO.find((x) => x.id === s)?.cor ?? "#8493a0";
const labelStatus = (s: string) => STATUS_OBJETIVO.find((x) => x.id === s)?.label ?? s;

export default function PainelObjetivos({ setorId, setorNome, dados }: {
  setorId: string; setorNome: string; dados: ObjetivosDoSetor;
}) {
  const [, start] = useTransition();
  const router = useRouter();
  const [novo, setNovo] = useState("");
  const run = (fn: () => Promise<unknown>) => start(() => { void fn().then(() => router.refresh()); });

  const adicionar = () => {
    const t = novo.trim();
    if (!t) return;
    setNovo("");
    run(() => addObjetivo(setorId, t));
  };

  return (
    <main style={{ minHeight: "100vh", background: "#eef3f7", padding: "28px 20px" }}>
      <header style={{ maxWidth: 980, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${setorId}/avaliar`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Voltar à avaliação</Link>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>Objetivos estratégicos · {setorNome}</h1>
        <div style={{ marginLeft: "auto" }}>
          <BotaoGerarDoc montarDoc={() => ({
            tipo: "Objetivos Estratégicos", titulo: setorNome, setorId, setorNome,
            secoes: [{ tipo: "tabela", titulo: "Objetivos", colunas: ["Objetivo", "Meta", "Prazo", "Status"],
              linhas: dados.objetivos.map((o) => [
                o.titulo, o.meta ?? "—", o.prazo ?? "—",
                STATUS_OBJETIVO.find((s) => s.id === o.status)?.label ?? o.status,
              ]) }],
          })} />
        </div>
      </header>

      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <p style={{ fontSize: 13.5, color: "#5b6b78", margin: "0 0 16px" }}>
          O <b>para onde vamos</b> da área. Cada objetivo com meta e prazo — é o que a Gestão por Objetivos (nível Resultado) vai executar. {dados.total > 0 && <><b>{dados.completos}</b> de <b>{dados.total}</b> com meta e prazo definidos.</>}
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={novo} placeholder="Novo objetivo (ex.: Dobrar a carteira de PME)"
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }}
            style={{ flex: 1, border: "1px solid #dce6ee", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: INK }} />
          <button onClick={adicionar} style={{ border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
        </div>

        {dados.objetivos.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfdae4", borderRadius: 12, padding: 28, textAlign: "center", color: "#8493a0", fontSize: 14 }}>
            Nenhum objetivo ainda. Comece pelo mais importante da área.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {dados.objetivos.map((o) => <LinhaObjetivo key={o.id} o={o} setorId={setorId} run={run} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function LinhaObjetivo({ o, setorId, run }: {
  o: ObjetivoItem; setorId: string; run: (fn: () => Promise<unknown>) => void;
}) {
  const [titulo, setTitulo] = useState(o.titulo);
  const [meta, setMeta] = useState(o.meta ?? "");
  const completo = objetivoCompleto(o);

  return (
    <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 12, padding: "12px 14px", borderLeft: `4px solid ${corStatus(o.status)}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} onBlur={() => titulo.trim() && titulo !== o.titulo && run(() => atualizarObjetivo(setorId, o.id, { titulo }))}
          style={{ flex: 1, border: "none", borderBottom: "1px solid transparent", fontSize: 15, fontWeight: 700, color: INK, padding: "2px 0", outline: "none" }} />
        <button onClick={() => run(() => atualizarObjetivo(setorId, o.id, { status: PROXIMO_STATUS_OBJETIVO[o.status] }))}
          style={{ fontSize: 11, fontWeight: 800, padding: "4px 11px", borderRadius: 999, cursor: "pointer", border: "none", color: "#fff", background: corStatus(o.status) }}>
          {labelStatus(o.status)}
        </button>
        <button onClick={() => run(() => removerObjetivo(setorId, o.id))} style={{ border: "none", background: "transparent", color: "#c0ccd6", fontSize: 18, cursor: "pointer", lineHeight: 1 }} aria-label="Remover">×</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ fontSize: 12, color: "#5b6b78", display: "flex", alignItems: "center", gap: 6 }}>
          Meta
          <input value={meta} placeholder="ex.: +40%" onChange={(e) => setMeta(e.target.value)} onBlur={() => run(() => atualizarObjetivo(setorId, o.id, { meta }))}
            style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "5px 9px", fontSize: 12.5, color: INK, width: 130 }} />
        </label>
        <label style={{ fontSize: 12, color: "#5b6b78", display: "flex", alignItems: "center", gap: 6 }}>
          Prazo
          <input type="date" defaultValue={o.prazo ?? ""} onChange={(e) => run(() => atualizarObjetivo(setorId, o.id, { prazo: e.target.value || null }))}
            style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "5px 8px", fontSize: 12.5, color: INK }} />
        </label>
        {!completo && <span style={{ fontSize: 11.5, color: "#d98a00", fontWeight: 600 }}>⚠ falta {!o.meta?.trim() ? "meta" : ""}{!o.meta?.trim() && !o.prazo ? " e " : ""}{!o.prazo ? "prazo" : ""}</span>}
      </div>
    </div>
  );
}
