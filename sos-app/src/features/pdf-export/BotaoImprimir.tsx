"use client";

export default function BotaoImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print"
      style={{ border: "none", background: "#0068a9", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 16px", borderRadius: 10, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,104,169,.25)" }}
    >
      ⭳ Salvar em PDF
    </button>
  );
}
