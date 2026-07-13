"use client";

import { useEffect, useState } from "react";

// Saudação pelo horário LOCAL de quem está vendo a tela (por isso é
// client component — o servidor pode estar em outro fuso).
function saudacaoDoMomento(hora: number): { texto: string; emoji: string } {
  if (hora >= 5 && hora < 12) return { texto: "Bom dia", emoji: "☕" };
  if (hora >= 12 && hora < 18) return { texto: "Boa tarde", emoji: "🚀" };
  return { texto: "Boa noite", emoji: "🌙" };
}

export default function Saudacao({ nome }: { nome: string | null }) {
  // Renderiza vazio no servidor e resolve no cliente (evita mismatch de
  // hidratação por diferença de fuso/hora). O setState único pós-mount é
  // intencional — é o padrão "conteúdo só no cliente".
  const [agora, setAgora] = useState<Date | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setAgora(new Date()); }, []);

  const primeiroNome = nome?.trim().split(/\s+/)[0] ?? null;
  if (!agora) {
    return <span style={{ display: "block", minHeight: 30 }} aria-hidden />;
  }
  const { texto, emoji } = saudacaoDoMomento(agora.getHours());
  const dataFmt = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <span style={{ fontSize: "clamp(19px,2.6vw,24px)", fontWeight: 800, color: "#0e1a24" }}>
        {texto}{primeiroNome ? `, ${primeiroNome}` : ""}! {emoji}
      </span>
      <span style={{ display: "block", fontSize: 12.5, color: "#8493a0", fontWeight: 600, textTransform: "capitalize" }}>{dataFmt}</span>
    </div>
  );
}
