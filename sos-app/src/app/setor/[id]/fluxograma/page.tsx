import Link from "next/link";
import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { fluxogramasDoSetor } from "@/features/fluxograma/queries";
import PainelFluxograma from "@/features/fluxograma/PainelFluxograma";

// Fluxograma do setor — liga os PROCESSOS do N3 em sequência. Vive junto do
// Mapa de Processos (que detalha o passo a passo DENTRO de cada processo).
export default async function FluxogramaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const { fluxogramas, processos } = await fluxogramasDoSetor(id);

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 980, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${id}/avaliar#processos`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>
          ‹ Voltar aos processos
        </Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, color: "#0e1a24" }}>
          Fluxograma — {setor.nome}
        </h1>
      </header>

      <div style={{ maxWidth: 980, margin: "0 auto", background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: "6px solid #0068a9" }}>
        <PainelFluxograma setorId={id} setorNome={setor.nome} fluxogramas={fluxogramas} processos={processos} />
      </div>
    </div>
  );
}
