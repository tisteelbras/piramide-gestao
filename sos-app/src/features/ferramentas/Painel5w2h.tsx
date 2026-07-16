"use client";

import { useState, useTransition } from "react";
import {
  criarPlano5w2h, removerPlano5w2h,
  addAcao5w2h, atualizarAcao5w2h, setStatusAcao5w2h, removerAcao5w2h,
} from "./actions";
import { PROXIMO_STATUS, ROTULO_STATUS, type Acao5w2hDTO, type PlanoComAcoes, type SetorOpcao } from "./tipos";
import BotaoGerarDoc from "@/features/documentos/BotaoGerarDoc";

const BLUE = "#0068a9", GREEN = "#47ad4b", GREEN_D = "#33853a", INK = "#0e1a24";
const COR_STATUS: Record<string, { bg: string; fg: string; borda: string }> = {
  pendente: { bg: "#f0f4f8", fg: "#5b6b78", borda: "#dce6ee" },
  em_andamento: { bg: "#fdf3e0", fg: "#8a5a08", borda: "#f0dcb0" },
  concluida: { bg: "#eef7ef", fg: GREEN_D, borda: "#cfe0d0" },
};

const inputStyle: React.CSSProperties = { border: "1px solid #dce6ee", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: INK, minWidth: 0 };

// As 7 perguntas do 5W2H, na ordem clássica.
const CAMPOS: { id: keyof Omit<Acao5w2hDTO, "id" | "status">; label: string; dica: string }[] = [
  { id: "oQue", label: "O quê? (What)", dica: "A ação em si" },
  { id: "porQue", label: "Por quê? (Why)", dica: "Justificativa / objetivo" },
  { id: "onde", label: "Onde? (Where)", dica: "Local / área" },
  { id: "quando", label: "Quando? (When)", dica: "Prazo / data" },
  { id: "quem", label: "Quem? (Who)", dica: "Responsável" },
  { id: "como", label: "Como? (How)", dica: "Método / passos" },
  { id: "quantoCusta", label: "Quanto custa? (How much)", dica: "Custo estimado" },
];

