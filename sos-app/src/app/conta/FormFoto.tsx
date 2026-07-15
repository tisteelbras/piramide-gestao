"use client";

import { useActionState, useRef, useState } from "react";
import { salvarFoto, removerFoto, type FotoState } from "./actions";

const estadoInicial: FotoState = {};

export default function FormFoto({ usuarioId, temFoto }: { usuarioId: string; temFoto: boolean }) {
  const [state, formAction, pending] = useActionState(salvarFoto, estadoInicial);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Cache-buster para a foto atual recarregar após salvar.
  const [v] = useState(() => Date.now());

  const mostrarFoto = preview ?? (temFoto ? `/api/foto/${usuarioId}?v=${state.ok ? Date.now() : v}` : null);

  return (
    <form action={formAction} style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <div style={{ width: 84, height: 84, borderRadius: "50%", overflow: "hidden", border: "2px solid #e3ebf1", background: "#eef4f9", display: "grid", placeItems: "center", flexShrink: 0 }}>
        {mostrarFoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mostrarFoto} alt="Prévia" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 30 }}>👤</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 200 }}>
        <input
          ref={inputRef}
          type="file"
          name="foto"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
          style={{ fontSize: 13, color: "#5b6b78" }}
        />
        <p style={{ margin: "6px 0 10px", fontSize: 12, color: "#8493a0" }}>JPG, PNG ou WebP · até 4 MB.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="submit" disabled={pending}
            style={{ border: "none", background: pending ? "#7fb4d8" : "#0068a9", color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 16px", borderRadius: 8, cursor: pending ? "default" : "pointer" }}>
            {pending ? "Enviando…" : "Salvar foto"}
          </button>
          {temFoto && (
            <button type="button" onClick={() => removerFoto()}
              style={{ border: "1px solid #f0c0bd", background: "#fff", color: "#c0392b", fontWeight: 700, fontSize: 13, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>
              Remover
            </button>
          )}
        </div>
        {state.erro && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#c0392b" }}>{state.erro}</p>}
        {state.ok && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#33853a" }}>Foto atualizada!</p>}
      </div>
    </form>
  );
}
