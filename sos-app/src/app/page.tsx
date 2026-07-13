// Tela inicial = Dashboard executivo, com saudação, resumo do conceito
// e tutorial de boas-vindas no primeiro acesso.
import { auth } from "@/auth";
import DashboardExec from "@/features/dashboard/DashboardExec";
import { carregarDashboard } from "@/features/dashboard/queries";
import { resumoFerramentas } from "@/features/ferramentas/queries";
import { carregarGovernanca } from "@/features/governanca/queries";
import { tutorialPendente } from "@/features/onboarding/queries";

export default async function Home() {
  const session = await auth();
  const [dados, ferramentas, governanca, mostrarTutorial] = await Promise.all([
    carregarDashboard(),
    resumoFerramentas(),
    carregarGovernanca(),
    tutorialPendente(session?.user?.id),
  ]);
  return (
    <DashboardExec
      usuarioNome={session?.user?.name ?? null}
      dados={dados}
      ferramentas={ferramentas}
      governanca={governanca}
      inicio={{ mostrarTutorial }}
    />
  );
}
