// Tipos puros da Matriz de Sucessão — Pilar 4 (Sustentabilidade) da
// Governança Operacional. "A operação depende das pessoas ou do sistema?"
//
// Cada atividade crítica: quem a domina e o risco de continuidade (bus
// factor). O risco é DERIVADO do "quem domina", não digitado — o app conta
// as pessoas e classifica, para o gestor não subestimar o risco.
export type RiscoSucessao = "sem_dominio" | "critico" | "ok";

export const RISCOS_SUCESSAO: { id: RiscoSucessao; label: string; cor: string }[] = [
  { id: "sem_dominio", label: "Ninguém domina", cor: "#c0392b" },
  { id: "critico", label: "Só uma pessoa", cor: "#d98a00" },
  { id: "ok", label: "Duas ou mais", cor: "#33853a" },
];

export type SucessaoItem = {
  id: string;
  atividade: string;
  quemDomina: string | null;
  risco: RiscoSucessao;
};

export type SucessaoDoSetor = {
  itens: SucessaoItem[];
  lacunas: number; // ninguém domina
  criticos: number; // bus factor 1
  total: number;
};

/**
 * Deriva o risco a partir do texto "quem domina". Conta as pessoas
 * separadas por vírgula, "e", "/". Puro e testável.
 *   vazio               → sem_dominio (lacuna)
 *   1 nome              → critico (bus factor 1)
 *   2+ nomes            → ok
 */
export function riscoPorQuem(quemDomina: string | null): RiscoSucessao {
  const txt = (quemDomina ?? "").trim();
  if (!txt) return "sem_dominio";
  const pessoas = txt
    .split(/,|\/|\be\b|\bE\b|;/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (pessoas.length <= 1) return "critico";
  return "ok";
}
