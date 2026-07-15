import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { papelDoUsuario } from "@/features/governanca/queries";
import { listarUsuarios, setoresParaVinculo } from "@/features/usuarios/queries";
import PainelUsuarios from "@/features/usuarios/PainelUsuarios";

export default async function UsuariosPage() {
  // Só administradores gerenciam usuários.
  const session = await auth();
  const perfil = await papelDoUsuario(session?.user?.id);
  if (perfil?.papel !== "admin") redirect("/");

  const [usuarios, setores] = await Promise.all([listarUsuarios(), setoresParaVinculo()]);
  return <PainelUsuarios usuarios={usuarios} setores={setores} meuId={session!.user!.id!} />;
}
