import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { carregarResultados } from "@/features/results/queries";
import PainelIndicadores from "@/features/results/PainelIndicadores";

export default async function IndicadoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const { indicadores } = await carregarResultados(id);
  return <PainelIndicadores setorId={id} setorNome={setor.nome} indicadores={indicadores} />;
}
