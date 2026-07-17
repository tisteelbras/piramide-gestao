import Link from "next/link";
import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { carregarProcessos } from "@/features/processes/queries";
import PainelMapaFases from "@/features/processes/PainelMapaFases";

// Mapa de Processos do setor — em que FASE do ciclo (Padronização, Execução,
// Planejamento, Monitoramento, Melhoria) cada processo se encontra. A fase é
// o gargalo (eixo mais fraco), calculado da maturidade já avaliada. Para o
// passo a passo de execução de cada processo, use o Fluxograma.
export default async function MapaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const processos = await carregarProcessos(id);

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 980, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${id}/avaliar#processos`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>
          ‹ Voltar aos processos
        </Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, color: "#0e1a24" }}>
          Mapa de Processos — {setor.nome}
        </h1>
      </header>

      <div style={{ maxWidth: 980, margin: "0 auto", background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: "6px solid #0068a9" }}>
        <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "#8493a0", lineHeight: 1.6 }}>
          Onde cada processo se encontra <b>estrategicamente</b>: em qual das cinco fases do ciclo de gestão —{" "}
          <b>Padronização → Execução → Planejamento → Monitoramento → Melhoria Contínua</b> — ele está hoje. A fase é o
          ponto mais fraco do processo, a próxima etapa a evoluir.
        </p>
        <PainelMapaFases setorId={id} setorNome={setor.nome} processos={processos} />
      </div>
    </div>
  );
}
