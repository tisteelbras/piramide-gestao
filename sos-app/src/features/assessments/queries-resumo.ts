// Resumo de maturidade por setor — para os cards do hub.
import "server-only";
import { listarSetores } from "./queries";
import { maturidadeDoSetor } from "./maturidade-setor";

export type ResumoSetor = {
  id: string;
  nome: string;
  geral: number; // 0–100
  temAvaliacao: boolean;
};

export async function resumoDosSetores(): Promise<ResumoSetor[]> {
  const setores = await listarSetores();
  return Promise.all(
    setores.map(async (s) => {
      const m = await maturidadeDoSetor(s.id);
      return { id: s.id, nome: s.nome, geral: m.geral, temAvaliacao: m.geral > 0 };
    }),
  );
}
