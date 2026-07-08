import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { carregarAvaliacaoDoSetor } from "@/features/assessments/queries";
import { carregarRecursos } from "@/features/resources/queries";
import { carregarProcessos } from "@/features/processes/queries";
import { carregarResultados } from "@/features/results/queries";
import AvaliarSetor from "@/features/assessments/AvaliarSetor";

export default async function AvaliarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const dados = await carregarAvaliacaoDoSetor(id, session?.user?.id);
  if (!dados) notFound();

  const [recursos, processos, resultados] = await Promise.all([
    carregarRecursos(id, dados.avaliacaoId),
    carregarProcessos(id),
    carregarResultados(id),
  ]);

  return (
    <AvaliarSetor
      setorId={id}
      setorNome={dados.setor.nome}
      avaliacaoId={dados.avaliacaoId}
      criteriosIniciais={dados.criterios}
      recursos={recursos}
      processos={processos}
      resultados={resultados}
    />
  );
}
