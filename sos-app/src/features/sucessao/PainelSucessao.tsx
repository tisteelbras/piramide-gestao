"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addSucessao, setQuemDomina, removerSucessao } from "./actions";
import { RISCOS_SUCESSAO } from "./tipos";
import type { SucessaoDoSetor, SucessaoItem } from "./tipos";

const INK = "#0e1a24", GREEN = "#47ad4b";
const risco = (id: string) => RISCOS_SUCESSAO.find((x) => x.id === id)!;

export default function PainelSucessao({ setorId, setorNome, dados }: {
  setorId: string; setorNome: string; dados: SucessaoDoSetor;
}) {
  const [, start] = useTransition();
  const router = useRouter();
  const [nova, setNova] = useState("");
  const run = (fn: () => Promise<unknown>) => start(() => { void fn().then(() => router.refresh()); });
  const adicionar = () => { if (nova.trim()) { run(() => addSucessao(setorId, nova.trim())); setNova(""); } };

  const emRisco = dados.lacunas + dados.criticos;

  return (
    <main style={{ minHeight: "100vh", background: "#eef3f7", padding: "28px 20px" }}>
      <header style={{ maxWidth: 940, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${setorId}/avaliar`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Voltar à avaliação</Link>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>Sucessão e continuidade · {setorNome}</h1>
      </header>

      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#5b6b78" }}>
            <b>Pilar 4 · Sustentabilidade.</b> A operação depende das pessoas ou do sistema? Liste as atividades críticas e quem as domina — o risco é calculado sozinho.
            {dados.total > 0 && <> Hoje há <b style={{ color: emRisco ? "#c0392b" : "#33853a" }}>{emRisco}</b> em risco ({dados.lacunas} sem ninguém, {dados.criticos} com uma só pessoa).</>}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={nova} placeholder="Atividade crítica (ex.: Fechamento fiscal)"
            onChange={(e) => setNova(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }}
            style={{ flex: 1, border: "1px solid #dce6ee", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: INK }} />
          <button onClick={adicionar} style={{ border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
        </div>

        {dados.itens.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfdae4", borderRadius: 12, padding: 28, textAlign: "center", color: "#8493a0", fontSize: 14 }}>
            Nenhuma atividade crítica listada. Pense: o que pararia se a pessoa certa saísse de férias?
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {dados.itens.map((s) => <LinhaSucessao key={s.id} s={s} setorId={setorId} run={run} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function LinhaSucessao({ s, setorId, run }: {
  s: SucessaoItem; setorId: string; run: (fn: () => Promise<unknown>) => void;
}) {
  const [quem, setQuem] = useState(s.quemDomina ?? "");
  const r = risco(s.risco);
  return (
    <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderLeft: `4px solid ${r.cor}` }}>
      <span style={{ flex: "1 1 200px", fontSize: 14, fontWeight: 600, color: INK }}>{s.atividade}</span>
      <label style={{ fontSize: 12, color: "#5b6b78", display: "flex", alignItems: "center", gap: 6 }}>
        Quem domina
        <input value={quem} placeholder="ex.: João, Maria" onChange={(e) => setQuem(e.target.value)} onBlur={() => run(() => setQuemDomina(setorId, s.id, quem))}
          style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "5px 9px", fontSize: 12.5, color: INK, width: 170 }} />
      </label>
      <span title="Calculado a partir de quem domina" style={{ fontSize: 11.5, fontWeight: 800, padding: "5px 12px", borderRadius: 999, color: "#fff", background: r.cor, minWidth: 110, textAlign: "center" }}>
        {r.label}
      </span>
      <button onClick={() => run(() => removerSucessao(setorId, s.id))} style={{ border: "none", background: "transparent", color: "#c0ccd6", fontSize: 18, cursor: "pointer", lineHeight: 1 }} aria-label="Remover">×</button>
    </div>
  );
}
