"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cor } from "@/design/tokens";
import { addEtapa, atualizarEtapa, removerEtapa, moverEtapa } from "./actions";
import {
  grauPadronizacao,
  lacunasDoProcesso,
  padronizacaoDoSetor,
  ROTULO_PADRONIZACAO,
  COR_PADRONIZACAO,
  type MapaDoSetor,
  type ProcessoMapeado,
  type EtapaFluxo,
} from "./tipos";

// Mapa de Processos: para cada processo do setor, o fluxo oficial de
// execução — o passo a passo, quem faz e o que sai dali.
//
// Resolve o pilar "Padronização" da Governança Operacional. Um processo só
// conta como "documentado" quando toda etapa tem instrução E responsável:
// é isso que o torna a forma OFICIAL de trabalhar, e não o jeito de cada um.
export default function PainelMapa({
  setorId,
  setorNome,
  mapa,
}: {
  setorId: string;
  setorNome: string;
  mapa: MapaDoSetor;
}) {
  const pct = padronizacaoDoSetor(mapa.processos);

  if (mapa.processos.length === 0) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: cor.muted, lineHeight: 1.6 }}>
          O mapa detalha <b>como cada processo do setor é executado</b>. Cadastre os processos primeiro — depois volte aqui para desenhar o fluxo de cada um.
        </p>
        <Link
          href={`/setor/${setorId}/avaliar#processos`}
          style={{ justifySelf: "start", textDecoration: "none", fontSize: 13, fontWeight: 700, color: cor.brand, border: "1px solid #cfe0ee", background: cor.surface, padding: "9px 14px", borderRadius: 10 }}
        >
          ⚙ Cadastrar processos ›
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Padronização do setor */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: cor.surfaceSunk, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ flex: "1 1 240px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: cor.faint }}>
            Padronização do setor
          </div>
          <div style={{ fontSize: 12.5, color: cor.muted, marginTop: 2 }}>
            {mapa.processos.filter((p) => grauPadronizacao(p) === "documentado").length} de {mapa.processos.length} processos com fluxo documentado
          </div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: pct >= 80 ? cor.success : pct >= 40 ? cor.warn : cor.danger, fontVariantNumeric: "tabular-nums" }}>
          {pct}%
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {mapa.processos.map((p) => (
          <BlocoProcesso key={p.id} setorId={setorId} processo={p} pessoas={mapa.pessoas} />
        ))}
      </div>

      <p style={{ margin: "16px 0 0", fontSize: 12, color: cor.faint }}>
        Um processo de {setorNome} conta como <b>documentado</b> quando toda etapa tem <b>instrução</b> e <b>responsável</b> — é o que o torna a forma oficial de trabalhar.
      </p>
    </div>
  );
}