export default function Painel5w2h({ planos, setores }: { planos: PlanoComAcoes[]; setores: SetorOpcao[] }) {
  const [titulo, setTitulo] = useState("");
  const [setorId, setSetorId] = useState("");
  const [, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn(); });

  const criar = () => {
    if (!titulo.trim()) return;
    run(() => criarPlano5w2h(titulo.trim(), setorId || null));
    setTitulo(""); setSetorId("");
  };

  return (
    <div>
      {/* Novo plano */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <input value={titulo} placeholder="Título do plano (ex.: Reduzir atrasos de entrega)" onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") criar(); }} style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <select value={setorId} onChange={(e) => setSetorId(e.target.value)} style={{ ...inputStyle, background: "#fff", maxWidth: 200 }}>
          <option value="">Sem setor vinculado</option>
          {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <button onClick={criar} style={{ border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>+ Criar plano</button>
      </div>

      {planos.length === 0 && (
        <p style={{ fontSize: 13.5, color: "#a2afba", fontStyle: "italic" }}>
          Nenhum plano ainda. Crie o primeiro acima — cada plano reúne ações com as 7 perguntas do 5W2H.
        </p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {planos.map((p) => <CardPlano key={p.id} plano={p} run={run} />)}
      </div>
    </div>
  );
}

function CardPlano({ plano: p, run }: { plano: PlanoComAcoes; run: (fn: () => Promise<unknown>) => void }) {
  const [aberto, setAberto] = useState(false);
  const [novaAcao, setNovaAcao] = useState("");
  const concluidas = p.acoes.filter((a) => a.status === "concluida").length;
  const pct = p.acoes.length ? Math.round((concluidas / p.acoes.length) * 100) : 0;

  const adicionar = () => {
    if (!novaAcao.trim()) return;
    run(() => addAcao5w2h(p.id, novaAcao.trim()));
    setNovaAcao("");
  };

  return (
    <div style={{ border: "1px solid #e3ebf1", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
      <button onClick={() => setAberto((a) => !a)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: aberto ? "#f4f8fb" : "#fff", border: "none", cursor: "pointer", textAlign: "left", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 800, color: INK, fontSize: 15 }}>{p.titulo}</span>
        {p.setorNome && <span style={{ fontSize: 10.5, fontWeight: 800, color: "#004e80", background: "#eaf2f8", padding: "2px 8px", borderRadius: 999 }}>{p.setorNome}</span>}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#5b6b78" }}>{concluidas}/{p.acoes.length} ações</span>
          <span style={{ width: 90, height: 8, background: "#eef4f9", borderRadius: 999, overflow: "hidden", display: "inline-block" }}>
            <span style={{ display: "block", width: `${pct}%`, height: "100%", background: GREEN }} />
          </span>
          <span style={{ color: "#004e80", transform: aberto ? "rotate(90deg)" : "none", transition: "transform .2s", fontWeight: 800 }}>›</span>
        </span>
      </button>

      {aberto && (
        <div style={{ padding: "4px 16px 16px", display: "grid", gap: 10 }}>
          {p.acoes.map((a) => <LinhaAcao key={a.id} acao={a} run={run} />)}
          <div style={{ display: "flex", gap: 8 }}>
            <input value={novaAcao} placeholder='Nova ação — comece pelo "O quê?"' onChange={(e) => setNovaAcao(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={adicionar} style={{ border: "none", background: BLUE, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>+ Ação</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* PDF rastreável (ISO 9001): o 5W2H vira documento com código,
                autor e data — as 7 perguntas de cada ação em tabela. */}
            <BotaoGerarDoc montarDoc={() => {
              const complementos = p.acoes.flatMap((a) => {
                const extras: { rotulo: string; valor: string }[] = [];
                if (a.onde) extras.push({ rotulo: `${a.oQue} · Onde`, valor: a.onde });
                if (a.quantoCusta) extras.push({ rotulo: `${a.oQue} · Quanto custa`, valor: a.quantoCusta });
                return extras;
              });
              return {
                tipo: "Plano 5W2H",
                titulo: p.titulo,
                setorId: p.setorId,
                setorNome: p.setorNome,
                secoes: [
                  { tipo: "tabela" as const, titulo: "Ações",
                    colunas: ["O quê", "Por quê", "Quem", "Quando", "Como", "Status"],
                    linhas: p.acoes.map((a) => [
                      a.oQue, a.porQue ?? "—", a.quem ?? "—", a.quando ?? "—", a.como ?? "—", ROTULO_STATUS[a.status],
                    ]) },
                  ...(complementos.length
                    ? [{ tipo: "campos" as const, titulo: "Complementos (Onde / Quanto custa)", campos: complementos }]
                    : []),
                ],
              };
            }} />
            <button onClick={() => { if (confirm(`Remover o plano "${p.titulo}" e todas as suas ações?`)) run(() => removerPlano5w2h(p.id)); }}
              style={{ border: "1px solid #f0d0cd", background: "#fff", color: "#c0392b", fontWeight: 700, fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}>
              Remover plano
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LinhaAcao({ acao: a, run }: { acao: Acao5w2hDTO; run: (fn: () => Promise<unknown>) => void }) {
  const [aberta, setAberta] = useState(false);
  const [campos, setCampos] = useState<Record<string, string>>(
    Object.fromEntries(CAMPOS.map((c) => [c.id, (a[c.id] as string | null) ?? ""])),
  );
  const cor = COR_STATUS[a.status];

  const salvarCampo = (id: string) =>
    run(() => atualizarAcao5w2h(a.id, { [id]: campos[id] }));

  return (
    <div style={{ border: "1px solid #e3ebf1", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px" }}>
        <button onClick={() => run(() => setStatusAcao5w2h(a.id, PROXIMO_STATUS[a.status]))}
          title="Clique para avançar o status"
          style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap", background: cor.bg, color: cor.fg, border: `1px solid ${cor.borda}` }}>
          {ROTULO_STATUS[a.status]}
        </button>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: a.status === "concluida" ? "#8493a0" : INK, textDecoration: a.status === "concluida" ? "line-through" : "none" }}>
          {a.oQue}
        </span>
        {a.quem && <span style={{ fontSize: 11.5, color: "#5b6b78", whiteSpace: "nowrap" }}>👤 {a.quem}</span>}
        {a.quando && <span style={{ fontSize: 11.5, color: "#5b6b78", whiteSpace: "nowrap" }}>📅 {a.quando}</span>}
        <button onClick={() => setAberta((x) => !x)} aria-label="Editar 5W2H"
          style={{ border: "1px solid #dce6ee", background: "#fff", color: "#0068a9", fontWeight: 700, fontSize: 11.5, padding: "4px 9px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}>
          {aberta ? "▴ fechar" : "▾ 5W2H"}
        </button>
        <button onClick={() => run(() => removerAcao5w2h(a.id))} aria-label="Remover ação"
          style={{ border: "none", background: "transparent", color: "#c0ccd6", fontSize: 17, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {aberta && (
        <div style={{ padding: "2px 12px 12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, background: "#fbfdfe" }}>
          {CAMPOS.map((c) => (
            <label key={c.id} style={{ display: "grid", gap: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#5b6b78", textTransform: "uppercase", letterSpacing: ".03em" }}>{c.label}</span>
              <input value={campos[c.id]} placeholder={c.dica}
                onChange={(e) => setCampos((m) => ({ ...m, [c.id]: e.target.value }))}
                onBlur={() => salvarCampo(c.id)}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                style={inputStyle} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
