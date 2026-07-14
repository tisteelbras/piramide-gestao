import Link from "next/link";
import { organogramaDaEmpresa } from "@/features/organograma/queries";
import OrganogramaEmpresa from "@/features/organograma/OrganogramaEmpresa";

// Organograma consolidado: a estrutura de todas as áreas num só lugar,
// com as que ainda faltam mapear em destaque.
export default async function OrganogramaEmpresaPage() {
  const setores = await organogramaDaEmpresa();

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 1000, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>
          ‹ Dashboard
        </Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, color: "#0e1a24" }}>
          Organograma da empresa
        </h1>
      </header>

      <div style={{ maxWidth: 1000, margin: "0 auto", background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: "6px solid #0068a9" }}>
        <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "#8493a0" }}>
          A estrutura de todas as áreas consolidada. Cada setor monta o seu, e aqui a empresa se vê inteira.
        </p>
        <OrganogramaEmpresa setores={setores} />
      </div>
    </div>
  );
}
