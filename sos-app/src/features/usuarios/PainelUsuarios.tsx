"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { criarUsuario, atualizarUsuario, alternarAtivo, redefinirSenha, type UsuarioState, type Papel } from "./actions";
import type { UsuarioLinha } from "./queries";

const INK = "#0e1a24", BLUE = "#0068a9", GREEN = "#47ad4b";
const ROTULO_PAPEL: Record<Papel, string> = { admin: "Administrador", direcao: "Direção", lider: "Líder de setor" };
const COR_PAPEL: Record<Papel, string> = { admin: "#6b3fa0", direcao: "#0068a9", lider: "#33853a" };
const estadoInicial: UsuarioState = {};

export default function PainelUsuarios({ usuarios, setores, meuId }: {
  usuarios: UsuarioLinha[]; setores: { id: string; nome: string }[]; meuId: string;
}) {
  const [state, formAction, criando] = useActionState(criarUsuario, estadoInicial);
  const [papelNovo, setPapelNovo] = useState<Papel>("lider");
  const router = useRouter();

  return (
    <main style={{ minHeight: "100vh", background: "#eef3f7", padding: "28px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Voltar</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "16px 0 4px", color: INK }}>Usuários e permissões</h1>
        <p style={{ margin: "0 0 22px", color: "#5b6b78", fontSize: 14 }}>
          Cada <b>líder</b> só enxerga o setor que lidera. <b>Administração</b> e <b>Direção</b> veem todas as áreas.
        </p>

        {/* Novo usuário */}
        <form action={formAction} style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 14, padding: 20, marginBottom: 22, boxShadow: "0 6px 18px rgba(14,26,36,.05)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 14px", color: INK }}>+ Adicionar usuário</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={lbl}>Nome<input name="nome" required style={inp} /></label>
            <label style={lbl}>E-mail<input name="email" type="email" required style={inp} /></label>
            <label style={lbl}>Senha inicial<input name="senha" type="text" minLength={6} required placeholder="mín. 6 caracteres" style={inp} /></label>
            <label style={lbl}>Papel
              <select name="papel" value={papelNovo} onChange={(e) => setPapelNovo(e.target.value as Papel)} style={{ ...inp, cursor: "pointer" }}>
                <option value="lider">Líder de setor</option>
                <option value="direcao">Direção</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            {papelNovo === "lider" && (
              <label style={{ ...lbl, gridColumn: "1 / -1" }}>Setor que lidera
                <select name="setorId" required style={{ ...inp, cursor: "pointer" }}>
                  <option value="">— escolha o setor —</option>
                  {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </label>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
            <button type="submit" disabled={criando} style={{ border: "none", background: criando ? "#7fbf82" : GREEN, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 18px", borderRadius: 8, cursor: criando ? "default" : "pointer" }}>
              {criando ? "Criando…" : "Criar usuário"}
            </button>
            {state.erro && <span style={{ fontSize: 13, color: "#c0392b" }}>{state.erro}</span>}
            {state.ok && <span style={{ fontSize: 13, color: "#33853a" }}>Usuário criado!</span>}
          </div>
        </form>

        {/* Lista */}
        <div style={{ display: "grid", gap: 8 }}>
          {usuarios.map((u) => (
            <LinhaUsuario key={u.id} u={u} setores={setores} ehVoceMesmo={u.id === meuId} onMudou={() => router.refresh()} />
          ))}
        </div>
      </div>
    </main>
  );
}

function LinhaUsuario({ u, setores, ehVoceMesmo, onMudou }: {
  u: UsuarioLinha; setores: { id: string; nome: string }[]; ehVoceMesmo: boolean; onMudou: () => void;
}) {
  const [, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; erro?: string }>) =>
    start(async () => { const r = await fn(); if (!r.ok && r.erro) setErro(r.erro); else { setErro(null); onMudou(); } });

  return (
    <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 10, padding: "12px 14px", opacity: u.ativo ? 1 : 0.6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: "#eef4f9", display: "grid", placeItems: "center", flexShrink: 0 }}>
          {u.temFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/foto/${u.id}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : <span style={{ fontSize: 16, fontWeight: 800, color: BLUE }}>{u.nome.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div style={{ minWidth: 160 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: INK }}>{u.nome}{ehVoceMesmo && <span style={{ fontSize: 11, color: "#8493a0", fontWeight: 600 }}> (você)</span>}</div>
          <div style={{ fontSize: 12, color: "#8493a0" }}>{u.email}</div>
        </div>

        {/* Papel + setor (editáveis) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <select value={u.papel} disabled={ehVoceMesmo}
            onChange={(e) => { const p = e.target.value as Papel; run(() => atualizarUsuario(u.id, p, p === "lider" ? (u.setorId ?? setores[0]?.id ?? null) : null)); }}
            style={{ border: `1px solid ${COR_PAPEL[u.papel]}`, color: COR_PAPEL[u.papel], background: "#fff", fontWeight: 700, fontSize: 12, padding: "5px 8px", borderRadius: 8, cursor: ehVoceMesmo ? "not-allowed" : "pointer" }}>
            <option value="lider">Líder</option>
            <option value="direcao">Direção</option>
            <option value="admin">Admin</option>
          </select>
          {u.papel === "lider" && (
            <select value={u.setorId ?? ""} onChange={(e) => run(() => atualizarUsuario(u.id, "lider", e.target.value || null))}
              style={{ border: "1px solid #dce6ee", color: INK, background: "#fff", fontSize: 12, padding: "5px 8px", borderRadius: 8, cursor: "pointer" }}>
              <option value="">— setor —</option>
              {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          )}
          <button onClick={() => { const nova = prompt(`Nova senha para ${u.nome} (mín. 6):`); if (nova) run(() => redefinirSenha(u.id, nova)); }}
            style={{ border: "1px solid #cfe0ee", background: "#fff", color: BLUE, fontWeight: 700, fontSize: 11.5, padding: "5px 10px", borderRadius: 8, cursor: "pointer" }}>
            🔑 Senha
          </button>
          <button onClick={() => run(() => alternarAtivo(u.id, !u.ativo))} disabled={ehVoceMesmo}
            style={{ border: "1px solid", borderColor: u.ativo ? "#f0c0bd" : "#cfe0d0", background: "#fff", color: u.ativo ? "#c0392b" : "#33853a", fontWeight: 700, fontSize: 11.5, padding: "5px 10px", borderRadius: 8, cursor: ehVoceMesmo ? "not-allowed" : "pointer" }}>
            {u.ativo ? "Desativar" : "Reativar"}
          </button>
        </div>
      </div>
      {erro && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#c0392b" }}>{erro}</p>}
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#5b6b78", display: "grid", gap: 4 };
const inp: React.CSSProperties = { border: "1px solid #dce6ee", borderRadius: 8, padding: "8px 10px", fontSize: 13.5, color: "#0e1a24" };
