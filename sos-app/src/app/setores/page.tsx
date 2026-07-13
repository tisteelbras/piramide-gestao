// Hub de setores — a porta de entrada para avaliar cada área.
// (A tela inicial "/" é o Dashboard executivo.)
import { auth } from "@/auth";
import Hub from "@/features/dashboard/Hub";
import { carregarGovernanca, papelDoUsuario } from "@/features/governanca/queries";

export default async function SetoresPage() {
  const [session, gov] = await Promise.all([auth(), carregarGovernanca()]);
  const perfil = await papelDoUsuario(session?.user?.id);
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
