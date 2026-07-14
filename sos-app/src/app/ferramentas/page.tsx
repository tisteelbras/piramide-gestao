// Hub de ferramentas do NEXO. Duas naturezas, duas seções:
//
//  - DO DIAGNÓSTICO (por setor): organograma, matriz de responsabilidade
//    e mapa de processos. Sustentam os pilares do modelo e não existem
//    sem um setor — por isso têm seletor de setor e mostram o que falta.
//  - DE ANÁLISE (empresa): 5W2H, Ishikawa e BCG, para a investigação
//    clínica quando o diagnóstico aponta um problema.
import Link from "next/link";
import { auth } from "@/auth";
import CabecalhoFerramenta from "@/features/ferramentas/CabecalhoFerramenta";
import FerramentasDiagnostico from "@/features/ferramentas/FerramentasDiagnostico";
import { resumoFerramentas } from "@/features/ferramentas/queries";
import { statusDiagnosticoPorSetor } from "@/features/ferramentas/queries-diagnostico";
import { FERRAMENTAS, ROTULO_QUADRANTE, type Quadrante } from "@/features/ferramentas/tipos";

export default async function FerramentasPage() {
  const [session, resumo, diagnostico] = await Promise.all([
    auth(),
    resumoFerramentas(),
    statusDiagnosticoPorSetor(),
  ]);

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
        titulo="NEXO · Ferramentas"
        subtitulo="As ferramentas que sustentam o diagnóstico de cada setor e as que apoiam a análise clínica quando um problema aparece."
        usuarioNome={session?.user?.name ?? null}
      />

      {/* ——— Ferramentas do diagnóstico (por setor) ——— */}
      <section style={{ maxWidth: 1160, margin: "0 auto 34px" }}>
        <Secao
          titulo="Do diagnóstico"
          descricao="Sustentam os pilares do modelo NEXO. Cada uma pertence a um setor e alimenta a pirâmide."
        />
        <FerramentasDiagnostico setores={diagnostico} />
      </section>

      {/* ——— Ferramentas de análise (empresa) ——— */}
      <section style={{ maxWidth: 1160, margin: "0 auto" }}>
        <Secao
          titulo="De análise"
          descricao="Para investigar a fundo quando o diagnóstico aponta um problema. Valem para a empresa toda."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {FERRAMENTAS.map((f) => (
            <Link key={f.id} href={f.href}
              style={{ textDecoration: "none", background: "#fff", border: "1px solid #e3ebf1", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(14,26,36,.06)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span aria-hidden style={{ fontSize: 24 }}>{f.emoji}</span>
                <span style={{ fontSize: 15.5, fontWeight: 800, color: "#0e1a24" }}>{f.nome}</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0068a9" }}>{f.pergunta}</span>
              <span style={{ fontSize: 12.5, color: "#5b6b78", lineHeight: 1.45 }}>{f.descricao}</span>
              <span style={{ marginTop: "auto", paddingTop: 8, fontSize: 12, fontWeight: 700, color: "#8493a0", borderTop: "1px dashed #e3ebf1" }}>
                {stats[f.id]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <p style={{ maxWidth: 1160, margin: "22px auto 0", fontSize: 12.5, color: "#8493a0" }}>
        Tudo o que é preenchido aqui agrega automaticamente no{" "}
        <Link href="/" style={{ color: "#0068a9", fontWeight: 700 }}>Dashboard executivo</Link>.
      </p>
    </div>
  );
}

function Secao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#8493a0" }}>
        {titulo}
      </h2>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5b6b78" }}>{descricao}</p>
    </div>
  );
}
