import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSetor } from "@/features/assessments/queries";
import { maturidadeDoSetor } from "@/features/assessments/maturidade-setor";
import { ferramentasDoSetor } from "@/features/ferramentas/queries";
import { statusDiagnosticoPorSetor } from "@/features/ferramentas/queries-diagnostico";
import { papelDoUsuario } from "@/features/governanca/queries";
import AvaliacaoSetor from "@/features/assessments/AvaliacaoSetor";

export default async function SetorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Líder só acessa a própria área — a de outra área o manda para a dele.
  const session = await auth();
  const perfil = await papelDoUsuario(session?.user?.id);
  if (perfil?.papel === "lider" && perfil.setorId && perfil.setorId !== id) {
    redirect(`/setor/${perfil.setorId}`);
  }
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
