import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { carregarAvaliacaoDoSetor } from "@/features/assessments/queries";
import { carregarRecursos } from "@/features/resources/queries";
import { carregarProcessos } from "@/features/processes/queries";
import AvaliacaoSetor from "@/features/assessments/AvaliacaoSetor";

export default async function SetorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const dados = await carregarAvaliacaoDoSetor(id, session?.user?.id);
  if (!dados) notFound();

  const [recursos, processos] = await Promise.all([
    carregarRecursos(id, dados.avaliacaoId),
    carregarProcessos(id),
  ]);

  return (
    <AvaliacaoSetor
      setorId={id}
      setorNome={dados.setor.nome}
      avaliacaoId={dados.avaliacaoId}
      criteriosIniciais={dados.criterios}
      recursos={recursos}
      processos={processos}
    />
  );
}
