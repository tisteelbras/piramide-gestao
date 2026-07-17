"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cor } from "@/design/tokens";
import {
  criarFluxograma, renomearFluxograma, removerFluxograma,
  addNo, removerNo, moverNo, editarDecisao,
} from "./actions";
import {
  ROTULO_TIPO_NO, textoDoNo, fluxogramaMontado,
  type FluxogramaComNos, type NoFluxo, type ProcessoDisponivel,
} from "./tipos";

// Fluxograma: liga os PROCESSOS do setor em sequência (Proc A → Proc B →
// decisão → Proc C). Cada caixa É um processo já cadastrado. O Mapa de
// Processos, ao lado, detalha o passo a passo DENTRO de cada processo.
export default function PainelFluxograma({
  setorId,
  setorNome,
  fluxogramas,
  processos,
}: {
  setorId: string;
  setorNome: string;
  fluxogramas: FluxogramaComNos[];
  processos: ProcessoDisponivel[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn().then(() => router.refresh()); });

  const [novoNome, setNovoNome] = useState("");
  const [selecionado, setSelecionado] = useState<string | null>(fluxogramas[0]?.id ?? null);
  const atual = fluxogramas.find((f) => f.id === selecionado) ?? fluxogramas[0] ?? null;

  const criar = () => {
    const nome = novoNome.trim();
    if (!nome) return;
    setNovoNome("");
    start(async () => {
      const r = await criarFluxograma(setorId, nome);
      if (r.ok) setSelecionado(r.id);
      router.refresh();
    });
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <p style={{ margin: 0, fontSize: 13.5, color: cor.muted, lineHeight: 1.6 }}>
        O fluxograma mostra <b>como os processos de {setorNome} se encadeiam</b> — Processo A → Processo B → decisão → Processo C.
        Cada caixa é um <b>processo já cadastrado</b>; para detalhar o passo a passo de dentro de um processo, use o{" "}
        <Link href={`/setor/${setorId}/mapa`} style={{ color: cor.brand, fontWeight: 700 }}>Mapa de Processos</Link>.
      </p>

      {/* Abas dos fluxogramas do setor + criar novo */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {fluxogramas.map((f) => (
          <button key={f.id} onClick={() => setSelecionado(f.id)}
            style={{ border: `1px solid ${atual?.id === f.id ? cor.brand : cor.hairline}`, background: atual?.id === f.id ? cor.brand : cor.surface, color: atual?.id === f.id ? "#fff" : cor.muted, fontWeight: 700, fontSize: 13, padding: "7px 13px", borderRadius: 10, cursor: "pointer" }}>
            🔀 {f.nome}
          </button>
        ))}
        <span style={{ display: "inline-flex", gap: 6 }}>
          <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") criar(); }}
            placeholder="Novo fluxograma (ex.: Fluxo de venda)"
            style={{ border: `1px solid ${cor.hairline}`, borderRadius: 9, padding: "7px 11px", fontSize: 13, color: cor.ink, minWidth: 190 }} />
          <button onClick={criar} disabled={!novoNome.trim()}
            style={{ border: "none", background: cor.success, color: "#fff", fontWeight: 700, fontSize: 13, padding: "7px 14px", borderRadius: 9, cursor: novoNome.trim() ? "pointer" : "default", opacity: novoNome.trim() ? 1 : 0.6 }}>
            + Criar
          </button>
        </span>
      </div>

      {fluxogramas.length === 0 && (
        <div style={{ background: cor.surface, border: `1px dashed ${cor.hairline}`, borderRadius: 12, padding: 28, textAlign: "center", color: cor.faint, fontSize: 14 }}>
          Nenhum fluxograma ainda. Crie o primeiro acima (ex.: “Fluxo de venda”) e comece a ligar os processos.
        </div>
      )}

      {atual && (
        <EditorFluxograma
          key={atual.id}
          setorId={setorId}
          fluxo={atual}
          processos={processos}
          run={run}
          onRemover={() => {
            if (confirm(`Remover o fluxograma “${atual.nome}”?`)) {
              run(() => removerFluxograma(setorId, atual.id));
              setSelecionado(null);
            }
          }}
        />
      )}
    </div>
  );
}

// ————— Editor de um fluxograma: sequência + desenho —————
function EditorFluxograma({
  setorId, fluxo, processos, run, onRemover,
}: {
  setorId: string;
  fluxo: FluxogramaComNos;
  processos: ProcessoDisponivel[];
  run: (fn: () => Promise<unknown>) => void;
  onRemover: () => void;
}) {
  const [nome, setNome] = useState(fluxo.nome);
  const [procEscolhido, setProcEscolhido] = useState<string>(processos[0]?.id ?? "");
  const nosProcesso = fluxo.nos.filter((n) => n.tipo === "processo");
  // Nós que podem ser destino do "Não" de uma decisão (processos + Fim).
  const destinosPossiveis = fluxo.nos.filter((n) => n.tipo === "processo" || n.tipo === "fim");

  return (
    <div style={{ border: `1px solid ${cor.hairline}`, borderRadius: 14, overflow: "hidden", background: cor.surface }}>
      {/* Cabeçalho: nome editável + remover */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "12px 16px", background: cor.surfaceSunk }}>
        <input value={nome} onChange={(e) => setNome(e.target.value)}
          onBlur={() => { if (nome.trim() && nome !== fluxo.nome) run(() => renomearFluxograma(setorId, fluxo.id, nome)); }}
          style={{ flex: "1 1 200px", border: `1px solid ${cor.hairline}`, borderRadius: 8, padding: "7px 11px", fontSize: 15, fontWeight: 800, color: cor.ink, background: cor.surface }} />
        <button onClick={onRemover}
          style={{ border: `1px solid ${cor.hairline}`, background: cor.surface, color: cor.danger, fontWeight: 700, fontSize: 12, padding: "7px 12px", borderRadius: 8, cursor: "pointer" }}>
          Remover fluxograma
        </button>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Adicionar nós */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${cor.surfaceSunk}` }}>
          <select value={procEscolhido} onChange={(e) => setProcEscolhido(e.target.value)}
            style={{ border: `1px solid ${cor.hairline}`, borderRadius: 9, padding: "8px 11px", fontSize: 13, color: cor.ink, background: cor.surface, maxWidth: 240 }}>
            {processos.length === 0 && <option value="">Nenhum processo cadastrado</option>}
            {processos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <button onClick={() => procEscolhido && run(() => addNo({ setorId, fluxogramaId: fluxo.id, tipo: "processo", processoId: procEscolhido }))}
            disabled={!procEscolhido}
            style={{ border: "none", background: cor.brand, color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 14px", borderRadius: 9, cursor: procEscolhido ? "pointer" : "default", opacity: procEscolhido ? 1 : 0.6 }}>
            + Processo
          </button>
          <button onClick={() => run(() => addNo({ setorId, fluxogramaId: fluxo.id, tipo: "decisao" }))}
            style={{ border: `1px solid ${cor.warn}`, background: cor.warnBg, color: cor.warnFg, fontWeight: 700, fontSize: 13, padding: "8px 14px", borderRadius: 9, cursor: "pointer" }}>
            + Decisão
          </button>
          {processos.length === 0 && (
            <Link href={`/setor/${setorId}/avaliar#processos`} style={{ fontSize: 12.5, color: cor.brand, fontWeight: 700 }}>
              cadastrar processos primeiro ›
            </Link>
          )}
        </div>

        {/* Sequência editável dos nós */}
        <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
          {fluxo.nos.map((n, i) => (
            <LinhaNo key={n.id} setorId={setorId} no={n} indice={i} total={fluxo.nos.length}
              destinos={destinosPossiveis} run={run} />
          ))}
        </div>

        {/* Desenho do fluxo */}
        {fluxogramaMontado(fluxo) ? (
          <DesenhoFluxo nos={fluxo.nos} />
        ) : (
          <div style={{ fontSize: 12.5, color: cor.faint, background: cor.surfaceSunk, borderRadius: 10, padding: "12px 14px" }}>
            Adicione ao menos um <b>processo</b> para o fluxograma tomar forma.{nosProcesso.length === 0 ? "" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// ————— Uma linha da sequência (editor) —————
function LinhaNo({
  setorId, no, indice, total, destinos, run,
}: {
  setorId: string;
  no: NoFluxo;
  indice: number;
  total: number;
  destinos: NoFluxo[];
  run: (fn: () => Promise<unknown>) => void;
}) {
  const fixo = no.tipo === "inicio" || no.tipo === "fim";
  const corTipo = no.tipo === "decisao" ? cor.warn : no.tipo === "processo" ? cor.brand : cor.faint;

  return (
    <div style={{ border: `1px solid ${cor.hairline}`, borderRadius: 10, background: fixo ? cor.surfaceSunk : cor.surface }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px" }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: corTipo, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
          {ROTULO_TIPO_NO[no.tipo]}
        </span>
        <span style={{ flex: "1 1 auto", minWidth: 0, fontSize: 13.5, fontWeight: 700, color: no.tipo === "processo" && !no.processoNome ? cor.danger : cor.ink }}>
          {textoDoNo(no)}
        </span>
        {!fixo && (
          <>
            <button onClick={() => run(() => moverNo(setorId, no.id, "cima"))} disabled={indice <= 1} aria-label="Mover para cima" style={btnIcone(indice <= 1)}>↑</button>
            <button onClick={() => run(() => moverNo(setorId, no.id, "baixo"))} disabled={indice >= total - 2} aria-label="Mover para baixo" style={btnIcone(indice >= total - 2)}>↓</button>
            <button onClick={() => run(() => removerNo(setorId, no.id))} aria-label="Remover nó"
              style={{ border: "none", background: "transparent", color: cor.faint2, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          </>
        )}
      </div>

      {/* Decisão: pergunta + para onde vai o "Não" */}
      {no.tipo === "decisao" && (
        <div style={{ padding: "0 12px 12px", display: "grid", gap: 8 }}>
          <input defaultValue={no.pergunta ?? ""} placeholder="Pergunta da decisão (ex.: Cliente aprovou?)"
            onBlur={(e) => run(() => editarDecisao({ setorId, id: no.id, pergunta: e.target.value }))}
            style={{ border: `1px solid ${cor.hairline}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: cor.ink, background: cor.surface }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: cor.muted, fontWeight: 600 }}>
            Se <b style={{ color: cor.danger }}>Não</b>, vai para:
            <select defaultValue={no.destinoNaoId ?? ""} onChange={(e) => run(() => editarDecisao({ setorId, id: no.id, destinoNaoId: e.target.value }))}
              style={{ border: `1px solid ${cor.hairline}`, borderRadius: 8, padding: "6px 9px", fontSize: 12.5, color: cor.ink, background: cor.surface }}>
              <option value="">Fim (encerra o fluxo)</option>
              {destinos.filter((d) => d.id !== no.id).map((d) => (
                <option key={d.id} value={d.id}>{textoDoNo(d)}</option>
              ))}
            </select>
          </label>
          <span style={{ fontSize: 11.5, color: cor.faint }}>O caminho <b style={{ color: cor.success }}>Sim</b> segue para o próximo nó da sequência.</span>
        </div>
      )}
    </div>
  );
}

// ————— Desenho do fluxo (read-only) —————
function DesenhoFluxo({ nos }: { nos: NoFluxo[] }) {
  const rotuloDestino = (id: string | null) => {
    if (!id) return "Fim";
    const alvo = nos.find((n) => n.id === id);
    return alvo ? textoDoNo(alvo) : "Fim";
  };
  return (
    <div style={{ borderTop: `1px solid ${cor.surfaceSunk}`, paddingTop: 16 }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: cor.faint, marginBottom: 12 }}>
        Fluxo desenhado
      </div>
      <div style={{ display: "grid", justifyItems: "center", gap: 0 }}>
        {nos.map((n, i) => (
          <div key={n.id} style={{ display: "grid", justifyItems: "center", width: "100%" }}>
            <CaixaNo no={n} rotuloNao={n.tipo === "decisao" ? rotuloDestino(n.destinoNaoId) : null} />
            {i < nos.length - 1 && (
              <div aria-hidden style={{ width: 2, height: 24, background: cor.faint2, position: "relative" }}>
                {n.tipo === "decisao" && (
                  <span style={{ position: "absolute", top: 3, left: 8, fontSize: 10.5, fontWeight: 800, color: cor.success }}>Sim ↓</span>
                )}
                <span style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", color: cor.faint2, fontSize: 13, lineHeight: 1 }}>▼</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CaixaNo({ no, rotuloNao }: { no: NoFluxo; rotuloNao: string | null }) {
  const estilo = {
    inicio: { fundo: cor.successBg, borda: "#8dcb90", texto: "#256a2b", raio: 999 },
    fim: { fundo: cor.dangerBg, borda: "#e5a49e", texto: "#a33228", raio: 999 },
    processo: { fundo: cor.surfaceSunk, borda: "#9fc8e8", texto: cor.ink, raio: 10 },
    decisao: { fundo: cor.warnBg, borda: "#eecb7a", texto: cor.warnFg, raio: 12 },
  }[no.tipo];

  return (
    <div style={{ position: "relative", maxWidth: 360, minWidth: 190, textAlign: "center", background: estilo.fundo, border: `2px solid ${estilo.borda}`, color: estilo.texto, borderRadius: estilo.raio, padding: "12px 18px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, opacity: 0.6, marginBottom: 2 }}>{ROTULO_TIPO_NO[no.tipo].toUpperCase()}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{textoDoNo(no)}</div>
      {no.tipo === "decisao" && (
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: cor.danger }}>
          Não → {rotuloNao}
        </div>
      )}
    </div>
  );
}

const btnIcone = (desabilitado: boolean): React.CSSProperties => ({
  border: `1px solid ${cor.hairline}`,
  background: cor.surface,
  color: desabilitado ? "#d6dee6" : cor.muted,
  fontSize: 12, fontWeight: 800, width: 26, height: 26, borderRadius: 7,
  cursor: desabilitado ? "default" : "pointer", lineHeight: 1, padding: 0,
});
