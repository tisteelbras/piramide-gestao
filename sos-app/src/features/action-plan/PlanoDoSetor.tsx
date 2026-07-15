"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  atualizarAcao5w2h, setStatusAcao5w2h, removerAcao5w2h, addAcaoAoSetor,
} from "@/features/ferramentas/actions";
import { ROTULO_SITUACAO, COR_SITUACAO } from "@/domain/plano-acao";
import { PROXIMO_STATUS, ROTULO_STATUS } from "@/features/ferramentas/tipos";
import type { PlanoDoSetor as PlanoDTO, AcaoDoPlano } from "./tipos";

const BLUE = "#0068a9", INK = "#0e1a24", GREEN = "#47ad4b";

export default function PlanoDoSetor({ setorId, setorNome, plano }: {
  setorId: string; setorNome: string; plano: PlanoDTO;
}) {
  const [, start] = useTransition();
  const router = useRouter();
  const [nova, setNova] = useState("");
  const run = (fn: () => Promise<unknown>) => start(() => { void fn().then(() => router.refresh()); });

  const r = plano.resumo;

  // Cria uma ação avulsa. A action garante o plano do setor se ainda não
  // existir e coloca a ação nele — num passo só.
  const adicionar = () => {
    const oQue = nova.trim();
    if (!oQue) return;
    setNova("");
    run(() => addAcaoAoSetor(setorId, setorNome, oQue));
  };

  return (
    <main style={{ minHeight: "100vh", background: "#eef3f7", padding: "28px 20px" }}>
      <header style={{ maxWidth: 1080, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${setorId}`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ {setorNome}</Link>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: INK }}>Plano de ação</h1>
        <Link href={`/setor/${setorId}/avaliar`} style={{ marginLeft: "auto", textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#fff", background: BLUE, padding: "9px 15px", borderRadius: 10 }}>⚡ Ver diagnóstico</Link>
      </header>

      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Resumo — o painel que faz o gestor voltar. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 18 }}>
          <Tile n={r.total} label="Ações" cor={INK} />
          <Tile n={r.concluidas} label="Concluídas" cor={GREEN} />
          <Tile n={r.emAndamento} label="Em andamento" cor={BLUE} />
          <Tile n={r.atrasadas} label="Atrasadas" cor="#c0392b" destaque={r.atrasadas > 0} />
          <Tile n={`${r.progresso}%`} label="Do plano feito" cor={GREEN} />
        </div>

        {/* Barra de progresso */}
        <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ height: 10, background: "#eef3f7", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${r.progresso}%`, height: "100%", background: GREEN, transition: "width .3s" }} />
          </div>
        </div>

        {/* Adicionar ação avulsa */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={nova} placeholder="Nova ação (o que precisa ser feito?)"
            onChange={(e) => setNova(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }}
            style={{ flex: 1, border: "1px solid #dce6ee", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: INK }} />
          <button onClick={adicionar} style={{ border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
        </div>

        {plano.acoes.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfdae4", borderRadius: 12, padding: 28, textAlign: "center", color: "#8493a0", fontSize: 14 }}>
            Nenhuma ação ainda. Gere o diagnóstico do setor e transforme as recomendações em ações — ou adicione uma acima.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {plano.acoes.map((a) => (
              <LinhaAcao key={a.id} a={a} run={run} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Tile({ n, label, cor, destaque }: { n: number | string; label: string; cor: string; destaque?: boolean }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${destaque ? "#f0c0bd" : "#e3ebf1"}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: cor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{n}</div>
      <div style={{ fontSize: 11.5, color: "#5b6b78", fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function LinhaAcao({ a, run }: { a: AcaoDoPlano; run: (fn: () => Promise<unknown>) => void }) {
  const [quem, setQuem] = useState(a.quem ?? "");
  const feita = a.status === "concluida";

  return (
    <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 12, padding: "12px 14px", borderLeft: `4px solid ${COR_SITUACAO[a.situacao]}`, opacity: feita ? 0.72 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Concluir / reabrir */}
        <button onClick={() => run(() => setStatusAcao5w2h(a.id, feita ? "pendente" : "concluida"))}
          title={feita ? "Reabrir" : "Marcar como concluída"}
          style={{ width: 22, height: 22, borderRadius: 6, cursor: "pointer", flexShrink: 0,
            border: feita ? "none" : "2px solid #cfd9e2", background: feita ? GREEN : "#fff",
            color: "#fff", fontSize: 13, lineHeight: 1, fontWeight: 900 }}>
          {feita ? "✓" : ""}
        </button>

        <span style={{ fontWeight: 700, fontSize: 14, color: INK, textDecoration: feita ? "line-through" : "none" }}>{a.oQue}</span>

        {/* Selo de situação de prazo */}
        <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 999, color: "#fff", background: COR_SITUACAO[a.situacao] }}>
          {ROTULO_SITUACAO[a.situacao]}
          {a.situacao === "atrasada" && a.diasParaPrazo != null ? ` ${Math.abs(a.diasParaPrazo)}d` : ""}
        </span>

        <button onClick={() => run(() => removerAcao5w2h(a.id))} style={{ marginLeft: "auto", border: "none", background: "transparent", color: "#c0ccd6", fontSize: 18, cursor: "pointer", lineHeight: 1 }} aria-label="Remover">×</button>
      </div>

      {/* Origem no diagnóstico */}
      {a.recomendacaoTitulo && (
        <div style={{ fontSize: 11.5, color: "#8493a0", marginTop: 4, marginLeft: 32 }}>
          nasceu da recomendação: <b style={{ color: "#5b6b78" }}>{a.recomendacaoTitulo}</b>
        </div>
      )}

      {/* Dono, prazo e status de execução */}
      <div style={{ display: "flex", gap: 10, marginTop: 10, marginLeft: 32, flexWrap: "wrap", alignItems: "center" }}>
        <input value={quem} placeholder="Responsável"
          onChange={(e) => setQuem(e.target.value)}
          onBlur={() => run(() => atualizarAcao5w2h(a.id, { quem }))}
          style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "6px 10px", fontSize: 12.5, color: INK, width: 150 }} />
        <label style={{ fontSize: 12, color: "#5b6b78", display: "flex", alignItems: "center", gap: 6 }}>
          Prazo
          <input type="date" defaultValue={a.prazo ?? ""}
            onChange={(e) => run(() => atualizarAcao5w2h(a.id, { prazo: e.target.value || null }))}
            style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "5px 8px", fontSize: 12.5, color: INK }} />
        </label>
        {!feita && (
          <button onClick={() => run(() => setStatusAcao5w2h(a.id, PROXIMO_STATUS[a.status]))}
            style={{ border: "1px solid #cfe0ee", background: "#f4f8fb", color: BLUE, fontWeight: 700, fontSize: 11.5, padding: "5px 11px", borderRadius: 999, cursor: "pointer" }}>
            {ROTULO_STATUS[a.status]} →
          </button>
        )}
      </div>
    </div>
  );
}
