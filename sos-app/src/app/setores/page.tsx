// Hub de setores — a porta de entrada para avaliar cada área.
// (A tela inicial "/" é o Dashboard executivo.)
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Hub from "@/features/dashboard/Hub";
import { carregarGovernanca, papelDoUsuario } from "@/features/governanca/queries";

export default async function SetoresPage() {
  const session = await auth();
  const perfil = await papelDoUsuario(session?.user?.id);
  // Líder não vê a lista de todas as áreas — vai direto para a dele.
  if (perfil?.papel === "lider" && perfil.setorId) {
    redirect(`/setor/${perfil.setorId}`);
  }
  const gov = await carregarGovernanca();
  // O resumo dos cards deriva da própria governança (evita calcular a
  // maturidade de cada setor duas vezes).
  const setores = gov.ciclos.map((c) => ({
    id: c.setorId,
    nome: c.setorNome,
    geral: c.geralAtual,
    temAvaliacao: c.geralAtual > 0,
  }));
  return (
    <Hub
      usuarioNome={session?.user?.name ?? null}
      setores={setores}
      ciclos={gov.ciclos}
      mostrarConfiguracoes={perfil?.papel === "admin" || perfil?.papel === "direcao"}
    />
  );
}
