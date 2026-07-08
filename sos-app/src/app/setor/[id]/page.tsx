import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import AvaliacaoSetor from "@/features/assessments/AvaliacaoSetor";

export default async function SetorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const maturidade = await maturidadeDoSetor(id);

  return <AvaliacaoSetor setorId={id} setorNome={setor.nome} maturidade={maturidade} />;
}
