import { auth } from "@/auth";
import Sos from "@/components/Sos";

export default async function Home() {
  const session = await auth();
  return <Sos usuarioNome={session?.user?.name ?? null} />;
}