// ————— Um processo e seu fluxo —————
function BlocoProcesso({
  setorId,
  processo,
  pessoas,
}: {
  setorId: string;
  processo: ProcessoMapeado;
  pessoas: { id: string; nome: string; cargo: string | null }[];
}) {
  const [rodando, start] = useTransition();
  const [novoPasso, setNovoPasso] = useState("");
  const [aberto, setAberto] = useState(true);

  const grau = grauPadronizacao(processo);
  const lacunas = lacunasDoProcesso(processo);

  function adicionar() {
    if (!novoPasso.trim()) return;
    const t = novoPasso;
    setNovoPasso("");
    start(async () => {
      await addEtapa({ setorId, processoId: processo.id, titulo: t });
    });
  }

  return (
    <div style={{ border: "1px solid #e6edf3", borderRadius: 14, overflow: "hidden", background: cor.surface }}>
      {/* Cabeçalho do processo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "12px 16px", background: cor.surfaceSunk, borderLeft: `5px solid ${COR_PADRONIZACAO[grau]}` }}>
        <button
          onClick={() => setAberto((a) => !a)}
          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 800, color: cor.muted, padding: 0 }}
          aria-label={aberto ? "Recolher" : "Expandir"}
        >
          {aberto ? "▾" : "▸"}
        </button>
        <span style={{ fontSize: 15, fontWeight: 800, color: cor.ink }}>{processo.nome}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#fff",
            background: COR_PADRONIZACAO[grau],
            padding: "3px 10px",
            borderRadius: 999,
          }}
        >
          {ROTULO_PADRONIZACAO[grau]}
        </span>
        <span style={{ fontSize: 12.5, color: cor.faint, marginLeft: "auto" }}>
          {processo.etapas.length} passo{processo.etapas.length === 1 ? "" : "s"}
        </span>
      </div>

      {aberto && (
        <div style={{ padding: "14px 16px" }}>
          {/* O que falta para documentar */}
          {grau !== "documentado" && (
            <div style={{ fontSize: 12.5, color: cor.warnFg, background: cor.warnBg, border: "1px solid #f0dcb4", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
              Falta para documentar: {lacunas.join(" · ")}
            </div>
          )}

          {/* Fluxo (lista dos passos) */}
          {processo.etapas.length > 0 && (
            <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
              {processo.etapas.map((e, i) => (
                <Passo
                  key={e.id}
                  setorId={setorId}
                  etapa={e}
                  indice={i}
                  total={processo.etapas.length}
                  pessoas={pessoas}
                  rodando={rodando}
                />
              ))}
            </div>
          )}

          {/* Novo passo */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={novoPasso}
              onChange={(ev) => setNovoPasso(ev.target.value)}
              onKeyDown={(ev) => { if (ev.key === "Enter") adicionar(); }}
              placeholder={processo.etapas.length === 0 ? "Primeiro passo do fluxo (ex.: Receber a solicitação)" : "Próximo passo…"}
              style={{ flex: "1 1 260px", border: `1px solid ${cor.hairline}`, borderRadius: 9, padding: "9px 12px", fontSize: 13.5, color: cor.ink, background: cor.surface }}
            />
            <button
              onClick={adicionar}
              disabled={rodando || !novoPasso.trim()}
              style={{ border: "none", background: cor.brand, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 9, cursor: rodando || !novoPasso.trim() ? "default" : "pointer", opacity: rodando || !novoPasso.trim() ? 0.6 : 1 }}
            >
              + Passo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ————— Um passo do fluxo —————
function Passo({
  setorId,
  etapa,
  indice,
  total,
  pessoas,
  rodando,
}: {
  setorId: string;
  etapa: EtapaFluxo;
  indice: number;
  total: number;
  pessoas: { id: string; nome: string; cargo: string | null }[];
  rodando: boolean;
}) {
  const [, start] = useTransition();
  const [expandido, setExpandido] = useState(false);
  const [instr, setInstr] = useState(etapa.descricao ?? "");
  const [entrega, setEntrega] = useState(etapa.entrega ?? "");

  const completo = etapa.responsavelId !== null && (etapa.descricao?.trim().length ?? 0) > 0;

  const salvar = (campo: "descricao" | "entrega" | "responsavelId", valor: string) =>
    start(async () => {
      await atualizarEtapa({ setorId, id: etapa.id, [campo]: valor || null });
    });

  return (
    <div style={{ border: `1px solid ${completo ? "#d5e6da" : cor.hairline}`, borderRadius: 10, background: completo ? "#fbfdfb" : cor.surface }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px" }}>
        {/* Número do passo */}
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: completo ? cor.success : cor.faint2,
            color: "#fff",
            fontSize: 11.5,
            fontWeight: 800,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {indice + 1}
        </span>

        <span style={{ flex: "1 1 auto", minWidth: 0, fontSize: 13.5, fontWeight: 700, color: cor.ink }}>
          {etapa.titulo}
          {etapa.responsavelNome && (
            <span style={{ fontWeight: 600, color: cor.faint, fontSize: 12.5 }}> — {etapa.responsavelNome}</span>
          )}
        </span>

        {/* Mover / expandir / remover */}
        <button onClick={() => start(async () => { await moverEtapa(setorId, etapa.id, "cima"); })}
          disabled={rodando || indice === 0} aria-label="Mover para cima"
          style={btnIcone(indice === 0)}>↑</button>
        <button onClick={() => start(async () => { await moverEtapa(setorId, etapa.id, "baixo"); })}
          disabled={rodando || indice === total - 1} aria-label="Mover para baixo"
          style={btnIcone(indice === total - 1)}>↓</button>
        <button onClick={() => setExpandido((x) => !x)}
          style={{ border: `1px solid ${cor.hairline}`, background: cor.surface, color: cor.brand, fontSize: 11.5, fontWeight: 700, padding: "4px 9px", borderRadius: 7, cursor: "pointer", whiteSpace: "nowrap" }}>
          {expandido ? "▴" : "▾"} detalhes
        </button>
        <button onClick={() => { if (confirm(`Remover o passo "${etapa.titulo}"?`)) start(async () => { await removerEtapa(setorId, etapa.id); }); }}
          aria-label="Remover passo"
          style={{ border: "none", background: "transparent", color: cor.faint2, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
      </div>

      {expandido && (
        <div style={{ padding: "0 12px 12px 46px", display: "grid", gap: 8 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: cor.muted }}>Como executar (instrução de trabalho)</span>
            <textarea
              value={instr}
              onChange={(e) => setInstr(e.target.value)}
              onBlur={() => salvar("descricao", instr)}
              rows={2}
              placeholder="O passo a passo oficial deste ponto do fluxo…"
              style={{ border: `1px solid ${cor.hairline}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: cor.ink, resize: "vertical", fontFamily: "inherit", background: cor.surface }}
            />
          </label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label style={{ display: "grid", gap: 4, flex: "1 1 180px" }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: cor.muted }}>Quem executa</span>
              <select
                value={etapa.responsavelId ?? ""}
                onChange={(e) => salvar("responsavelId", e.target.value)}
                style={{ border: `1px solid ${cor.hairline}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: cor.ink, background: cor.surface }}
              >
                <option value="">— definir responsável</option>
                {pessoas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}{p.cargo ? ` (${p.cargo})` : ""}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 4, flex: "1 1 180px" }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: cor.muted }}>O que sai deste passo</span>
              <input
                value={entrega}
                onChange={(e) => setEntrega(e.target.value)}
                onBlur={() => salvar("entrega", entrega)}
                placeholder="Ex.: pedido aprovado, registro no ERP…"
                style={{ border: `1px solid ${cor.hairline}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: cor.ink, background: cor.surface }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

const btnIcone = (desabilitado: boolean): React.CSSProperties => ({
  border: `1px solid ${cor.hairline}`,
  background: cor.surface,
  color: desabilitado ? "#d6dee6" : cor.muted,
  fontSize: 12,
  fontWeight: 800,
  width: 26,
  height: 26,
  borderRadius: 7,
  cursor: desabilitado ? "default" : "pointer",
  lineHeight: 1,
  padding: 0,
});
