"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addItemSwot, removerItemSwot } from "./actions";
import { QUADRANTES_SWOT, type QuadranteSwot, type SwotDoSetor } from "./tipos";
import BotaoGerarDoc from "@/features/documentos/BotaoGerarDoc";

const INK = "#0e1a24";

/** Análise SWOT do setor — a matriz 2×2 clássica: Forças e Fraquezas
 *  (interno) em cima, Oportunidades e Ameaças (externo) embaixo. */
export default function PainelSwot({ setorId, setorNome, swot }: {
  setorId: string; setorNome: string; swot: SwotDoSetor;
}) {
  const [, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn().then(() => router.refresh()); });

  const doQuadrante = (q: QuadranteSwot) => swot.itens.filter((i) => i.quadrante === q);

  return (
    <main style={{ minHeight: "100vh", background: "#eef3f7", padding: "28px 20px" }}>
      <header style={{ maxWidth: 980, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${setorId}/avaliar`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Voltar à avaliação</Link>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>Análise SWOT · {setorNome}</h1>
        <div style={{ marginLeft: "auto" }}>
          <BotaoGerarDoc montarDoc={() => ({
            tipo: "Análise SWOT", titulo: setorNome, setorId, setorNome,
            secoes: QUADRANTES_SWOT.map((q) => ({
              tipo: "lista" as const,
              titulo: `${q.nome} (${q.ambito === "interno" ? "ambiente interno" : "ambiente externo"})`,
              itens: doQuadrante(q.id).map((i) => i.descricao).concat(doQuadrante(q.id).length ? [] : ["(nenhum item)"]),
            })),
          })} />
        </div>
      </header>

      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <p style={{ fontSize: 13, color: "#5b6b78", margin: "0 0 14px" }}>
          <b>Interno</b> (Forças e Fraquezas): o que depende da área. <b>Externo</b> (Oportunidades e Ameaças): o que o ambiente traz.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
          {QUADRANTES_SWOT.map((q) => (
            <Quadrante key={q.id} q={q} itens={doQuadrante(q.id)} setorId={setorId} run={run} />
          ))}
        </div>
      </div>
    </main>
  );
}

function Quadrante({ q, itens, setorId, run }: {
  q: (typeof QUADRANTES_SWOT)[number];
  itens: { id: string; descricao: string }[];
  setorId: string;
  run: (fn: () => Promise<unknown>) => void;
}) {
  const [novo, setNovo] = useState("");
  const adicionar = () => { if (novo.trim()) { run(() => addItemSwot(setorId, q.id, novo.trim())); setNovo(""); } };

  return (
    <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 14, padding: 16, borderTop: `4px solid ${q.cor}` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: q.cor }}>{q.nome}</h2>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#8493a0", textTransform: "uppercase", letterSpacing: ".04em" }}>{q.ambito}</span>
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "#8493a0" }}>{q.dica}</p>

      <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
        {itens.length === 0 && <p style={{ fontSize: 12.5, color: "#c0ccd6", fontStyle: "italic", margin: 0 }}>Nenhum item ainda.</p>}
        {itens.map((i) => (
          <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #eef3f7", borderRadius: 8, padding: "7px 10px" }}>
            <span style={{ flex: 1, fontSize: 13, color: INK }}>{i.descricao}</span>
            <button onClick={() => run(() => removerItemSwot(setorId, i.id))}
              style={{ border: "none", background: "transparent", color: "#c0ccd6", fontSize: 16, cursor: "pointer", lineHeight: 1 }} aria-label="Remover">×</button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <input value={novo} placeholder={`Adicionar em ${q.nome}…`}
          onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }}
          style={{ flex: 1, border: "1px solid #dce6ee", borderRadius: 8, padding: "7px 10px", fontSize: 12.5, color: INK }} />
        <button onClick={adicionar} style={{ border: "none", background: q.cor, color: "#fff", fontWeight: 800, fontSize: 13, padding: "7px 12px", borderRadius: 8, cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
}
