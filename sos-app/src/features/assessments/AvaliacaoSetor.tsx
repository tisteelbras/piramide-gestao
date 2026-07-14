"use client";

import Link from "next/link";
import Piramide3D from "@/features/pyramid/Piramide3D";
import ProximoPasso from "./ProximoPasso";
import PendenciasAcionaveis from "./PendenciasAcionaveis";
import { grauMaturidade, ROTULO_MATURIDADE } from "@/domain/maturidade";
import { cor } from "@/design/tokens";
import { NIVEIS, type MaturidadeDTO } from "./tipos";

// Resumo das ferramentas geradas a partir deste setor (fecha o ciclo).
type FerramentasResumo = {
  planos5w2h: number;
  acoes5w2h: number;
  acoesConcluidas: number;
  analisesIshikawa: number;
};

// Status das ferramentas do diagnóstico neste setor.
type DiagnosticoResumo = {
  organograma: { pessoas: number };
  raci: { atividades: number; lacunas: number };
  mapa: { processos: number; documentados: number; padronizacao: number };
};

// Tela do setor = VISUALIZAÇÃO do modelo NEXO. A pirâmide preenche
// conforme as avaliações; a edição acontece em /setor/[id]/avaliar.
export default function AvaliacaoSetor({
  setorId,
  setorNome,
  maturidade,
  ferramentas,
  diagnostico,
}: {
  setorId: string;
  setorNome: string;
  maturidade: MaturidadeDTO;
  ferramentas?: FerramentasResumo;
  diagnostico?: DiagnosticoResumo;
}) {
  const { porNivel, geral, detalhe } = maturidade;
  const fmt = (v: number | null) => (v != null ? `${Math.round(v)}%` : "—");

  const linhaDetalhe: Record<string, string> = {
    visao: `${detalhe.visao.revisadas} de ${detalhe.visao.total} etapas revisadas`,
    tatico: `Humanos ${fmt(detalhe.tatico.rh)} · Sistêmico ${fmt(detalhe.tatico.sistemico)} · Estrutural ${fmt(detalhe.tatico.estrutural)}`,
    processos: detalhe.processos.porProcesso.length
      ? `${detalhe.processos.porProcesso.length} processo(s) ativo(s)`
      : "Nenhum processo cadastrado",
    resultados: `${detalhe.resultados.itens.filter((i) => i.nota != null).length} de ${detalhe.resultados.itens.length} resultados alimentados por processos`,
  };

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      <header style={{ maxWidth: 1160, margin: "0 auto 22px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href="/setores" style={{ textDecoration: "none", color: "#5b6b78", fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>‹ Setores</Link>
        <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, color: "#0e1a24" }}>{setorNome}</h1>
        <Link href={`/setor/${setorId}/avaliar`} style={{ marginLeft: "auto", textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#fff", background: "#0068a9", padding: "10px 16px", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,104,169,.25)" }}>✎ Avaliar</Link>
        <Link href={`/setor/${setorId}/relatorio`} style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "9px 14px", borderRadius: 10 }}>⭳ Relatório PDF</Link>
      </header>

      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <ProximoPasso setorId={setorId} porNivel={porNivel} />
      </div>

      <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(300px,1fr) minmax(340px,1fr)", gap: "clamp(20px,3vw,44px)", alignItems: "center" }}>
        {/* Pirâmide 3D */}
        <div>
          <Piramide3D preenchimento={porNivel} setorId={setorId} />
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <div style={{ fontSize: 13, color: "#8493a0", fontWeight: 600 }}>Maturidade geral</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#0068a9", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{Math.round(geral)}%</div>
            <span style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 800, color: "#fff", background: "#0068a9", padding: "3px 12px", borderRadius: 999 }}>{ROTULO_MATURIDADE[grauMaturidade(geral)]}</span>
          </div>
        </div>

        {/* Cartões de resultado por nível */}
        <div style={{ display: "grid", gap: 12 }}>
          {NIVEIS.map((n) => {
            const v = porNivel[n.id];
            return (
              <div key={n.id} style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", boxShadow: "0 10px 30px rgba(14,26,36,.06)", borderLeft: `5px solid ${n.cor}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ background: n.cor, color: "#fff", fontWeight: 800, fontSize: 12, padding: "3px 10px", borderRadius: 999 }}>{n.n}</span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "#0e1a24" }}>{n.titulo}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#8493a0", textTransform: "uppercase", letterSpacing: 1 }}>{n.tag}</span>
                  <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 800, color: n.cor, fontVariantNumeric: "tabular-nums" }}>{Math.round(v)}%</span>
                </div>
                <div style={{ height: 10, background: "#eef4f9", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${v}%`, height: "100%", background: n.cor, transition: "width .5s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12.5, color: "#8493a0" }}>
                  <span>{linhaDetalhe[n.id]}</span>
                  <span style={{ fontWeight: 700, color: n.corDark }}>{ROTULO_MATURIDADE[grauMaturidade(v)]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1160, margin: "clamp(20px,3vw,32px) auto 0" }}>
        <PendenciasAcionaveis setorId={setorId} setorNome={setorNome} porNivel={porNivel} />
      </div>

      {/* Ferramentas do diagnóstico: o que sustenta a estrutura do setor. */}
      {diagnostico && (
        <div style={{ maxWidth: 1160, margin: "clamp(20px,3vw,28px) auto 0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: cor.ink, margin: "0 0 4px" }}>
            Ferramentas do diagnóstico
          </h2>
          <p style={{ fontSize: 13, color: cor.faint, margin: "0 0 14px" }}>
            O que sustenta a estrutura desta área. Cada uma alimenta um ponto da pirâmide.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
            <CartaoDiagnostico
              href={`/setor/${setorId}/organograma`}
              emoji="🏛"
              nome="Organograma"
              alimenta="Visão · Estrutura + Recurso Humano"
              ok={diagnostico.organograma.pessoas > 0}
              status={
                diagnostico.organograma.pessoas
                  ? `${diagnostico.organograma.pessoas} pessoa${diagnostico.organograma.pessoas === 1 ? "" : "s"} mapeadas`
                  : "ninguém cadastrado ainda"
              }
            />
            <CartaoDiagnostico
              href={`/setor/${setorId}/raci`}
              emoji="⊞"
              nome="Matriz de Responsabilidade"
              alimenta="Governança · pilar Responsabilidades"
              ok={diagnostico.raci.atividades > 0 && diagnostico.raci.lacunas === 0}
              status={
                !diagnostico.raci.atividades
                  ? "sem processos para atribuir"
                  : diagnostico.raci.lacunas
                    ? `${diagnostico.raci.lacunas} lacuna${diagnostico.raci.lacunas === 1 ? "" : "s"} de responsabilidade`
                    : "responsabilidades definidas"
              }
            />
            <CartaoDiagnostico
              href={`/setor/${setorId}/mapa`}
              emoji="⇉"
              nome="Mapa de Processos"
              alimenta="Governança · pilar Padronização"
              ok={diagnostico.mapa.processos > 0 && diagnostico.mapa.padronizacao === 100}
              status={
                !diagnostico.mapa.processos
                  ? "sem processos cadastrados"
                  : `${diagnostico.mapa.padronizacao}% padronizado (${diagnostico.mapa.documentados}/${diagnostico.mapa.processos})`
              }
            />
          </div>
        </div>
      )}

      {/* Ciclo fechado: ferramentas já geradas a partir deste setor. */}
      {ferramentas && (ferramentas.planos5w2h > 0 || ferramentas.analisesIshikawa > 0) && (
        <div style={{ maxWidth: 1160, margin: "clamp(20px,3vw,28px) auto 0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: cor.ink, margin: "0 0 4px" }}>
            Ações em andamento neste setor
          </h2>
          <p style={{ fontSize: 13, color: cor.faint, margin: "0 0 14px" }}>
            O que já nasceu das lacunas deste setor. Acompanhe e conclua nas ferramentas.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {ferramentas.planos5w2h > 0 && (
              <Link href="/ferramentas/5w2h" style={{ textDecoration: "none", background: cor.surface, border: "1px solid #e6edf3", borderRadius: 12, padding: "14px 16px", display: "block" }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: cor.faint }}>🗂️ Planos 5W2H</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: cor.brand, fontVariantNumeric: "tabular-nums" }}>{ferramentas.planos5w2h}</div>
                <div style={{ fontSize: 12.5, color: cor.muted }}>
                  {ferramentas.acoes5w2h > 0
                    ? `${ferramentas.acoesConcluidas} de ${ferramentas.acoes5w2h} ações concluídas`
                    : "sem ações ainda"}
                </div>
              </Link>
            )}
            {ferramentas.analisesIshikawa > 0 && (
              <Link href="/ferramentas/ishikawa" style={{ textDecoration: "none", background: cor.surface, border: "1px solid #e6edf3", borderRadius: 12, padding: "14px 16px", display: "block" }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: cor.faint }}>🐟 Análises Ishikawa</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: cor.brand, fontVariantNumeric: "tabular-nums" }}>{ferramentas.analisesIshikawa}</div>
                <div style={{ fontSize: 12.5, color: cor.muted }}>investigações de causa raiz</div>
              </Link>
            )}
          </div>
        </div>
      )}

      <footer style={{ maxWidth: 1160, margin: "clamp(24px,4vw,40px) auto 0", paddingTop: 16, borderTop: "1px solid #d7e0e8", textAlign: "center" }}>
        <p style={{ margin: 0, color: "#8493a0", fontSize: 12.5, fontWeight: 600 }}>
          <b style={{ color: "#0068a9" }}>NEXO</b> — Conectar. Executar. Evoluir. · Visão → Recursos → Processos → Resultados
        </p>
      </footer>
    </div>
  );
}

// Cartão de uma ferramenta do diagnóstico: mostra o que ela alimenta na
// pirâmide e o estado atual dela neste setor.
function CartaoDiagnostico({
  href,
  emoji,
  nome,
  alimenta,
  status,
  ok,
}: {
  href: string;
  emoji: string;
  nome: string;
  alimenta: string;
  status: string;
  ok: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        background: cor.surface,
        border: "1px solid #e6edf3",
        borderLeft: `5px solid ${ok ? cor.success : cor.warn}`,
        borderRadius: 12,
        padding: "13px 15px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden style={{ fontSize: 17 }}>{emoji}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: cor.ink }}>{nome}</span>
      </span>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: cor.brand }}>{alimenta}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: ok ? cor.success : cor.warnFg, marginTop: 2 }}>
        {ok ? "✓ " : "⚠ "}
        {status}
      </span>
    </Link>
  );
}
