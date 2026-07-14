import Link from "next/link";
import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { mapaDoSetor } from "@/features/mapa-processos/queries";
import PainelMapa from "@/features/mapa-processos/PainelMapa";

// Mapa de Processos do setor — resolve o pilar "Padronização" da
// Governança Operacional: a forma oficial de executar o trabalho.
export default async function MapaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const mapa = await mapaDoSetor(id);

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 980, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${id}`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>
          ‹ Voltar ao setor
        </Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, color: "#0e1a24" }}>
          Mapa de Processos — {setor.nome}
        </h1>
      </header>

      <div style={{ maxWidth: 980, margin: "0 auto", background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: "6px solid #0068a9" }}>
        <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "#8493a0", lineHeight: 1.6 }}>
          Existe uma forma oficial de executar o trabalho? Este mapa responde ao pilar <b>Padronização</b> da{" "}
          <b>Governança Operacional</b>: para cada processo, o fluxo de execução passo a passo, com a instrução de
          trabalho, quem executa e o que sai de cada etapa.
        </p>
        <PainelMapa setorId={id} setorNome={setor.nome} mapa={mapa} />
      </div>
    </div>
  );
}
