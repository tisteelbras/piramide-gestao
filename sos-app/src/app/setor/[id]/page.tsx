import { notFound } from "next/navigation";
import { getSetor } from "@/features/assessments/queries";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import { ferramentasDoSetor } from "@/features/ferramentas/queries";
import { statusDiagnosticoPorSetor } from "@/features/ferramentas/queries-diagnostico";
import AvaliacaoSetor from "@/features/assessments/AvaliacaoSetor";

export default async function SetorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const setor = await getSetor(id);
  if (!setor) notFound();
  const [maturidade, ferramentas, todosStatus] = await Promise.all([
    maturidadeDoSetor(id),
    ferramentasDoSetor(id),
    statusDiagnosticoPorSetor(),
  ]);
  const diagnostico = todosStatus.find((s) => s.setorId === id);

  return (
    <AvaliacaoSetor
      setorId={id}
      setorNome={setor.nome}
      maturidade={maturidade}
      ferramentas={ferramentas}
      diagnostico={diagnostico}
    />
  );
}
