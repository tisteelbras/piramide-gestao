"use client";

import Link from "next/link";
import { useState } from "react";
import { cor } from "@/design/tokens";
import ArvoreVisual from "./ArvoreVisual";
import type { OrganogramaSetor } from "./queries";

// Organograma consolidado da empresa: um bloco por setor, com a árvore de
// cada área. Setores ainda sem pessoas aparecem como pendência — é o que
// mostra o que falta para a estrutura da empresa ficar completa.
export default function OrganogramaEmpresa({
  setores,
}: {
  setores: OrganogramaSetor[];
}) {
  const preenchidos = setores.filter((s) => s.pessoas.length > 0);
  const pendentes = setores.filter((s) => s.pessoas.length === 0);
  const totalPessoas = setores.reduce((t, s) => t + s.pessoas.length, 0);

  return (
    <div>
      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
        <Indicador rotulo="Áreas mapeadas" valor={`${preenchidos.length} de ${setores.length}`} destaque={cor.brand} />
        <Indicador rotulo="Pessoas no organograma" valor={String(totalPessoas)} destaque={cor.green} />
        <Indicador
          rotulo="Áreas pendentes"
          valor={String(pendentes.length)}
          destaque={pendentes.length > 0 ? cor.danger : cor.success}
        />
      </div>

      {/* Pendências: o que falta para a estrutura ficar completa */}
      {pendentes.length > 0 && (
        <div style={{ background: cor.warnBg, border: "1px solid #f0dcb4", borderRadius: 12, padding: "12px 16px", marginBottom: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: cor.warnFg, marginBottom: 6 }}>
            Áreas sem organograma
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {pendentes.map((s) => (
              <Link
                key={s.setorId}
                href={`/setor/${s.setorId}/organograma`}
                style={{ textDecoration: "none", fontSize: 12.5, fontWeight: 700, color: cor.warnFg, background: cor.surface, border: "1px solid #e8cfa0", borderRadius: 999, padding: "5px 12px" }}
              >
                {s.setorNome} — montar ›
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Um bloco por setor preenchido */}
      {preenchidos.length === 0 ? (
        <p style={{ fontSize: 13.5, color: cor.faint, margin: 0 }}>
          Nenhuma área montou o organograma ainda. Comece por uma delas acima.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {preenchidos.map((s) => (
            <BlocoSetor key={s.setorId} setor={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function Indicador({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque: string }) {
  return (
    <div style={{ background: cor.surfaceSunk, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: cor.faint }}>
        {rotulo}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: destaque, fontVariantNumeric: "tabular-nums" }}>{valor}</div>
    </div>
  );
}

function BlocoSetor({ setor }: { setor: OrganogramaSetor }) {
  const [aberto, setAberto] = useState(true);

  return (
    <div style={{ border: `1px solid #e6edf3`, borderRadius: 14, background: cor.surface, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: cor.surfaceSunk, borderBottom: aberto ? `1px solid #e6edf3` : "none" }}>
        <button
          onClick={() => setAberto((a) => !a)}
          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: cor.muted, padding: 0, fontWeight: 800 }}
          aria-label={aberto ? "Recolher" : "Expandir"}
        >
          {aberto ? "▾" : "▸"}
        </button>
        <span style={{ fontSize: 15, fontWeight: 800, color: cor.ink }}>{setor.setorNome}</span>
        <span style={{ fontSize: 12.5, color: cor.faint }}>
          {setor.pessoas.length} pessoa{setor.pessoas.length === 1 ? "" : "s"}
        </span>
        <Link
          href={`/setor/${setor.setorId}/organograma`}
          style={{ marginLeft: "auto", textDecoration: "none", fontSize: 12, fontWeight: 700, color: cor.brand }}
        >
          editar ›
        </Link>
      </div>

      {aberto && (
        <div style={{ padding: "22px 16px", background: cor.appBg }}>
          <ArvoreVisual pessoas={setor.pessoas} />
        </div>
      )}
    </div>
  );
}
