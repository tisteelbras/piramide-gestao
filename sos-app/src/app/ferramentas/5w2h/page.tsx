import { auth } from "@/auth";
import CabecalhoFerramenta from "@/features/ferramentas/CabecalhoFerramenta";
import Painel5w2h from "@/features/ferramentas/Painel5w2h";
import { carregar5w2h, opcoesDeSetor } from "@/features/ferramentas/queries";

export default async function Pagina5w2h() {
  const [session, planos, setores] = await Promise.all([auth(), carregar5w2h(), opcoesDeSetor()]);
  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <CabecalhoFerramenta
        titulo="Plano de Ação 5W2H"
        subtitulo="O que fazer, por quê, onde, quando, quem, como e quanto custa — cada decisão vira ação rastreável."
        usuarioNome={session?.user?.name ?? null}
      />
      <div style={{ maxWidth: 1160, margin: "0 auto", background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: "6px solid #0068a9" }}>
        <Painel5w2h planos={planos} setores={setores} />
      </div>
    </div>
  );
}
