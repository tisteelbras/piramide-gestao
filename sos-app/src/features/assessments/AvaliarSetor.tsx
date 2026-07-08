"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import PainelRecursos from "@/features/resources/PainelRecursos";
import PainelProcessos from "@/features/processes/PainelProcessos";
import PainelResultados from "@/features/results/PainelResultados";
import { EIXOS_RH, type RecursosDoSetor } from "@/features/resources/tipos";
import { TIPOS_PROCESSO, type ProcessoComEixos } from "@/features/processes/tipos";
import type { ResultadosDoSetor } from "@/features/results/tipos";
import { salvarResposta } from "./actions";
import { salvarObservacaoEtapa, uploadAnexo, removeAnexo } from "./anexos-actions";
import { NIVEIS, type CriterioAvaliado, type Nivel } from "./tipos";

const arred = (n: number) => Math.round(n);
const media = (vals: number[]): number | null =>
  vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

export default function AvaliarSetor({
  setorId,
  setorNome,
  avaliacaoId,
  criteriosIniciais,
  recursos,
  processos,
  resultados,
}: {
  setorId: string;
  setorNome: string;
  avaliacaoId: string;
  criteriosIniciais: CriterioAvaliado[];
  recursos: RecursosDoSetor;
  processos: ProcessoComEixos[];
  resultados: ResultadosDoSetor;
}) {
  const [criterios, setCriterios] = useState(criteriosIniciais);
  const [nivelAtivo, setNivelAtivo] = useState<Nivel>("visao");
  const [, startTransition] = useTransition();
  const [salvando, setSalvando] = useState(false);

  const itensVisao = criterios.filter((c) => c.nivel === "visao");

  // Tópicos de RESULTADO calculados dos processos tipados.
  const topicosResultado = useMemo(
    () =>
      TIPOS_PROCESSO.filter((t) => t.resultado).map((t) => {
        const doTipo = processos.filter((p) => p.tipo === t.id && p.media !== null);
        return {
          tipo: t.id,
          titulo: t.resultado!,
          origem: t.label,
          media: media(doTipo.map((p) => p.media!)),
          processos: doTipo.map((p) => ({ nome: p.nome, media: p.media! })),
        };
      }),
    [processos],
  );

  // % ao vivo de cada nível (modelo NEXO)
  const pct = useMemo(() => {
    const revisadas = itensVisao.filter((c) => c.status === "revisada").length;
    const visao = itensVisao.length ? (revisadas / itensVisao.length) * 100 : 0;

    const mediasColab = recursos.colaboradores
      .map((c) => media(EIXOS_RH.map((e) => c.notas[e.id]).filter((n): n is number => n != null)))
      .filter((m): m is number => m !== null);
    const rh = media(mediasColab);
    const sist = media(recursos.sistemas.filter((s) => !s.ehNecessidade && s.nota != null).map((s) => s.nota!));
    const estr = media(recursos.ativos.filter((a) => a.nota != null).map((a) => a.nota!));
    const grupos = [rh, sist, estr].filter((m): m is number => m !== null);
    const tatico = media(grupos) ?? 0;

    const processosPct = media(processos.map((p) => p.media).filter((m): m is number => m !== null)) ?? 0;
    const resultadosPct = media(topicosResultado.map((t) => t.media).filter((m): m is number => m !== null)) ?? 0;

    return { visao, tatico, processos: processosPct, resultados: resultadosPct, grupos: { rh, sist, estr } };
  }, [itensVisao, recursos, processos, topicosResultado]);

  function salva(id: string, patch: Partial<CriterioAvaliado>) {
    const alvo = criterios.find((c) => c.id === id)!;
    const novo = { ...alvo, ...patch };
    setCriterios((cs) => cs.map((c) => (c.id === id ? novo : c)));
    setSalvando(true);
    startTransition(async () => {
      await salvarResposta({ avaliacaoId, criterioId: id, nota: novo.nota, status: novo.status });
      setSalvando(false);
    });
  }

  const metaNivel = NIVEIS.find((n) => n.id === nivelAtivo)!;
  const pctDoNivel: Record<Nivel, number> = {
    visao: pct.visao, tatico: pct.tatico, processos: pct.processos, resultados: pct.resultados,
  };

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 900, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${setorId}`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Ver resultado</Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, color: "#0e1a24" }}>Avaliar — {setorNome}</h1>
        <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, color: salvando ? "#d98a00" : "#33853a" }}>{salvando ? "salvando…" : "✓ salvo"}</span>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {NIVEIS.map((n) => {
            const ativo = nivelAtivo === n.id;
            return (
              <button key={n.id} onClick={() => setNivelAtivo(n.id)}
                style={{ border: ativo ? `2px solid ${n.cor}` : "1px solid #dce6ee", background: ativo ? n.cor : "#fff", color: ativo ? "#fff" : "#46586a", fontWeight: 700, fontSize: 13, padding: "9px 14px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <span>{n.n} {n.titulo}</span>
                <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.85 }}>{arred(pctDoNivel[n.id])}%</span>
              </button>
            );
          })}
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,26px)", boxShadow: "0 20px 50px rgba(14,26,36,.10)", borderTop: `6px solid ${metaNivel.cor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ background: metaNivel.cor, color: "#fff", fontWeight: 800, fontSize: 13, padding: "4px 11px", borderRadius: 999 }}>{metaNivel.n}</span>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{metaNivel.titulo}</h2>
            <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 800, color: metaNivel.cor, fontVariantNumeric: "tabular-nums" }}>{arred(pctDoNivel[nivelAtivo])}%</span>
          </div>

          {/* ——— N1 VISÃO ——— */}
          {nivelAtivo === "visao" && (
            <div>
              <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#8493a0" }}>
                Marque cada etapa que já foi <b>revisada com sinceridade</b> — <b style={{ color: "#0e1a24" }}>{itensVisao.filter((c) => c.status === "revisada").length}</b> de <b style={{ color: "#0e1a24" }}>{itensVisao.length}</b> revisadas. Cada etapa aceita descrição e documentos anexos.
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {itensVisao.map((c) => (
                  <EtapaVisao key={c.id} etapa={c} avaliacaoId={avaliacaoId}
                    onToggle={() => salva(c.id, c.status === "revisada" ? { status: "nao_iniciada", nota: null } : { status: "revisada", nota: 100 })} />
                ))}
              </div>
            </div>
          )}

          {/* ——— N2 RECURSOS ——— */}
          {nivelAtivo === "tatico" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 4 }}>
                {[
                  { label: "Humanos", v: pct.grupos.rh },
                  { label: "Sistêmico", v: pct.grupos.sist },
                  { label: "Estrutural", v: pct.grupos.estr },
                ].map((g) => (
                  <div key={g.label} style={{ background: "#f4f8fb", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#8493a0" }}>{g.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: g.v != null ? "#33853a" : "#c0ccd6", fontVariantNumeric: "tabular-nums" }}>{g.v != null ? `${arred(g.v)}%` : "—"}</div>
                  </div>
                ))}
              </div>
              <PainelRecursos setorId={setorId} avaliacaoId={avaliacaoId} recursos={recursos} />
            </div>
          )}

          {/* ——— N3 PROCESSOS ——— */}
          {nivelAtivo === "processos" && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 13.5, color: "#8493a0" }}>
                Cadastre cada processo da operação. Processos dos tipos <b>Avaliação de desempenho, Governança, Monitoramento e KPI</b> alimentam automaticamente o nível Resultado.
              </p>
              <PainelProcessos setorId={setorId} processos={processos} />
            </div>
          )}

          {/* ——— N4 RESULTADO: resultado de processo aplicado ——— */}
          {nivelAtivo === "resultados" && (
            <div>
              <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#8493a0" }}>
                O Resultado <b>não se preenche</b>: ele é a consequência dos processos aplicados. Cadastre um processo do tipo correspondente em <b>Processos</b> e o resultado aparece aqui.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                {topicosResultado.map((t) => (
                  <div key={t.tipo} style={{ border: "1px solid #e3ebf1", borderRadius: 12, padding: "13px 15px", background: t.media != null ? "#fff" : "#f8fafc" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: t.media != null ? "#0e1a24" : "#8493a0" }}>{t.titulo}</span>
                      <span style={{ marginLeft: "auto", fontSize: 19, fontWeight: 800, color: t.media != null ? "#33853a" : "#c0ccd6", fontVariantNumeric: "tabular-nums" }}>
                        {t.media != null ? `${arred(t.media)}%` : "—"}
                      </span>
                    </div>
                    {t.processos.length > 0 ? (
                      <div style={{ marginTop: 6, fontSize: 12.5, color: "#5b6b78" }}>
                        {t.processos.map((p) => `${p.nome} (${arred(p.media)}%)`).join(" · ")}
                      </div>
                    ) : (
                      <div style={{ marginTop: 6, fontSize: 12.5, color: "#a2afba" }}>
                        Nenhum processo do tipo “{t.origem}” ainda.{" "}
                        <button onClick={() => setNivelAtivo("processos")} style={{ border: "none", background: "transparent", color: "#0068a9", fontWeight: 700, cursor: "pointer", textDecoration: "underline", fontSize: 12.5, padding: 0 }}>
                          Cadastrar em Processos
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <PainelResultados setorId={setorId} resultados={resultados} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ————— Etapa da Visão: toggle + detalhes (descrição e anexos) —————
function EtapaVisao({
  etapa,
  avaliacaoId,
  onToggle,
}: {
  etapa: CriterioAvaliado;
  avaliacaoId: string;
  onToggle: () => void;
}) {
  const [aberta, setAberta] = useState(false);
  const [desc, setDesc] = useState(etapa.observacao ?? "");
  const [anexos, setAnexos] = useState(etapa.anexos);
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, start] = useTransition();
  const revisada = etapa.status === "revisada";
  const temDetalhe = (etapa.observacao?.length ?? 0) > 0 || anexos.length > 0;

  const persisteDesc = (valor: string) =>
    start(async () => { await salvarObservacaoEtapa({ avaliacaoId, criterioId: etapa.id, observacao: valor }); });
  // Salva com debounce enquanto digita, e também no blur.
  const aoDigitar = (valor: string) => {
    setDesc(valor);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persisteDesc(valor), 1200);
  };
  const salvarDesc = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    persisteDesc(desc);
  };

  const enviarArquivo = (f: File) => {
    setEnviando(true);
    start(async () => {
      const fd = new FormData();
      fd.append("avaliacaoId", avaliacaoId);
      fd.append("criterioId", etapa.id);
      fd.append("arquivo", f);
      const r = await uploadAnexo(fd);
      if (r.ok) setAnexos((a) => [...a, { id: "temp-" + Date.now(), nomeOriginal: f.name, tamanhoBytes: f.size }]);
      setEnviando(false);
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  return (
    <div style={{ border: revisada ? "2px solid #47ad4b" : "1px solid #e3ebf1", background: revisada ? "#f2faf3" : "#fff", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px" }}>
        <button onClick={onToggle} aria-label={revisada ? "Desmarcar" : "Marcar como revisado"}
          style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", background: revisada ? "#47ad4b" : "#fff", border: revisada ? "none" : "2px solid #c6d3de", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
          {revisada ? "✓" : ""}
        </button>
        <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: "#0e1a24" }}>{etapa.titulo}</span>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: revisada ? "#33853a" : "#8493a0", textTransform: "uppercase", letterSpacing: ".04em" }}>{revisada ? "Revisado" : "Não revisado"}</span>
        <button onClick={() => setAberta((a) => !a)} aria-label={`Detalhes e anexos de ${etapa.titulo}`}
          style={{ border: "1px solid #dce6ee", background: "#fff", color: temDetalhe ? "#0068a9" : "#8493a0", fontWeight: 700, fontSize: 11.5, padding: "5px 10px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}>
          📎 {anexos.length > 0 ? anexos.length : ""} {aberta ? "▴" : "▾"}
        </button>
      </div>

      {aberta && (
        <div style={{ padding: "0 15px 14px 51px", display: "grid", gap: 8 }}>
          <textarea value={desc} onChange={(e) => aoDigitar(e.target.value)} onBlur={salvarDesc} rows={2}
            placeholder="Descrição / contexto desta etapa (salva ao sair do campo)…"
            style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#0e1a24", resize: "vertical", fontFamily: "inherit", background: "#fff" }} />
          {anexos.length > 0 && (
            <div style={{ display: "grid", gap: 4 }}>
              {anexos.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                  <a href={a.id.startsWith("temp-") ? undefined : `/api/anexos/${a.id}`}
                    style={{ color: "#0068a9", fontWeight: 700, textDecoration: "none" }}>
                    📄 {a.nomeOriginal}
                  </a>
                  {a.tamanhoBytes != null && <span style={{ color: "#a2afba" }}>({Math.max(1, Math.round(a.tamanhoBytes / 1024))} KB)</span>}
                  {!a.id.startsWith("temp-") && (
                    <button onClick={() => { setAnexos((l) => l.filter((x) => x.id !== a.id)); start(async () => { await removeAnexo(a.id); }); }}
                      style={{ border: "none", background: "transparent", color: "#c0ccd6", cursor: "pointer", fontSize: 15, lineHeight: 1 }} aria-label="Remover anexo">×</button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div>
            <input ref={fileRef} type="file" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarArquivo(f); }} />
            <button onClick={() => fileRef.current?.click()} disabled={enviando}
              style={{ border: "1.5px dashed #9fc0d8", background: "transparent", color: "#0068a9", fontWeight: 700, fontSize: 12.5, padding: "7px 12px", borderRadius: 8, cursor: "pointer" }}>
              {enviando ? "Enviando…" : "+ Anexar documento"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
