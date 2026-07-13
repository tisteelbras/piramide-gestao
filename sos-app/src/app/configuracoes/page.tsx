// Governança do NEXO — só admin/direção: ritmo dos ciclos, metas por
// setor e fechamento de ciclo (fotografia do histórico).
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CabecalhoFerramenta from "@/features/ferramentas/CabecalhoFerramenta";
import PainelConfiguracoes from "@/features/governanca/PainelConfiguracoes";
import { carregarGovernanca, papelDoUsuario } from "@/features/governanca/queries";

export default async function ConfiguracoesPage() {
  const session = await auth();
  const perfil = await papelDoUsuario(session?.user?.id);
  if (!perfil || (perfil.papel !== "admin" && perfil.papel !== "direcao")) redirect("/");

  const dados = await carregarGovernanca();
  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <CabecalhoFerramenta
        titulo="NEXO · Governança"
        subtitulo="Ritmo dos ciclos de avaliação, metas de maturidade e fechamento de ciclo — definidos pela direção."
        usuarioNome={session?.user?.name ?? null}
      />
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <PainelConfiguracoes dados={dados} />
      </div>
    </div>
  );
}
