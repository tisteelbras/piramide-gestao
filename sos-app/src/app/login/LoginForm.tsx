"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} style={{ display: "grid", gap: 16 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#46586a" }}>Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@steelbras.com.br"
          style={{
            border: "1.5px solid #d9e2ea",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 15,
            color: "#0e1a24",
          }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#46586a" }}>Senha</span>
        <input
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          style={{
            border: "1.5px solid #d9e2ea",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 15,
            color: "#0e1a24",
          }}
        />
      </label>

      {state.erro && (
        <p
          role="alert"
          style={{
            margin: 0,
            fontSize: 13.5,
            fontWeight: 600,
            color: "#c0392b",
            background: "#fdecea",
            border: "1px solid #f5c6c0",
            borderRadius: 8,
            padding: "9px 12px",
          }}
        >
          {state.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          border: "none",
          background: pending ? "#7fb4d8" : "#0068a9",
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          padding: "13px 16px",
          borderRadius: 10,
          cursor: pending ? "default" : "pointer",
          boxShadow: "0 6px 18px rgba(0,104,169,.28)",
          transition: "background .2s",
        }}
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
