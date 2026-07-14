import Link from "next/link";
import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { matrizDoSetor } from "@/features/raci/queries";
import PainelRaci from "@/features/raci/PainelRaci";

// Matriz de Responsabilidade (RACI) do setor — resolve o pilar
// "Responsabilidades" da Governança Operacional.
export default async function RaciPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const matriz = await matrizDoSetor(id);

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 1100, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${id}`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>
          ‹ Voltar ao setor
        </Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, color: "#0e1a24" }}>
          Matriz de Responsabilidade — {setor.nome}
        </h1>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: "6px solid #0068a9" }}>
        <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "#8493a0", lineHeight: 1.6 }}>
          Quem é responsável por cada atividade? Esta matriz responde ao pilar <b>Responsabilidades</b> da{" "}
          <b>Governança Operacional</b>: define quem executa, quem aprova, quem é consultado e quem é informado —
          eliminando o “ninguém sabe quem deveria resolver”.
        </p>
        <PainelRaci setorId={id} setorNome={setor.nome} matriz={matriz} />
      </div>
    </div>
  );
}
