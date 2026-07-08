import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { carregarAvaliacaoDoSetor } from "@/features/assessments/queries";
import AvaliacaoSetor from "@/features/assessments/AvaliacaoSetor";

export default async function SetorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const dados = await carregarAvaliacaoDoSetor(id, session?.user?.id);
  if (!dados) notFound();

  return (
    <AvaliacaoSetor
      setorId={id}
      setorNome={dados.setor.nome}
      criteriosIniciais={dados.criterios}
    />
  );
}
