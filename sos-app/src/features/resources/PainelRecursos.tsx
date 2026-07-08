"use client";

import { useState, useTransition } from "react";
import {
  addColaborador, removeColaborador, salvarNotaColaborador,
  addSistema, setNotaSistema, removeSistema,
  addAtivo, setNotaAtivo, removeAtivo,
} from "./actions";
import { EIXOS_RH, type RecursosDoSetor } from "./tipos";

const BLUE = "#0068a9", GREEN = "#47ad4b", GREEN_D = "#33853a", INK = "#0e1a24";

type Aba = "rh" | "sistemico" | "estrutural";
const ABAS: { id: Aba; label: string }[] = [
  { id: "rh", label: "Recursos Humanos" },
  { id: "sistemico", label: "Sistemas" },
  { id: "estrutural", label: "Estrutura" },
];

const inputStyle: React.CSSProperties = { border: "1px solid #dce6ee", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: INK, flex: 1, minWidth: 0 };
const addBtn: React.CSSProperties = { border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer" };
const delBtn: React.CSSProperties = { border: "none", background: "transparent", color: "#c0ccd6", fontSize: 18, cursor: "pointer", lineHeight: 1 };

function Slider({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 150, flex: 1 }}>
      <input type="range" min={0} max={100} step={5} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: BLUE }} />
      <span style={{ width: 34, textAlign: "right", fontWeight: 800, color: BLUE, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{value ?? 0}</span>
    </div>
  );
}

export default function PainelRecursos({
  setorId,
  avaliacaoId,
  recursos,
}: {
  setorId: string;
  avaliacaoId: string;
  recursos: RecursosDoSetor;
}) {
  const [aba, setAba] = useState<Aba>("rh");
  const [, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn(); });

  return (
    <div style={{ marginTop: 18, borderTop: "1px solid #e3ebf1", paddingTop: 16 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {ABAS.map((a) => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{ border: aba === a.id ? `2px solid ${GREEN}` : "1px solid #dce6ee", background: aba === a.id ? GREEN : "#fff", color: aba === a.id ? "#fff" : "#5b6b78", fontWeight: 700, fontSize: 12.5, padding: "7px 12px", borderRadius: 8, cursor: "pointer" }}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === "rh" && <AbaRh setorId={setorId} avaliacaoId={avaliacaoId} colaboradores={recursos.colaboradores} run={run} />}
      {aba === "sistemico" && <AbaSistemas setorId={setorId} sistemas={recursos.sistemas} run={run} />}
      {aba === "estrutural" && <AbaAtivos setorId={setorId} ativos={recursos.ativos} run={run} />}
    </div>
  );
}

function CadastroInline({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <input value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onAdd(v.trim()); setV(""); } }} style={inputStyle} />
      <button style={addBtn} onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }}>+ Adicionar</button>
    </div>
  );
}

