import { auth } from "@/auth";
import DashboardExec from "@/features/dashboard/DashboardExec";
import { carregarDashboard } from "@/features/dashboard/queries";

export default async function DashboardPage() {
  const [session, dados] = await Promise.all([auth(), carregarDashboard()]);
  return <DashboardExec usuarioNome={session?.user?.name ?? null} dados={dados} />;
}
