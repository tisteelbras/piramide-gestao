import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { carregarSwot } from "@/features/swot/queries";
import PainelSwot from "@/features/swot/PainelSwot";

export default async function SwotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const swot = await carregarSwot(id);
  return <PainelSwot setorId={id} setorNome={setor.nome} swot={swot} />;
}
