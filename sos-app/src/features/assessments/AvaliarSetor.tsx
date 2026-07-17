"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import PainelRecursos from "@/features/resources/PainelRecursos";
import PainelProcessos from "@/features/processes/PainelProcessos";
import PainelResultados from "@/features/results/PainelResultados";
import { EIXOS_RH, type RecursosDoSetor } from "@/features/resources/tipos";
import { TIPOS_PROCESSO, type ProcessoComEixos } from "@/features/processes/tipos";
import type { ResultadosDoSetor } from "@/features/results/tipos";
import { salvarResposta, toggleFerramentaAnalise } from "./actions";
import { salvarObservacaoEtapa, salvarCheckEtapa, uploadAnexo, removeAnexo } from "./anexos-actions";
import { ajudaDaEtapa, INTRO_VISAO } from "./ajuda-visao";
import PopupAjuda from "./PopupAjuda";
import { ferramentaAtiva, type FerramentaAnalise } from "@/domain/ferramentas-analise";
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
  ferramentasHabilitadas = null,
}: {
  setorId: string;
  setorNome: string;
  avaliacaoId: string;
  criteriosIniciais: CriterioAvaliado[];
  recursos: RecursosDoSetor;
  processos: ProcessoComEixos[];
  resultados: ResultadosDoSetor;
  // null = escolha de ferramentas ainda não feita (todas aparecem + convite).
  ferramentasHabilitadas?: string[] | null;
}) {
  const [criterios, setCriterios] = useState(criteriosIniciais);
  const [nivelAtivo, setNivelAtivo] = useState<Nivel>("visao");

  // Abre a aba indicada pelo hash da URL (#processos, #tatico...), vindo
  // do banner "próximo passo" ou do clique na pirâmide. Também reage a
  // trocas de hash sem recarregar a página.
  useEffect(() => {
    const nivelValido = (h: string): h is Nivel =>
      ["visao", "tatico", "processos", "resultados"].includes(h);
    const aplicarHash = () => {
      const h = window.location.hash.replace("#", "");
      if (nivelValido(h)) setNivelAtivo(h);
    };
    aplicarHash();
    window.addEventListener("hashchange", aplicarHash);
    return () => window.removeEventListener("hashchange", aplicarHash);
  }, []);
  const [, startTransition] = useTransition();
  // Estado honesto de salvamento: começa neutro (ainda não salvou nada),
  // e só vira "salvo" após uma persistência real. Trata erro.
  const [statusSalvar, setStatusSalvar] = useState<"ocioso" | "salvando" | "salvo" | "erro">("ocioso");
  // Popup com a explicação do nível Visão (o que ele mede e o que não mede).
  const [introAberta, setIntroAberta] = useState(false);

  const itensVisao = criterios.filter((c) => c.nivel === "visao");

  // Tópicos de RESULTADO calculados dos processos tipados — inclusive
  // "Resultado de KPI", que é a maturidade dos processos que a área executa
  // para atingir cada indicador (o valor do KPI em si é medido fora do NEXO).
  const topicosResultado = useMemo(
    () =>
      TIPOS_PROCESSO.filter((t) => t.resultado).map((t) => {
        // Processo tipado sem notas conta como 0 — existir sem ser
        // executado derruba o resultado e provoca o preenchimento.
        const doTipo = processos.filter((p) => p.tipo === t.id);
        return {
          tipo: t.id,
          titulo: t.resultado!,
          origem: t.label,
          ehKpi: t.id === "kpi",
          media: media(doTipo.map((p) => p.media ?? 0)),
          processos: doTipo.map((p) => ({ nome: p.nome, media: p.media ?? 0 })),
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
    setStatusSalvar("salvando");
    startTransition(async () => {
      try {
        await salvarResposta({ avaliacaoId, criterioId: id, nota: novo.nota, status: novo.status });
        setStatusSalvar("salvo");
      } catch {
        setStatusSalvar("erro");
      }
    });
  }

  // Progresso da Visão: quantos critérios já foram respondidos (nota != null).
  // A lista `criterios` cobre só o nível Visão; Recursos/Processos/Resultado
  // têm painéis próprios, por isso o rótulo é específico da Visão.
  const respondidos = criterios.filter((c) => c.nota != null).length;
  const totalCriterios = criterios.length;
  const pctProgresso = totalCriterios ? Math.round((respondidos / totalCriterios) * 100) : 0;

  const metaNivel = NIVEIS.find((n) => n.id === nivelAtivo)!;
  const pctDoNivel: Record<Nivel, number> = {
    visao: pct.visao, tatico: pct.tatico, processos: pct.processos, resultados: pct.resultados,
  };

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 900, margin: "0 auto 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/setor/${setorId}`} style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Ver resultado</Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, color: "#0e1a24" }}>Avaliar — {setorNome}</h1>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12.5,
            fontWeight: 700,
            color:
              statusSalvar === "erro" ? "#c0392b"
              : statusSalvar === "salvando" ? "#d98a00"
              : statusSalvar === "salvo" ? "#33853a"
              : "#8493a0",
          }}
        >
          {statusSalvar === "erro" ? "⚠ falha ao salvar"
            : statusSalvar === "salvando" ? "salvando…"
            : statusSalvar === "salvo" ? "✓ salvo automaticamente"
            : "edições salvam automaticamente"}
        </span>
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
              {/* As ferramentas de cada etapa ligam/desligam no próprio card
                  da etapa (botão 📎), decididas pelo gestor caso a caso. */}

              {/* Princípio que orienta o nível — sempre visível. */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "#eef4f9", borderLeft: "4px solid #0068a9", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <p style={{ margin: 0, flex: "1 1 320px", fontSize: 13, lineHeight: 1.55, color: "#0e1a24", fontWeight: 600 }}>
                  A Visão nunca pergunta “isso está dando certo?”. Ela pergunta <b>“isso foi concebido e estruturado?”</b>.
                </p>
                <button
                  type="button"
                  onClick={() => setIntroAberta(true)}
                  style={{ border: "1px solid #cfe0ee", background: "#fff", color: "#0068a9", fontWeight: 700, fontSize: 12.5, padding: "7px 12px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  ? Como funciona a Visão
                </button>
              </div>

              <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "#8493a0" }}>
                Marque cada etapa que já foi <b>revisada com sinceridade</b> — <b style={{ color: "#0e1a24" }}>{itensVisao.filter((c) => c.status === "revisada").length}</b> de <b style={{ color: "#0e1a24" }}>{itensVisao.length}</b> revisadas. Cada etapa aceita descrição e documentos anexos.
              </p>
              {/* Barra de progresso das etapas da Visão. */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#5b6b78" }}>Progresso</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: metaNivel.cor, fontVariantNumeric: "tabular-nums" }}>
                    {respondidos} de {totalCriterios} · {pctProgresso}%
                  </span>
                </div>
                <div style={{ height: 8, background: "#eef4f9", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${pctProgresso}%`, height: "100%", background: metaNivel.cor, transition: "width .4s ease" }} />
                </div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {itensVisao.map((c) => (
                  <EtapaVisao key={c.id} etapa={c} avaliacaoId={avaliacaoId} setorId={setorId}
                    ferramentas={ferramentasHabilitadas}
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
              <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "#8493a0" }}>
                Cadastre cada processo da operação. Processos tipados — <b>Avaliação de desempenho, Governança, Monitoramento, Disciplina Operacional</b> e <b>Gestão por Objetivos</b> — alimentam automaticamente o nível Resultado.
              </p>
              {/* Duas ferramentas do N3, lado a lado:
                  • Mapa de Processos: o passo a passo DENTRO de cada processo.
                  • Fluxograma: liga os PROCESSOS do setor entre si (fluxo macro).
                  O Mapa saiu da Governança (Visão) e passou a viver aqui. */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <LinkFerramenta href={`/setor/${setorId}/mapa`}>⇉ Mapa de Processos — o passo a passo oficial dentro de cada processo ›</LinkFerramenta>
                <LinkFerramenta href={`/setor/${setorId}/fluxograma`}>🔀 Fluxograma — ligue os processos do setor em sequência ›</LinkFerramenta>
              </div>
              <PainelProcessos setorId={setorId} processos={processos} />
            </div>
          )}

          {/* ——— N4 RESULTADO: resultado de processo aplicado ——— */}
          {nivelAtivo === "resultados" && (
            <div>
              <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#8493a0" }}>
                O Resultado <b>não se preenche</b>: ele é a consequência do que foi executado. Cadastre um processo do tipo correspondente em <b>Processos</b> — e meça os <b>indicadores</b> na etapa Indicadores de Desempenho da Visão — que o resultado aparece aqui.
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
                    ) : t.ehKpi ? (
                      <div style={{ marginTop: 6, fontSize: 12.5, color: "#a2afba" }}>
                        Nenhum KPI ainda — declare-os na{" "}
                        <Link href={`/setor/${setorId}/indicadores`} style={{ color: "#0068a9", fontWeight: 700, textDecoration: "underline" }}>
                          etapa Indicadores de Desempenho
                        </Link>{" "}da Visão. Cada KPI vira um processo aqui em <b>Processos</b>, e é a execução desse processo que é medida.
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

      {introAberta && (
        <PopupAjuda
          titulo={INTRO_VISAO.titulo}
          blocos={INTRO_VISAO.blocos}
          onFechar={() => setIntroAberta(false)}
        />
      )}
    </div>
  );
}

// ————— Etapa da Visão: toggle + detalhes (descrição e anexos) —————
function EtapaVisao({
  etapa,
  avaliacaoId,
  setorId,
  ferramentas,
  onToggle,
}: {
  etapa: CriterioAvaliado;
  avaliacaoId: string;
  setorId: string;
  // Ferramentas habilitadas nesta análise (null = todas — escolha não feita).
  ferramentas: string[] | null;
  onToggle: () => void;
}) {
  // Etapas com ferramenta dedicada: estrutura → organograma; direcionamento
  // → objetivos/BSC/SWOT; indicadores → KPIs; governança → 3 pilares (RACI,
  // Controles, Sucessão). Cada ferramenta tem um interruptor no card: o
  // gestor liga/desliga caso a caso (o organograma é estrutural, não
  // desligável; o Mapa de Processos vive no N3, não aqui).
  const ehEstrutura = etapa.titulo.startsWith("Estrutura Organizacional");
  const ehDirecionamento = etapa.titulo.startsWith("Direcionamento Estratégico");
  const ehIndicadores = etapa.titulo.startsWith("Indicadores de Desempenho");
  const ehGovernanca = etapa.titulo.startsWith("Governança Operacional");
  const ativa = (f: FerramentaAnalise) => ferramentaAtiva(ferramentas as FerramentaAnalise[] | null, f);
  const [aberta, setAberta] = useState(false);
  const [desc, setDesc] = useState(etapa.observacao ?? "");
  const [checkPolitica, setCheckPolitica] = useState(etapa.checks?.politica_comercial === true);
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
        <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: "#0e1a24", display: "flex", alignItems: "center", gap: 6 }}>
          {etapa.titulo}
          <AjudaEtapa titulo={etapa.titulo} />
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: revisada ? "#33853a" : "#8493a0", textTransform: "uppercase", letterSpacing: ".04em" }}>{revisada ? "Revisado" : "Não revisado"}</span>
        <button onClick={() => setAberta((a) => !a)} aria-label={`Detalhes e anexos de ${etapa.titulo}`}
          style={{ border: "1px solid #dce6ee", background: "#fff", color: temDetalhe ? "#0068a9" : "#8493a0", fontWeight: 700, fontSize: 11.5, padding: "5px 10px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}>
          📎 {anexos.length > 0 ? anexos.length : ""} {aberta ? "▴" : "▾"}
        </button>
      </div>

      {aberta && (
        <div style={{ padding: "0 15px 14px 51px", display: "grid", gap: 8 }}>
          {ehEstrutura && (
            <>
              <LinkFerramenta href={`/setor/${setorId}/organograma`}>🏛 Montar organograma — gera o PDF e anexa aqui automaticamente ›</LinkFerramenta>
              {/* Check obrigatório: a Política Comercial precisa existir. Não
                  trava a revisão — mas desmarcado fica em destaque vermelho. */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, border: checkPolitica ? "1px solid #cfe0d0" : "1.5px solid #f0c0bd", background: checkPolitica ? "#f2faf3" : "#fdecea", borderRadius: 8, padding: "9px 12px", cursor: "pointer", justifySelf: "start" }}>
                <input
                  type="checkbox"
                  checked={checkPolitica}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setCheckPolitica(v);
                    start(async () => { await salvarCheckEtapa({ avaliacaoId, criterioId: etapa.id, check: "politica_comercial", valor: v }); });
                  }}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: checkPolitica ? "#256a2b" : "#c0392b" }}>
                  Possui Política Comercial{" "}
                  <span style={{ fontWeight: 600, color: checkPolitica ? "#33853a" : "#c0392b" }}>
                    {checkPolitica ? "· confirmada ✓" : "· obrigatória — confirme quando existir"}
                  </span>
                </span>
              </label>
            </>
          )}
          {ehDirecionamento && (
            <>
              <FerramentaComToggle avaliacaoId={avaliacaoId} ferramenta="objetivos" ativa={ativa("objetivos")} href={`/setor/${setorId}/objetivos`}>🎯 Objetivos estratégicos — cada objetivo com meta, prazo e status ›</FerramentaComToggle>
              <FerramentaComToggle avaliacaoId={avaliacaoId} ferramenta="bsc" ativa={ativa("bsc")} href={`/setor/${setorId}/bsc`}>🗺️ Mapa Estratégico (BSC) — os objetivos nas 4 perspectivas ›</FerramentaComToggle>
              <FerramentaComToggle avaliacaoId={avaliacaoId} ferramenta="swot" ativa={ativa("swot")} href={`/setor/${setorId}/swot`}>⚡ Análise SWOT — forças, fraquezas, oportunidades e ameaças ›</FerramentaComToggle>
            </>
          )}
          {ehIndicadores && (
            <FerramentaComToggle avaliacaoId={avaliacaoId} ferramenta="indicadores" ativa={ativa("indicadores")} href={`/setor/${setorId}/indicadores`}>📊 Indicadores de desempenho — cada KPI vira processo e Resultado ›</FerramentaComToggle>
          )}
          {ehGovernanca && (
            <>
              <FerramentaComToggle avaliacaoId={avaliacaoId} ferramenta="raci" ativa={ativa("raci")} href={`/setor/${setorId}/raci`}>⊞ Pilar 1 · Responsabilidades — Matriz RACI: quem executa, aprova, é consultado e informado ›</FerramentaComToggle>
              <FerramentaComToggle avaliacaoId={avaliacaoId} ferramenta="controles" ativa={ativa("controles")} href={`/setor/${setorId}/controles`}>☑ Pilar 2 · Controles operacionais — checklist do que acompanha a execução ›</FerramentaComToggle>
              <FerramentaComToggle avaliacaoId={avaliacaoId} ferramenta="sucessao" ativa={ativa("sucessao")} href={`/setor/${setorId}/sucessao`}>🔑 Pilar 3 · Sustentabilidade — matriz de sucessão: quem domina o quê (bus factor) ›</FerramentaComToggle>
            </>
          )}
          <textarea value={desc} onChange={(e) => aoDigitar(e.target.value)} onBlur={salvarDesc} rows={2}
            placeholder="Descrição / contexto desta etapa (salva ao sair do campo)…"
            style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#0e1a24", resize: "vertical", fontFamily: "inherit", background: "#fff" }} />

          {/* Sem botão de PDF aqui: os documentos das etapas da Visão (identidade,
              missão/valores etc.) são padronizados FORA do programa por ora — o
              gestor anexa o arquivo pronto. As ferramentas (plano de ação,
              objetivos, controles, sucessão) continuam com o PDF rastreável. */}
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

// ————— Ícone "?" que abre o popup com a explicação da etapa —————
function AjudaEtapa({ titulo }: { titulo: string }) {
  const [aberto, setAberto] = useState(false);
  const ajuda = ajudaDaEtapa(titulo);
  if (!ajuda) return null;

  return (
    <>
      <button
        type="button"
        aria-label={`O que é ${ajuda.titulo}`}
        onClick={(e) => { e.stopPropagation(); setAberto(true); }}
        style={{
          width: 17,
          height: 17,
          borderRadius: "50%",
          border: "1px solid #cfe0ee",
          background: "#eef4f9",
          color: "#5b6b78",
          fontSize: 11,
          fontWeight: 800,
          lineHeight: 1,
          cursor: "pointer",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        ?
      </button>
      {aberto && (
        <PopupAjuda
          titulo={ajuda.titulo}
          perguntaChave={ajuda.perguntaChave}
          blocos={ajuda.blocos}
          onFechar={() => setAberto(false)}
        />
      )}
    </>
  );
}

/** Link de ferramenta atrelada a uma etapa da Visão — estilo padronizado. */
function LinkFerramenta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", background: "#eef4f9", border: "1px solid #cfe0ee", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, fontWeight: 700, color: "#0068a9", justifySelf: "start" }}
    >
      {children}
    </Link>
  );
}

/**
 * Ferramenta de uma etapa da Visão COM o interruptor de habilitar/desabilitar.
 * O gestor responsável liga/desliga direto aqui. Desligada, a ferramenta
 * continua visível (apagada, sem link ativo) para poder ser religada.
 */
function FerramentaComToggle({
  avaliacaoId,
  ferramenta,
  ativa,
  href,
  children,
}: {
  avaliacaoId: string;
  ferramenta: FerramentaAnalise;
  ativa: boolean;
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [ligada, setLigada] = useState(ativa);
  const [salvando, setSalvando] = useState(false);

  const alternar = () => {
    const novo = !ligada;
    setLigada(novo);
    setSalvando(true);
    start(async () => {
      await toggleFerramentaAnalise(avaliacaoId, ferramenta, novo);
      setSalvando(false);
      router.refresh();
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: ligada ? 1 : 0.55 }}>
      {/* Interruptor */}
      <button
        type="button"
        role="switch"
        aria-checked={ligada}
        aria-label={ligada ? "Desabilitar esta ferramenta" : "Habilitar esta ferramenta"}
        onClick={alternar}
        disabled={salvando}
        title={ligada ? "Ferramenta habilitada — clique para desabilitar" : "Ferramenta desabilitada — clique para habilitar"}
        style={{ flexShrink: 0, width: 38, height: 22, borderRadius: 999, border: "none", background: ligada ? "#47ad4b" : "#c6d3de", position: "relative", cursor: salvando ? "default" : "pointer", transition: "background .2s", padding: 0 }}
      >
        <span style={{ position: "absolute", top: 2, left: ligada ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} />
      </button>
      {ligada ? (
        <LinkFerramenta href={href}>{children}</LinkFerramenta>
      ) : (
        <span
          aria-disabled
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f2f5f8", border: "1px solid #e0e7ee", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, fontWeight: 700, color: "#8493a0", justifySelf: "start" }}
        >
          {children}
        </span>
      )}
    </div>
  );
}
