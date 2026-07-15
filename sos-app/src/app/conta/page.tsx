import Link from "next/link";
import { auth } from "@/auth";
import FormSenha from "./FormSenha";
import FormFoto from "./FormFoto";
import { perfilBasico } from "@/features/onboarding/queries";

export default async function ContaPage() {
  const session = await auth();
  const perfil = await perfilBasico(session?.user?.id);
  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Voltar</Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "18px 0 4px", color: "#0e1a24" }}>Minha conta</h1>
        <p style={{ margin: "0 0 24px", color: "#5b6b78", fontSize: 14.5 }}>
          {session?.user?.name} · {session?.user?.email}
        </p>

        {session?.user?.id && (
          <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 16, padding: 24, boxShadow: "0 10px 30px rgba(14,26,36,.06)", marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>Foto de perfil</h2>
            <FormFoto usuarioId={session.user.id} temFoto={perfil?.temFoto ?? false} />
          </div>
        )}

        <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 16, padding: 24, boxShadow: "0 10px 30px rgba(14,26,36,.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>Trocar senha</h2>
          <FormSenha />
        </div>
      </div>
    </div>
  );
}
