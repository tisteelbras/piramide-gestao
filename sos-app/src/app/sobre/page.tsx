// A página do NEXO — o texto institucional integral da metodologia.
// (O popup de boas-vindas mostra o resumo; aqui fica a versão completa.)
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import {
  TAGLINE, MANIFESTO_ABERTURA, DIMENSOES_NEXO, CADEIA_NEXO, MANIFESTO_FECHAMENTO,
} from "@/features/onboarding/conteudo";
import { NIVEIS } from "@/features/assessments/tipos";

const INK = "#0e1a24", BLUE = "#0068a9";

export default async function SobrePage() {
  const session = await auth();
  const corDimensao = (i: number) => NIVEIS[i]?.cor ?? BLUE;

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 780, margin: "0 auto 28px", display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <Image src="/steelbras-logo.svg" alt="Steelbras" width={130} height={47} style={{ height: 34, width: "auto" }} priority />
          <h1 style={{ fontSize: "clamp(30px,4.5vw,44px)", fontWeight: 800, margin: "14px 0 2px", color: BLUE, letterSpacing: "-.01em" }}>NEXO</h1>
          <p style={{ margin: 0, color: INK, fontSize: "clamp(15px,2vw,18px)", fontWeight: 700 }}>{TAGLINE}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: BLUE, border: "1px solid #cfe0ee", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>▤ Dashboard</Link>
          {session?.user?.name && <Link href="/conta" style={{ fontSize: 12.5, fontWeight: 700, color: "#46586a", textDecoration: "none" }}>{session.user.name}</Link>}
        </div>
      </header>

      <article style={{ maxWidth: 780, margin: "0 auto", background: "#fff", border: "1px solid #e3ebf1", borderRadius: 20, padding: "clamp(22px,4vw,40px)", boxShadow: "0 20px 50px rgba(14,26,36,.08)" }}>
        {MANIFESTO_ABERTURA.map((p, i) => (
          <p key={i} style={{ margin: "0 0 16px", fontSize: 15, color: "#37474f", lineHeight: 1.75 }}>
            {destaqueNexo(p)}
          </p>
        ))}

        {/* As 4 dimensões */}
        <div style={{ display: "grid", gap: 10, margin: "22px 0" }}>
          {DIMENSOES_NEXO.map((d, i) => (
            <div key={d.nome} style={{ borderLeft: `4px solid ${corDimensao(i)}`, background: "#fbfdfe", borderRadius: "0 12px 12px 0", padding: "12px 16px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: corDimensao(i) }}>{d.nome}</div>
              <p style={{ margin: "2px 0 0", fontSize: 13.5, color: "#46586a", lineHeight: 1.6 }}>{d.descricao}</p>
            </div>
          ))}
        </div>

        <p style={{ margin: "0 0 16px", fontSize: 15, color: "#37474f", lineHeight: 1.75 }}>{MANIFESTO_FECHAMENTO[0]}</p>

        {/* A cadeia */}
        <div style={{ textAlign: "center", background: "linear-gradient(90deg, #eaf2f8, #f2faf3)", border: "1px solid #d7e8f4", borderRadius: 14, padding: "16px 18px", margin: "0 0 20px" }}>
          <span style={{ fontSize: "clamp(13px,2.2vw,17px)", fontWeight: 800, color: "#0e4a70", letterSpacing: ".04em", whiteSpace: "nowrap" }}>{CADEIA_NEXO}</span>
        </div>

        {MANIFESTO_FECHAMENTO.slice(1).map((p, i) => (
          <p key={i} style={{ margin: "0 0 16px", fontSize: 15, color: "#37474f", lineHeight: 1.75 }}>
            {destaqueNexo(p)}
          </p>
        ))}

        <div style={{ borderTop: "1px solid #eef2f6", marginTop: 24, paddingTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/setores" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#fff", background: BLUE, padding: "10px 16px", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,104,169,.25)" }}>Avaliar um setor ›</Link>
          <Link href="/" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: BLUE, border: "1px solid #cfe0ee", background: "#fff", padding: "9px 14px", borderRadius: 10 }}>Ver o dashboard</Link>
        </div>
      </article>
    </div>
  );
}

/** Deixa as ocorrências de "NEXO"/"nexus" em destaque no texto corrido. */
function destaqueNexo(texto: string) {
  const partes = texto.split(/(NEXO|nexus)/g);
  return partes.map((t, i) =>
    t === "NEXO"
      ? <b key={i} style={{ color: "#0068a9" }}>NEXO</b>
      : t === "nexus"
        ? <i key={i}>nexus</i>
        : t,
  );
}
