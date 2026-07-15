import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { carregarControles } from "@/features/controles/queries";
import PainelControles from "@/features/controles/PainelControles";

export default async function ControlesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const dados = await carregarControles(id);
  return <PainelControles setorId={id} setorNome={setor.nome} dados={dados} />;
}
