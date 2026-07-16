import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { carregarObjetivos } from "@/features/objetivos/queries";
import PainelBsc from "@/features/objetivos/PainelBsc";

export default async function BscPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const dados = await carregarObjetivos(id);
  return <PainelBsc setorId={id} setorNome={setor.nome} dados={dados} />;
}
