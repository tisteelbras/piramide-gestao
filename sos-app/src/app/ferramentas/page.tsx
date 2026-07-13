// Hub de ferramentas do NEXO: o SOS é a principal; as demais são
// aditivas e alimentam o dashboard geral.
import Link from "next/link";
import { auth } from "@/auth";
import CabecalhoFerramenta from "@/features/ferramentas/CabecalhoFerramenta";
import { resumoFerramentas } from "@/features/ferramentas/queries";
import { FERRAMENTAS, ROTULO_QUADRANTE, type Quadrante } from "@/features/ferramentas/tipos";

export default async function FerramentasPage() {
  const [session, resumo] = await Promise.all([auth(), resumoFerramentas()]);

  const stats: Record<string, string> = {
    "5w2h": resumo.planos5w2h
      ? `${resumo.planos5w2h} plano${resumo.planos5w2h === 1 ? "" : "s"} · ${resumo.acoesConcluidas}/${resumo.acoes5w2h} ações concluídas`
      : "Nenhum plano ainda",
    ishikawa: resumo.analisesIshikawa
      ? `${resumo.analisesIshikawa} análise${resumo.analisesIshikawa === 1 ? "" : "s"} · ${resumo.causasIshikawa} causas mapeadas`
      : "Nenhuma análise ainda",
    bcg: resumo.itensBcg
      ? `${resumo.itensBcg} it${resumo.itensBcg === 1 ? "em" : "ens"} · ` +
        (Object.entries(resumo.porQuadrante) as [Quadrante, number][])
          .filter(([, n]) => n > 0)
          .map(([q, n]) => `${n} ${ROTULO_QUADRANTE[q]}`)
          .join(", ")
      : "Portfólio vazio",
  };

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <CabecalhoFerramenta
        titulo="NEXO · Ferramentas de apoio"
        subtitulo="Ferramentas que apoiam o diagnóstico NEXO com uma análise mais clínica de cada setor — e alimentam o dashboard geral."
        usuarioNome={session?.user?.name ?? null}
      />

      <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {FERRAMENTAS.map((f) => (
          <Link key={f.id} href={f.href}
            style={{ textDecoration: "none", background: "#fff", border: "1px solid #e3ebf1", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(14,26,36,.06)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 26 }}>{f.emoji}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#0e1a24" }}>{f.nome}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0068a9" }}>{f.pergunta}</span>
            <span style={{ fontSize: 12.5, color: "#5b6b78", lineHeight: 1.45 }}>{f.descricao}</span>
            <span style={{ marginTop: "auto", paddingTop: 8, fontSize: 12, fontWeight: 700, color: "#8493a0", borderTop: "1px dashed #e3ebf1" }}>
              {stats[f.id]}
            </span>
          </Link>
        ))}
      </div>

      <p style={{ maxWidth: 1160, margin: "18px auto 0", fontSize: 12.5, color: "#8493a0" }}>
        Novas ferramentas entram aqui e passam a agregar automaticamente no <Link href="/" style={{ color: "#0068a9", fontWeight: 700 }}>Dashboard executivo</Link>.
      </p>
    </div>
  );
}
