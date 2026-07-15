"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addIndicador, removeIndicador, toggleAusenciaIndicador, salvarMedicaoIndicador, gerarDiagnostico } from "./actions";
import { criarPlanoDaRecomendacao, criarIshikawaDaRecomendacao } from "@/features/ferramentas/actions";
import { ROTULO_NIVEL, COR_SENTIDO, SETA_SENTIDO } from "@/domain/evolucao";
import type { RetratoEvolucao } from "@/domain/evolucao";
import type { ResultadosDoSetor, IndicadorItem, DirecaoIndicador } from "./tipos";

const GREEN = "#47ad4b", BLUE = "#0068a9", BLUE_D = "#004e80", INK = "#0e1a24";
const PRIO_COR: Record<number, string> = { 1: "#c0392b", 2: "#d98a00", 3: "#0068a9", 4: "#5b6b78", 5: "#8493a0" };

/** Cor do atingimento: verde bateu, âmbar perto, vermelho longe. */
const corAtingimento = (n: number) => (n >= 90 ? "#33853a" : n >= 70 ? "#d98a00" : "#c0392b");

const inputBase: React.CSSProperties = {
  border: "1px solid #dce6ee", borderRadius: 8, padding: "6px 8px",
  fontSize: 13, color: INK, width: "100%",
};

/** Uma linha de KPI: nome, meta, valor atual, direção e o atingimento
 *  calculado. É a medição daqui que vira a nota de "Resultado de KPI". */
function LinhaKpi({ i, onSalvar, onToggle, onRemover }: {
  i: IndicadorItem;
  onSalvar: (dados: { meta?: number | null; valorAtual?: number | null; unidade?: string | null; direcao?: DirecaoIndicador }) => void;
  onToggle: () => void;
  onRemover: () => void;
}) {
  // Estado local só para os campos digitáveis; o salvamento vai no blur.
  const [meta, setMeta] = useState(i.meta?.toString() ?? "");
  const [valor, setValor] = useState(i.valorAtual?.toString() ?? "");
  const [unidade, setUnidade] = useState(i.unidade ?? "");

  // Campo vazio = não medido (null), nunca zero.
  const num = (s: string) => { const t = s.trim().replace(",", "."); if (!t) return null; const n = Number(t); return Number.isFinite(n) ? n : null; };

  return (
    <div style={{ border: "1px solid #e3ebf1", borderRadius: 10, padding: "10px 12px", background: i.ehAusencia ? "#fffbfb" : "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i.ehAusencia ? 0 : 10 }}>
        <span style={{ fontWeight: 700, color: INK, fontSize: 13.5 }}>{i.nome}</span>
        <button onClick={onToggle}
          title={i.ehAusencia ? "Este KPI não é medido — conta como 0 no Resultado." : "Marcar como ausente (não medimos este indicador)."}
          style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, cursor: "pointer",
            border: i.ehAusencia ? "1px solid #f0c0bd" : "1px solid #cfe0d0",
            background: i.ehAusencia ? "#fdecea" : "#eef7ef",
            color: i.ehAusencia ? "#c0392b" : "#33853a" }}>
          {i.ehAusencia ? "ausente" : "medido"}
        </button>

        {/* Atingimento — a nota que este KPI entrega ao N4. */}
        {i.atingimento !== null ? (
          <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 800, color: corAtingimento(i.atingimento) }}>
            {i.atingimento}% da meta
          </span>
        ) : (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#a2afba", fontStyle: "italic" }}>sem medição</span>
        )}
        <button onClick={onRemover} style={{ border: "none", background: "transparent", color: "#c0ccd6", fontSize: 18, cursor: "pointer", lineHeight: 1 }} aria-label="Remover">×</button>
      </div>

      {/* KPI ausente não tem o que medir — some com os campos. */}
      {!i.ehAusencia && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.8fr 1.2fr", gap: 8 }}>
          <label style={{ fontSize: 11, color: "#5b6b78", fontWeight: 600 }}>
            Meta
            <input value={meta} inputMode="decimal" placeholder="95"
              onChange={(e) => setMeta(e.target.value)}
              onBlur={() => onSalvar({ meta: num(meta) })}
              style={{ ...inputBase, marginTop: 3 }} />
          </label>
          <label style={{ fontSize: 11, color: "#5b6b78", fontWeight: 600 }}>
            Valor atual
            <input value={valor} inputMode="decimal" placeholder="78"
              onChange={(e) => setValor(e.target.value)}
              onBlur={() => onSalvar({ valorAtual: num(valor) })}
              style={{ ...inputBase, marginTop: 3 }} />
          </label>
          <label style={{ fontSize: 11, color: "#5b6b78", fontWeight: 600 }}>
            Unidade
            <input value={unidade} placeholder="%"
              onChange={(e) => setUnidade(e.target.value)}
              onBlur={() => onSalvar({ unidade })}
              style={{ ...inputBase, marginTop: 3 }} />
          </label>
          <label style={{ fontSize: 11, color: "#5b6b78", fontWeight: 600 }}>
            Sentido
            <select value={i.direcao}
              onChange={(e) => onSalvar({ direcao: e.target.value as DirecaoIndicador })}
              style={{ ...inputBase, marginTop: 3, cursor: "pointer" }}>
              <option value="maior">Quanto maior, melhor</option>
              <option value="menor">Quanto menor, melhor</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

export default function PainelResultados({
  setorId,
  resultados,
}: {
  setorId: string;
  resultados: ResultadosDoSetor;
}) {
  const [novo, setNovo] = useState("");
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
      {/* Indicadores */}
      <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: INK }}>Indicadores (KPIs)</h4>
      <p style={{ fontSize: 12, color: "#5b6b78", margin: "0 0 10px" }}>
        O atingimento de cada KPI (valor × meta) forma a nota de <b>Resultado de KPI</b> na pirâmide.
      </p>
      {resultados.indicadores.length === 0 && <p style={{ fontSize: 13, color: "#a2afba", fontStyle: "italic", margin: "4px 0" }}>Nenhum KPI cadastrado.</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {resultados.indicadores.map((i) => (
          <LinhaKpi
            key={i.id}
            i={i}
            onSalvar={(dados) => run(() => salvarMedicaoIndicador(i.id, dados))}
            onToggle={() => run(() => toggleAusenciaIndicador(i.id, !i.ehAusencia))}
            onRemover={() => run(() => removeIndicador(i.id))}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input value={novo} placeholder="Nome do indicador (ex.: OTIF)" onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && novo.trim()) { run(() => addIndicador(setorId, novo.trim())); setNovo(""); } }}
          style={{ border: "1px solid #dce6ee", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: INK, flex: 1 }} />
        <button onClick={() => { if (novo.trim()) { run(() => addIndicador(setorId, novo.trim())); setNovo(""); } }}
          style={{ border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
      </div>
      <p style={{ fontSize: 12, color: "#8493a0", marginTop: 6 }}>
        Preencha <b>meta</b> e <b>valor atual</b> para o KPI virar nota. Marque como <b>ausente</b> o indicador que a área precisa ter mas não mede — ele conta como 0 e o diagnóstico sugere a ação.
      </p>

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
