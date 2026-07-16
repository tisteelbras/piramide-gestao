import { auth } from "@/auth";
import { papelDoUsuario } from "@/features/governanca/queries";
import { carregarAcervo } from "@/features/documentos/queries";
import { getSetor } from "@/features/assessments/queries";
import PainelAcervo from "@/features/documentos/PainelAcervo";

export default async function AcervoPage() {
  // Mesmo escopo do dashboard: líder vê só os documentos do setor dele.
  const session = await auth();
  const perfil = await papelDoUsuario(session?.user?.id);
  const filtroSetor = perfil?.papel === "lider" && perfil.setorId ? perfil.setorId : null;

  const [acervo, setorDoLider] = await Promise.all([
    carregarAcervo(filtroSetor),
    filtroSetor ? getSetor(filtroSetor) : Promise.resolve(null),
  ]);

  return <PainelAcervo acervo={acervo} escopoSetor={setorDoLider?.nome ?? null} />;
}
