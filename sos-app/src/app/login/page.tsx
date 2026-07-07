import Image from "next/image";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
      }}
    >
      {/* Lado esquerdo — marca sobre gradiente Steelbras */}
      <aside
        style={{
          position: "relative",
          background:
            "linear-gradient(150deg, #0068a9 0%, #004e80 55%, #063a5e 100%)",
          color: "#fff",
          padding: "clamp(32px,5vw,64px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.01em" }}>
            Steel<span style={{ color: "#7fdc86" }}>bras</span>
          </span>
        </div>

        {/* Pirâmide decorativa */}
        <svg
          viewBox="0 0 400 300"
          style={{ position: "relative", zIndex: 1, width: "min(78%,360px)", margin: "0 auto", opacity: 0.96 }}
          aria-hidden="true"
        >
          <polygon points="200,20 244,90 156,90" fill="#7fdc86" />
          <polygon points="150,98 250,98 286,172 114,172" fill="#ffffff" opacity="0.92" />
          <polygon points="108,180 292,180 326,254 74,254" fill="#7fdc86" opacity="0.85" />
          <polygon points="68,262 332,262 366,300 34,300" fill="#ffffff" opacity="0.75" />
        </svg>

        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(20px,2.4vw,26px)", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.2 }}>
            Sistema de Operação Steelbras
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,.82)", maxWidth: "42ch" }}>
            Diagnóstico organizacional que transforma avaliações em maturidade de
            gestão — do estratégico ao operacional.
          </p>
        </div>

        {/* brilho de fundo */}
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            right: -160,
            top: -160,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(127,220,134,.25), transparent 70%)",
          }}
        />
      </aside>

      {/* Lado direito — formulário */}
      <main
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px,5vw,64px)",
          background: "#f4f7fa",
        }}
      >
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ marginBottom: 28 }}>
            <Image src="/steelbras-logo.svg" alt="Steelbras" width={140} height={51} style={{ height: 40, width: "auto" }} priority />
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: "20px 0 4px", color: "#0e1a24" }}>
              Entrar
            </h1>
            <p style={{ margin: 0, fontSize: 14.5, color: "#5b6b78" }}>
              Acesse o painel de diagnóstico da sua área.
            </p>
          </div>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
