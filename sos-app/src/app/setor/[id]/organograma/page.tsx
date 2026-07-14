import Link from "next/link";
import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { organogramaDoSetor } from "@/features/organograma/queries";
import PainelOrganograma from "@/features/organograma/PainelOrganograma";

export default async function OrganogramaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const pessoas = await organogramaDoSetor(id);

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 900, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${id}`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>
          ‹ Voltar ao setor
        </Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, color: "#0e1a24" }}>
          Organograma — {setor.nome}
        </h1>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: "6px solid #0068a9" }}>
        <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#8493a0" }}>
          Monte a estrutura da área: cadastre cada pessoa com <b>nome</b> e <b>função</b>, e defina <b>a quem ela responde</b>.
          O PDF gerado é anexado à etapa <b>Estrutura Organizacional</b> da Visão, e as pessoas alimentam o Recurso <b>Humano</b>.
        </p>
        <PainelOrganograma setorId={id} setorNome={setor.nome} pessoas={pessoas} />
      </div>
    </div>
  );
}
