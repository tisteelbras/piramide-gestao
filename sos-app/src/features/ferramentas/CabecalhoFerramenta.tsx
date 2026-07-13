// Cabeçalho padrão das páginas de ferramenta (server component).
import Image from "next/image";
import Link from "next/link";

export default function CabecalhoFerramenta({
  titulo,
  subtitulo,
  usuarioNome,
}: {
  titulo: string;
  subtitulo: string;
  usuarioNome: string | null;
}) {
  return (
    <header style={{ maxWidth: 1160, margin: "0 auto 24px", display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 260 }}>
        <Image src="/steelbras-logo.svg" alt="Steelbras" width={130} height={47} style={{ height: 34, width: "auto" }} priority />
        <h1 style={{ fontSize: "clamp(22px,3.4vw,32px)", fontWeight: 800, margin: "12px 0 4px", color: "#0e1a24" }}>{titulo}</h1>
        <p style={{ margin: 0, color: "#5b6b78", fontSize: 15 }}>{subtitulo}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>▤ Dashboard</Link>
        <Link href="/ferramentas" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>🧰 Ferramentas</Link>
        <Link href="/setores" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>Setores</Link>
        {usuarioNome && <Link href="/conta" style={{ fontSize: 12.5, fontWeight: 700, color: "#46586a", textDecoration: "none" }}>{usuarioNome}</Link>}
      </div>
    </header>
  );
}
