"use client";

import Link from "next/link";
import { cor } from "@/design/tokens";
import { FASES_CICLO, faseDoProcesso, type IdFase } from "./fase-processo";
import type { ProcessoComEixos } from "./tipos";

// Mapa de Processos: em que FASE do ciclo cada processo do setor se encontra.
// A fase é o gargalo (eixo mais fraco), calculado da maturidade que já foi
// avaliada em Processos — o gestor não digita nada aqui, só enxerga o retrato.
//
// Não confundir com o Fluxograma (o passo a passo DENTRO de cada processo).
export default function PainelMapaFases({
  setorId,
  setorNome,
  processos,
}: {
  setorId: string;
  setorNome: string;
  processos: ProcessoComEixos[];
}) {
  // Agrupa por fase (na ordem do ciclo). "Não avaliado" fica à parte.
  const porFase = new Map<IdFase, ProcessoComEixos[]>();
  const naoAvaliados: ProcessoComEixos[] = [];
  for (const p of processos) {
    const fase = faseDoProcesso(p.eixos);
    if (fase === null) { naoAvaliados.push(p); continue; }
    const lista = porFase.get(fase) ?? [];
    lista.push(p);
    porFase.set(fase, lista);
  }

  if (processos.length === 0) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: cor.muted, lineHeight: 1.6 }}>
          O mapa mostra <b>em que fase do ciclo cada processo de {setorNome} está</b> — mas ainda não há processos cadastrados.
        </p>
        <Link href={`/setor/${setorId}/avaliar#processos`}
          style={{ justifySelf: "start", textDecoration: "none", fontSize: 13, fontWeight: 700, color: cor.brand, border: "1px solid #cfe0ee", background: cor.surface, padding: "9px 14px", borderRadius: 10 }}>
          ⚙ Cadastrar processos ›
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Trilho das 5 fases do ciclo, cada uma com seus processos. */}
      <div style={{ display: "grid", gap: 10 }}>
        {FASES_CICLO.map((f, i) => {
          const doGrupo = porFase.get(f.id) ?? [];
          return (
            <div key={f.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "start" }}>
              {/* Marcador da fase (número + linha do trilho) */}
              <div style={{ display: "grid", justifyItems: "center", gap: 2 }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", background: doGrupo.length ? cor.brand : cor.surfaceSunk, color: doGrupo.length ? "#fff" : cor.faint, fontWeight: 800, fontSize: 13 }}>
                  {i + 1}
                </span>
                {i < FASES_CICLO.length - 1 && <span style={{ width: 2, height: 26, background: cor.hairline }} />}
              </div>
              {/* Fase + processos nela */}
              <div style={{ paddingBottom: 6 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: cor.ink }}>{f.label}</div>
                {doGrupo.length === 0 ? (
                  <div style={{ fontSize: 12, color: cor.faint2, fontStyle: "italic", marginTop: 2 }}>nenhum processo nesta fase</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                    {doGrupo.map((p) => <CartaoProcesso key={p.id} p={p} setorId={setorId} />)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Não avaliados: fora do trilho, com convite para avaliar. */}
      {naoAvaliados.length > 0 && (
        <div style={{ borderTop: `1px solid ${cor.surfaceSunk}`, paddingTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: cor.faint, marginBottom: 8 }}>
            Ainda não avaliados ({naoAvaliados.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {naoAvaliados.map((p) => (
              <Link key={p.id} href={`/setor/${setorId}/avaliar#processos`}
                style={{ textDecoration: "none", border: `1px dashed ${cor.hairline}`, background: cor.surface, color: cor.muted, fontSize: 12.5, fontWeight: 700, padding: "8px 12px", borderRadius: 10 }}>
                {p.nome} · avaliar ›
              </Link>
            ))}
          </div>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 11.5, color: cor.faint, lineHeight: 1.6 }}>
        A <b>fase</b> de cada processo é o seu <b>ponto mais fraco</b> no ciclo — a próxima etapa a evoluir — calculada da maturidade avaliada em Processos. Para descrever <b>como</b> um processo é executado, use o{" "}
        <Link href={`/setor/${setorId}/fluxograma`} style={{ color: cor.brand, fontWeight: 700 }}>Fluxograma</Link>.
      </p>
    </div>
  );
}

function CartaoProcesso({ p, setorId }: { p: ProcessoComEixos; setorId: string }) {
  const corMedia = p.media == null ? cor.faint2 : p.media >= 70 ? cor.success : p.media >= 40 ? cor.warn : cor.danger;
  return (
    <Link href={`/setor/${setorId}/avaliar#processos`}
      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${cor.hairline}`, background: cor.surface, borderRadius: 10, padding: "8px 12px" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: cor.ink }}>{p.nome}</span>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: corMedia, fontVariantNumeric: "tabular-nums" }}>
        {p.media == null ? "—" : `${p.media}%`}
      </span>
    </Link>
  );
}
