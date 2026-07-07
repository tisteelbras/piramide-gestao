import { auth } from "@/auth";
import Hub from "@/features/dashboard/Hub";
import { resumoDosSetores } from "@/features/assessments/queries-resumo";

export default async function Home() {
  const [session, setores] = await Promise.all([auth(), resumoDosSetores()]);
  return <Hub usuarioNome={session?.user?.name ?? null} setores={setores} />;
}