function AbaRh({ setorId, avaliacaoId, colaboradores, run }: { setorId: string; avaliacaoId: string; colaboradores: RecursosDoSetor["colaboradores"]; run: (fn: () => Promise<unknown>) => void }) {
  const media = (notas: Record<string, number | null>) => {
    const vals = EIXOS_RH.map((e) => notas[e.id]).filter((n): n is number => n != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  return (
    <div>
      {colaboradores.length === 0 && <p style={{ fontSize: 13, color: "#a2afba", fontStyle: "italic", margin: "4px 0" }}>Nenhum colaborador. Cadastre a equipe abaixo.</p>}
      <div style={{ display: "grid", gap: 10 }}>
        {colaboradores.map((c) => (
          <div key={c.id} style={{ border: "1px solid #e3ebf1", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontWeight: 800, color: INK, fontSize: 14 }}>{c.nome}</span>
              {media(c.notas) != null && <span style={{ fontSize: 12, fontWeight: 700, color: GREEN_D, background: "#eef7ef", padding: "2px 8px", borderRadius: 999 }}>média {media(c.notas)}</span>}
              <button style={{ ...delBtn, marginLeft: "auto" }} onClick={() => run(() => removeColaborador(c.id))} aria-label="Remover">×</button>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {EIXOS_RH.map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 88, fontSize: 12.5, color: "#5b6b78", fontWeight: 600 }}>{e.label}</span>
                  <Slider value={c.notas[e.id] ?? null} onChange={(n) => run(() => salvarNotaColaborador({ avaliacaoId, colaboradorId: c.id, eixo: e.id, nota: n }))} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <CadastroInline placeholder="Nome do colaborador" onAdd={(nome) => run(() => addColaborador(setorId, nome))} />
    </div>
  );
}

function AbaSistemas({ setorId, sistemas, run }: { setorId: string; sistemas: RecursosDoSetor["sistemas"]; run: (fn: () => Promise<unknown>) => void }) {
  const [necAberta, setNecAberta] = useState(false);
  const [necNome, setNecNome] = useState("");
  const [necJust, setNecJust] = useState("");

  const salvarNecessidade = () => {
    if (!necNome.trim()) return;
    run(() => addSistema(setorId, necNome.trim(), true, necJust));
    setNecNome(""); setNecJust(""); setNecAberta(false);
  };

  return (
    <div>
      {sistemas.length === 0 && <p style={{ fontSize: 13, color: "#a2afba", fontStyle: "italic", margin: "4px 0" }}>Nenhum sistema. Cadastre ERP, Ferramentas de Gestão, Planner, MRP…</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {sistemas.map((s) => (
          <div key={s.id} style={{ border: s.ehNecessidade ? "1px solid #f0c0bd" : "1px solid #e3ebf1", borderRadius: 10, padding: "8px 12px", background: s.ehNecessidade ? "#fff9f8" : "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700, color: INK, fontSize: 13.5, minWidth: 110 }}>{s.nome}</span>
              {s.ehNecessidade
                ? <span style={{ fontSize: 11.5, fontWeight: 700, color: "#c0392b", background: "#fdecea", padding: "3px 9px", borderRadius: 999 }}>necessidade</span>
                : <Slider value={s.nota} onChange={(n) => run(() => setNotaSistema(s.id, n))} />}
              <button style={{ ...delBtn, marginLeft: "auto" }} onClick={() => run(() => removeSistema(s.id))} aria-label="Remover">×</button>
            </div>
            {s.ehNecessidade && s.justificativa && (
              <p style={{ margin: "6px 0 0 0", fontSize: 12.5, color: "#8a5a52", lineHeight: 1.4 }}>
                <b>Como melhoraria a gestão:</b> {s.justificativa}
              </p>
            )}
          </div>
        ))}
      </div>
      <CadastroInline placeholder="Nome do sistema que você USA (ex.: ERP)" onAdd={(nome) => run(() => addSistema(setorId, nome))} />

      {!necAberta ? (
        <p style={{ fontSize: 12.5, color: "#8493a0", marginTop: 10 }}>
          Falta um sistema importante?{" "}
          <button onClick={() => setNecAberta(true)} style={{ border: "none", background: "transparent", color: BLUE, fontWeight: 700, cursor: "pointer", textDecoration: "underline", fontSize: 12.5 }}>
            Registrar necessidade
          </button>
        </p>
      ) : (
        <div style={{ marginTop: 10, border: "1.5px dashed #e0908a", background: "#fff9f8", borderRadius: 12, padding: 14, display: "grid", gap: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#c0392b" }}>Sistema que falta (vira necessidade)</div>
          <input autoFocus value={necNome} placeholder="Nome do sistema (ex.: MRP Local)" onChange={(e) => setNecNome(e.target.value)} style={inputStyle} />
          <textarea value={necJust} placeholder="Explique como esse sistema poderia melhorar a sua gestão…" onChange={(e) => setNecJust(e.target.value)} rows={2}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={addBtn} onClick={salvarNecessidade}>Registrar</button>
            <button onClick={() => { setNecAberta(false); setNecNome(""); setNecJust(""); }} style={{ border: "1px solid #dce6ee", background: "#fff", color: "#5b6b78", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaAtivos({ setorId, ativos, run }: { setorId: string; ativos: RecursosDoSetor["ativos"]; run: (fn: () => Promise<unknown>) => void }) {
  return (
    <div>
      {ativos.length === 0 && <p style={{ fontSize: 13, color: "#a2afba", fontStyle: "italic", margin: "4px 0" }}>Nenhum ativo. Cadastre máquinas, hardware, estrutura…</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {ativos.map((a) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e3ebf1", borderRadius: 10, padding: "8px 12px" }}>
            <span style={{ fontWeight: 700, color: INK, fontSize: 13.5, minWidth: 110 }}>{a.nome}</span>
            <Slider value={a.nota} onChange={(n) => run(() => setNotaAtivo(a.id, n))} />
            <button style={{ ...delBtn, marginLeft: "auto" }} onClick={() => run(() => removeAtivo(a.id))} aria-label="Remover">×</button>
          </div>
        ))}
      </div>
      <CadastroInline placeholder="Nome do ativo (ex.: Empilhadeira)" onAdd={(nome) => run(() => addAtivo(setorId, nome))} />
    </div>
  );
}
