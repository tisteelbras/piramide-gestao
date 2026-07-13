import { auth } from "@/auth";
import CabecalhoFerramenta from "@/features/ferramentas/CabecalhoFerramenta";
import PainelIshikawa from "@/features/ferramentas/PainelIshikawa";
import { carregarIshikawa, opcoesDeSetor } from "@/features/ferramentas/queries";

export default async function PaginaIshikawa() {
  const [session, analises, setores] = await Promise.all([auth(), carregarIshikawa(), opcoesDeSetor()]);
  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <CabecalhoFerramenta
        titulo="Ishikawa · Causa e Efeito"
        subtitulo="Diagrama espinha de peixe: organize as causas de um problema nos 6M e encontre a causa raiz."
        usuarioNome={session?.user?.name ?? null}
      />
      <div style={{ maxWidth: 1160, margin: "0 auto", background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: "6px solid #0068a9" }}>
        <PainelIshikawa analises={analises} setores={setores} />
      </div>
    </div>
  );
}
