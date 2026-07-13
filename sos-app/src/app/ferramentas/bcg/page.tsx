import { auth } from "@/auth";
import CabecalhoFerramenta from "@/features/ferramentas/CabecalhoFerramenta";
import PainelBcg from "@/features/ferramentas/PainelBcg";
import { carregarBcg } from "@/features/ferramentas/queries";

export default async function PaginaBcg() {
  const [session, itens] = await Promise.all([auth(), carregarBcg()]);
  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <CabecalhoFerramenta
        titulo="Matriz BCG"
        subtitulo="Posicione o portfólio por participação de mercado × crescimento e decida onde investir, sustentar ou repensar."
        usuarioNome={session?.user?.name ?? null}
      />
      <div style={{ maxWidth: 1160, margin: "0 auto", background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: "6px solid #0068a9" }}>
        <PainelBcg itens={itens} />
      </div>
    </div>
  );
}
