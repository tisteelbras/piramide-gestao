"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { gerarDiagnostico } from "./actions";
import { criarPlanoDaRecomendacao, criarIshikawaDaRecomendacao } from "@/features/ferramentas/actions";
import { ROTULO_NIVEL, COR_SENTIDO, SETA_SENTIDO } from "@/domain/evolucao";
import type { RetratoEvolucao } from "@/domain/evolucao";
import type { ResultadosDoSetor } from "./tipos";

const BLUE = "#0068a9", BLUE_D = "#004e80", INK = "#0e1a24";
const PRIO_COR: Record<number, string> = { 1: "#c0392b", 2: "#d98a00", 3: "#0068a9", 4: "#5b6b78", 5: "#8493a0" };

export default function PainelResultados({
  setorId,
  resultados,
}: {
  setorId: string;
  resultados: ResultadosDoSetor;
}) {
  const [gerando, setGerando] = useState(false);
  const [avisoIA, setAvisoIA] = useState<"sem_config" | "falha" | null>(null);
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(() => { void fn(); });

  // Recomendação → ferramenta de apoio (análise clínica), com 1 clique.
  const abrirPlano = (recId: string, titulo: string, detalhe: string | null) => {
    setAbrindo(recId);
    start(async () => {
      await criarPlanoDaRecomendacao(setorId, titulo, detalhe, recId);
      router.push(`/setor/${setorId}/plano`);
    });
  };
  const abrirIshikawa = (recId: string, titulo: string) => {
    setAbrindo(recId);
    start(async () => {
      await criarIshikawaDaRecomendacao(setorId, titulo);
      router.push("/ferramentas/ishikawa");
    });
  };

  return (
    <div style={{ marginTop: 18, borderTop: "1px solid #e3ebf1", paddingTop: 16 }}>
      {/* Os indicadores (KPIs) NÃO aparecem aqui: eles se cadastram e se medem
          na etapa "Indicadores de Desempenho" da Visão. No N4, o desempenho
          deles entra apenas consolidado, como o card "Resultado de KPI" nos
          tópicos acima. */}

      {/* Evolução desde o último ciclo */}
      {resultados.evolucao && <PainelEvolucao ev={resultados.evolucao} />}

      {/* Diagnóstico */}
      <div style={{ marginTop: 20, background: "#f4f8fb", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: resultados.recomendacoes.length ? 14 : 0, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: BLUE_D }}>Diagnóstico automático</div>
            <div style={{ fontSize: 12, color: "#5b6b78" }}>Regras + IA cruzam todos os níveis e geram recomendações priorizadas.</div>
          </div>
          <button
            onClick={() => {
              setGerando(true);
              start(async () => {
                const r = await gerarDiagnostico(setorId);
                setAvisoIA(r?.ia && r.ia.motivo !== "ok" ? r.ia.motivo : null);
                setGerando(false);
                router.refresh();
              });
            }}
            disabled={gerando}
            style={{ marginLeft: "auto", border: "none", background: gerando ? "#7fb4d8" : BLUE, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 16px", borderRadius: 10, cursor: gerando ? "default" : "pointer", boxShadow: "0 4px 12px rgba(0,104,169,.25)" }}>
            {gerando ? "Analisando…" : "⚡ Gerar diagnóstico"}
          </button>
        </div>

        {/* Aviso quando a camada de IA não rodou — o diagnóstico por regra
            está completo mesmo assim. */}
        {avisoIA && (
          <div style={{ margin: "0 0 12px", fontSize: 12, color: "#8a6d00", background: "#fff8e6", border: "1px solid #f0e0a8", borderRadius: 8, padding: "8px 11px" }}>
            {avisoIA === "sem_config"
              ? "As recomendações abaixo são as das regras. A camada de IA está desligada — configure uma chave em .env.local (AI_API_KEY) para ativá-la."
              : "A camada de IA não respondeu desta vez; mostrando as recomendações das regras. Tente gerar de novo em instantes."}
          </div>
        )}

        <div style={{ display: "grid", gap: 8 }}>
          {resultados.recomendacoes.map((r) => (
            <div key={r.id} style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 10, padding: "10px 12px", borderLeft: `4px solid ${PRIO_COR[r.prioridade] ?? BLUE}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: PRIO_COR[r.prioridade] ?? BLUE, padding: "2px 7px", borderRadius: 999 }}>P{r.prioridade}</span>
                {r.origem === "ia" && (
                  <span title="Recomendação da análise por IA, cruzando os 4 níveis"
                    style={{ fontSize: 10.5, fontWeight: 800, color: "#6b3fa0", background: "#f3edfb", border: "1px solid #d9c9f0", padding: "2px 7px", borderRadius: 999 }}>
                    ✨ IA
                  </span>
                )}
                <span style={{ fontWeight: 800, fontSize: 13.5, color: INK }}>{r.titulo}</span>
                {r.persistencia && (
                  <span title="Esta recomendação sobreviveu a fechamentos de ciclo anteriores"
                    style={{ fontSize: 10.5, fontWeight: 700, color: "#c0392b", background: "#fdecea", border: "1px solid #f0c0bd", padding: "2px 7px", borderRadius: 999 }}>
                    ⏳ {r.persistencia}
                  </span>
                )}
              </div>
              {r.detalhe && <p style={{ margin: "2px 0", fontSize: 12.5, color: "#5b6b78" }}>{r.detalhe}</p>}
              {r.impactoEsperado && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#33853a", fontWeight: 600 }}>Impacto: {r.impactoEsperado}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <button onClick={() => abrirPlano(r.id, r.titulo, r.detalhe)} disabled={abrindo === r.id}
                  style={{ border: "1px solid #cfe0ee", background: "#fff", color: BLUE, fontWeight: 700, fontSize: 11.5, padding: "5px 10px", borderRadius: 8, cursor: abrindo === r.id ? "default" : "pointer" }}>
                  {abrindo === r.id ? "Abrindo…" : "🗂️ Criar plano 5W2H"}
                </button>
                <button onClick={() => abrirIshikawa(r.id, r.titulo)} disabled={abrindo === r.id}
                  style={{ border: "1px solid #cfe0ee", background: "#fff", color: BLUE, fontWeight: 700, fontSize: 11.5, padding: "5px 10px", borderRadius: 8, cursor: abrindo === r.id ? "default" : "pointer" }}>
                  🐟 Analisar causa (Ishikawa)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Evolução desde o último ciclo fechado: o geral e cada nível com sua
 *  seta e o delta em pontos. É o que dá senso de jornada ao diagnóstico —
 *  "caiu de 72 para 58", não só "está em 58". */
function PainelEvolucao({ ev }: { ev: RetratoEvolucao }) {
  if (!ev.temAnterior) return null; // primeiro ciclo: nada a comparar ainda
  const data = ev.dataAnterior ? new Date(ev.dataAnterior).toLocaleDateString("pt-BR") : "";
  const cor = COR_SENTIDO[ev.geralSentido];
  const sinal = (d: number) => (d > 0 ? `+${d}` : `${d}`);

  return (
    <div style={{ marginTop: 20, background: "#fff", border: "1px solid #e3ebf1", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: INK }}>Evolução desde o último ciclo</span>
        <span style={{ fontSize: 12, color: "#8493a0" }}>fechado em {data}</span>
        <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: cor }}>
          {SETA_SENTIDO[ev.geralSentido]} Geral {ev.geralAntes}% → {ev.geralAgora}%
          {ev.geralSentido !== "estavel" && <span> ({sinal(ev.geralDelta)})</span>}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        {ev.porNivel.map((n) => {
          const c = COR_SENTIDO[n.sentido];
          return (
            <div key={n.nivel} style={{ border: "1px solid #eef3f7", borderRadius: 10, padding: "9px 11px", borderLeft: `4px solid ${c}` }}>
              <div style={{ fontSize: 11.5, color: "#5b6b78", fontWeight: 600 }}>{ROTULO_NIVEL[n.nivel]}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums" }}>{n.agora}%</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: c }}>
                  {SETA_SENTIDO[n.sentido]}{n.sentido !== "estavel" ? ` ${sinal(n.delta)}` : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11.5, color: "#8493a0", margin: "10px 0 0" }}>
        Compara o estado atual com a foto do último fechamento de ciclo (em Configurações). Verde subiu, vermelho caiu, cinza estável.
      </p>
    </div>
  );
}
