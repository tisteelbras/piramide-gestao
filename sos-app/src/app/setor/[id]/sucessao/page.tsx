import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { carregarSucessao } from "@/features/sucessao/queries";
import PainelSucessao from "@/features/sucessao/PainelSucessao";

export default async function SucessaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const dados = await carregarSucessao(id);
  return <PainelSucessao setorId={id} setorNome={setor.nome} dados={dados} />;
}
