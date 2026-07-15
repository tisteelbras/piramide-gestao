// Tela inicial = Dashboard executivo, com saudação, resumo do conceito
// e tutorial de boas-vindas no primeiro acesso.
import { auth } from "@/auth";
import DashboardExec from "@/features/dashboard/DashboardExec";
import { carregarDashboard } from "@/features/dashboard/queries";
import { resumoFerramentas } from "@/features/ferramentas/queries";
import { carregarGovernanca, papelDoUsuario } from "@/features/governanca/queries";
import { tutorialPendente, perfilBasico } from "@/features/onboarding/queries";
import { organogramaDaEmpresa } from "@/features/organograma/queries";

export default async function Home() {
  const session = await auth();
  const [dados, ferramentas, governanca, mostrarTutorial, organograma, perfil, papel] = await Promise.all([
    carregarDashboard(),
    resumoFerramentas(),
    carregarGovernanca(),
    tutorialPendente(session?.user?.id),
    organogramaDaEmpresa(),
    perfilBasico(session?.user?.id),
    papelDoUsuario(session?.user?.id),
  ]);
  return (
    <DashboardExec
      usuarioNome={session?.user?.name ?? null}
      usuarioId={session?.user?.id ?? null}
      temFoto={perfil?.temFoto ?? false}
      papel={papel?.papel ?? null}
      dados={dados}
      ferramentas={ferramentas}
      governanca={governanca}
      organograma={organograma}
      inicio={{ mostrarTutorial }}
    />
  );
}
