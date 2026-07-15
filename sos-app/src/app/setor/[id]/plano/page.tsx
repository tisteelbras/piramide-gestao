import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { carregarPlanoDoSetor } from "@/features/action-plan/queries";
import PlanoDoSetor from "@/features/action-plan/PlanoDoSetor";

export default async function PlanoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const plano = await carregarPlanoDoSetor(id);

  return <PlanoDoSetor setorId={id} setorNome={setor.nome} plano={plano} />;
}
