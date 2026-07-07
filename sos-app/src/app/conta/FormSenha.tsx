"use client";

import { useActionState } from "react";
import { trocarSenha, type SenhaState } from "./actions";

const initial: SenhaState = {};
const campo: React.CSSProperties = { border: "1.5px solid #d9e2ea", borderRadius: 10, padding: "11px 13px", fontSize: 15, color: "#0e1a24", width: "100%" };
const label: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#46586a", marginBottom: 6, display: "block" };

export default function FormSenha() {
  const [state, action, pending] = useActionState(trocarSenha, initial);
  return (
    <form action={action} style={{ display: "grid", gap: 16, maxWidth: 380 }}>
      <div><label style={label}>Senha atual</label><input name="atual" type="password" required autoComplete="current-password" style={campo} /></div>
      <div><label style={label}>Nova senha</label><input name="nova" type="password" required autoComplete="new-password" style={campo} /></div>
      <div><label style={label}>Confirmar nova senha</label><input name="confirma" type="password" required autoComplete="new-password" style={campo} /></div>

      {state.erro && <p role="alert" style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#c0392b", background: "#fdecea", border: "1px solid #f5c6c0", borderRadius: 8, padding: "9px 12px" }}>{state.erro}</p>}
      {state.ok && <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#1f7a2e", background: "#eaf7ec", border: "1px solid #bfe3c4", borderRadius: 8, padding: "9px 12px" }}>✓ Senha alterada com sucesso.</p>}

      <button type="submit" disabled={pending} style={{ border: "none", background: pending ? "#7fb4d8" : "#0068a9", color: "#fff", fontWeight: 700, fontSize: 15, padding: "12px 16px", borderRadius: 10, cursor: pending ? "default" : "pointer" }}>
        {pending ? "Salvando…" : "Alterar senha"}
      </button>
    </form>
  );
}
