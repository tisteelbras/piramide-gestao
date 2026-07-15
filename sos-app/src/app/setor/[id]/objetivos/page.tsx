import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { carregarObjetivos } from "@/features/objetivos/queries";
import PainelObjetivos from "@/features/objetivos/PainelObjetivos";

export default async function ObjetivosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const dados = await carregarObjetivos(id);
  return <PainelObjetivos setorId={id} setorNome={setor.nome} dados={dados} />;
}
