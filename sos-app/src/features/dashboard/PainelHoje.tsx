import Link from "next/link";
import {
  montarPendencias,
  COR_PENDENCIA,
  ICONE_PENDENCIA,
  type CicloEntrada,
  type SetorEntrada,
} from "@/domain/pendencias";

/**
 * "O que fazer hoje" — o primeiro bloco da home. Consolida os sinais que já
 * existem (avaliações vencendo/vencidas + ações atrasadas) numa lista curta
 * e clicável, ordenada por urgência. Cada item leva direto à tela de ação.
 *
 * Quando não há pendência, mostra um estado positivo em vez de sumir — a
 * ausência de alerta também é uma informação ("está tudo em dia").
 */
export default function PainelHoje({ ciclos, setores }: {
  ciclos: CicloEntrada[];
  setores: SetorEntrada[];
}) {
  const pendencias = montarPendencias(ciclos, setores);

  if (pendencias.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#eef7ef", border: "1px solid #cfe0d0", borderRadius: 14, padding: "14px 18px" }}>
        <span aria-hidden style={{ fontSize: 22 }}>✅</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#256a2b" }}>Tudo em dia por aqui</div>
          <div style={{ fontSize: 12.5, color: "#33613a" }}>Nenhuma avaliação vencendo e nenhuma ação atrasada. Bom trabalho.</div>
        </div>
      </div>
    );
  }

  // Mostra no máximo 6 no banner; o resto vira um "+N".
  const visiveis = pendencias.slice(0, 6);
  const resto = pendencias.length - visiveis.length;

  return (
    <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 14, padding: "16px 18px", boxShadow: "0 4px 14px rgba(14,26,36,.05)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#0e1a24" }}>O que precisa da sua atenção hoje</span>
        <span style={{ fontSize: 12, color: "#8493a0" }}>{pendencias.length} {pendencias.length === 1 ? "item" : "itens"} — o mais urgente primeiro</span>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {visiveis.map((p, i) => (
          <Link key={`${p.setorId}-${p.tipo}-${i}`} href={p.href}
            style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", border: "1px solid #eef3f7", borderRadius: 10, padding: "10px 12px", borderLeft: `4px solid ${COR_PENDENCIA[p.tipo]}`, background: "#fff" }}>
            <span aria-hidden style={{ fontSize: 16 }}>{ICONE_PENDENCIA[p.tipo]}</span>
            <span style={{ fontWeight: 800, fontSize: 13.5, color: "#0e1a24" }}>{p.setorNome}</span>
            <span style={{ fontSize: 13, color: COR_PENDENCIA[p.tipo], fontWeight: 600 }}>{p.texto}</span>
            <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, color: "#0068a9" }}>resolver ›</span>
          </Link>
        ))}
      </div>

      {resto > 0 && (
        <div style={{ fontSize: 12, color: "#8493a0", marginTop: 8 }}>+ {resto} {resto === 1 ? "outro item" : "outros itens"} mais abaixo, nos setores.</div>
      )}
    </div>
  );
}
