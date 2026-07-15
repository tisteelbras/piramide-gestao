"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Saudação pelo horário LOCAL de quem vê a tela.
function saudacaoDoMomento(hora: number): { texto: string; emoji: string } {
  if (hora >= 5 && hora < 12) return { texto: "Bom dia", emoji: "☕" };
  if (hora >= 12 && hora < 18) return { texto: "Boa tarde", emoji: "🚀" };
  return { texto: "Boa noite", emoji: "🌙" };
}

const ROTULO_PAPEL: Record<string, string> = {
  admin: "Administrador", direcao: "Direção", lider: "Líder de setor",
};

// Iniciais para o avatar quando não há foto.
function iniciais(nome: string | null): string {
  if (!nome) return "?";
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

/** Card de boas-vindas: logo Steelbras destacada, foto (ou iniciais) do
 *  usuário e a saudação. Dentro da identidade visual do NEXO. */
export default function CartaoSaudacao({ nome, usuarioId, temFoto, papel }: {
  nome: string | null; usuarioId: string | null; temFoto: boolean; papel: string | null;
}) {
  const [agora, setAgora] = useState<Date | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setAgora(new Date()); }, []);

  const primeiroNome = nome?.trim().split(/\s+/)[0] ?? null;
  const s = agora ? saudacaoDoMomento(agora.getHours()) : null;
  const dataFmt = agora
    ? agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    : "";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, background: "linear-gradient(100deg, #003a5c 0%, #0068a9 62%, #1c86c8 100%)", borderRadius: 18, padding: "18px 22px", boxShadow: "0 8px 24px rgba(0,78,128,.22)", flexWrap: "wrap" }}>
      {/* Avatar / foto */}
      <Link href="/conta" title="Alterar foto de perfil"
        style={{ flexShrink: 0, width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,.85)", background: "#e8f1f8", display: "grid", placeItems: "center", textDecoration: "none" }}>
        {temFoto && usuarioId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/foto/${usuarioId}`} alt="Foto de perfil" width={72} height={72} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 26, fontWeight: 800, color: "#0068a9" }}>{iniciais(nome)}</span>
        )}
      </Link>

      {/* Saudação */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ minHeight: 26 }}>
          {s && (
            <span style={{ fontSize: "clamp(20px,2.8vw,26px)", fontWeight: 800, color: "#fff" }}>
              {s.texto}{primeiroNome ? `, ${primeiroNome}` : ""}! {s.emoji}
            </span>
          )}
        </div>
        <span style={{ display: "block", fontSize: 12.5, color: "#cfe4f2", fontWeight: 600, textTransform: "capitalize", marginTop: 2 }}>
          {dataFmt}{papel && ROTULO_PAPEL[papel] ? ` · ${ROTULO_PAPEL[papel]}` : ""}
        </span>
        <span style={{ display: "block", fontSize: 13, color: "#eaf4fb", fontWeight: 700, marginTop: 8 }}>
          NEXO <span style={{ color: "#9fd0ec", fontWeight: 600 }}>· Conectar. Executar. Evoluir.</span>
        </span>
      </div>

      {/* Logo Steelbras — maior, em branco sobre o azul */}
      <div style={{ flexShrink: 0, alignSelf: "flex-start", background: "#fff", borderRadius: 12, padding: "8px 14px" }}>
        <Image src="/steelbras-logo.svg" alt="Steelbras" width={160} height={58} style={{ height: 42, width: "auto" }} priority />
      </div>
    </div>
  );
}
