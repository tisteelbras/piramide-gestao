import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/logout-action";
import { grauMaturidade, ROTULO_MATURIDADE } from "@/domain/maturidade";
import { NIVEIS } from "@/features/assessments/tipos";
import Radar from "./Radar";
import EvolucaoChart from "./EvolucaoChart";
import CompararSetores from "./CompararSetores";
import PainelHoje from "./PainelHoje";
import type { DadosDashboard } from "./queries";
import { ROTULO_QUADRANTE, type Quadrante, type ResumoFerramentas } from "@/features/ferramentas/tipos";
import { ROTULO_ESTADO, type GovernancaDTO } from "@/features/governanca/tipos";
import CartaoSaudacao from "./CartaoSaudacao";
import TutorialPopup from "@/features/onboarding/TutorialPopup";

// Cor sequencial de maturidade (claro→escuro no azul da marca).
// O número aparece em toda célula, então a cor é reforço, não a única info.
function corCelula(v: number): { bg: string; fg: string } {
  if (v <= 0) return { bg: "#f0f4f8", fg: "#a2afba" };
  if (v < 40) return { bg: "#fbe4e2", fg: "#8a2a22" };
  if (v < 65) return { bg: "#fde7cf", fg: "#8a5a08" };
  if (v < 85) return { bg: "#d7e8f4", fg: "#0e4a70" };
  return { bg: "#cfe9d2", fg: "#1f5b28" };
}

// Organograma consolidado (só o que o dashboard precisa exibir).
type OrganogramaResumo = {
  setorId: string;
  setorNome: string;
  pessoas: { id: string }[];
}[];

export default function DashboardExec({
  usuarioNome,
  usuarioId,
  temFoto,
  papel,
  dados,
  ferramentas,
  governanca,
  organograma,
  inicio,
}: {
  usuarioNome: string | null;
  usuarioId?: string | null;
  temFoto?: boolean;
  papel?: string | null;
  dados: DadosDashboard;
  // Agregado do hub de ferramentas — opcional para não acoplar o dashboard.
  ferramentas?: ResumoFerramentas;
  // Ciclos, metas e histórico — opcional pelo mesmo motivo.
  governanca?: GovernancaDTO;
  // Estrutura das áreas — opcional pelo mesmo motivo.
  organograma?: OrganogramaResumo;
  // Presente quando o dashboard é a tela inicial: saudação, resumo do
  // conceito e tutorial de boas-vindas no 1º acesso.
  inicio?: { mostrarTutorial: boolean };
}) {
  const grauEmpresa = grauMaturidade(dados.mediaEmpresa);
  // Escopo do dashboard: líder vê só a área dele; admin/direção veem a empresa.
  const soSetor = dados.escopo === "setor";
  const nomeArea = soSetor ? dados.setores[0]?.nome ?? "sua área" : null;
  const cicloDe = (setorId: string) => governanca?.ciclos.find((c) => c.setorId === setorId);
  const atrasadas = governanca?.ciclos.filter((c) => c.estado === "atrasada") ?? [];
  const emAlerta = governanca?.ciclos.filter((c) => c.estado === "alerta") ?? [];

  return (
    <div style={{ minHeight: "100vh", padding: "clamp(16px,4vw,44px)" }}>
      {inicio?.mostrarTutorial && <TutorialPopup nome={usuarioNome} />}

      <header style={{ maxWidth: 1160, margin: "0 auto 24px", display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          {inicio ? (
            <CartaoSaudacao nome={usuarioNome} usuarioId={usuarioId ?? null} temFoto={!!temFoto} papel={papel ?? null} />
          ) : (
            <>
              <Image src="/steelbras-logo.svg" alt="Steelbras" width={130} height={47} style={{ height: 34, width: "auto" }} priority />
              <h1 style={{ fontSize: "clamp(22px,3.4vw,32px)", fontWeight: 800, margin: "12px 0 4px", color: "#0e1a24" }}>NEXO · Dashboard executivo</h1>
              <p style={{ margin: 0, color: "#5b6b78", fontSize: 15 }}>Visão consolidada da maturidade de gestão por área.</p>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {soSetor && dados.setores[0] ? (
            // Líder: acesso direto à área dele, sem as visões da empresa toda.
            <Link href={`/setor/${dados.setores[0].id}`} style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#fff", background: "#0068a9", padding: "9px 14px", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,104,169,.25)" }}>▦ Minha área</Link>
          ) : (
            <>
              <Link href="/relatorio-executivo" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#fff", background: "#47ad4b", padding: "9px 14px", borderRadius: 8, boxShadow: "0 4px 12px rgba(71,173,75,.3)" }}>⭳ Relatório executivo</Link>
              <Link href="/organograma" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>🏛 Organograma</Link>
              <Link href="/setores" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#fff", background: "#0068a9", padding: "9px 14px", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,104,169,.25)" }}>▦ Setores</Link>
            </>
          )}
          <Link href="/ferramentas" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>🧰 Ferramentas</Link>
          {papel === "admin" && (
            <Link href="/usuarios" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>👥 Usuários</Link>
          )}
          <Link href="/sobre" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "#0068a9", border: "1px solid #cfe0ee", background: "#fff", padding: "8px 12px", borderRadius: 8 }}>ℹ️ O NEXO</Link>
          {usuarioNome && (
            <>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#46586a" }}>{usuarioNome}</span>
              <form action={logoutAction}><button type="submit" style={{ border: "1px solid #d9e2ea", background: "#fff", color: "#5b6b78", fontWeight: 700, fontSize: 12, padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>Sair</button></form>
            </>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gap: 16 }}>
        {/* "O que fazer hoje" — primeira coisa na home. Só na tela inicial e
            quando temos os ciclos (a governança traz o estado de cada um). */}
        {inicio && governanca && (
          <PainelHoje
            ciclos={governanca.ciclos.map((c) => ({
              setorId: c.setorId,
              setorNome: c.setorNome,
              estado: c.estado,
              diasRestantes: c.diasRestantes,
            }))}
            setores={dados.setores.map((s) => ({
              id: s.id,
              nome: s.nome,
              acoesAtrasadas: s.acoesAtrasadas,
            }))}
          />
        )}

        {/* Linha 1: os 4 indicadores lado a lado. auto-fit com largura mínima
            evita o buraco (4 cards não fechavam em 3 colunas) e quebra sozinho
            em telas estreitas. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
          <Card>
            <Titulo>{soSetor ? "Maturidade da área" : "Maturidade da empresa"}</Titulo>
            <div style={{ fontSize: 52, fontWeight: 800, color: "#0068a9", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{dados.mediaEmpresa}%</div>
            <span style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 800, color: "#fff", background: "#0068a9", padding: "3px 10px", borderRadius: 999 }}>{ROTULO_MATURIDADE[grauEmpresa]}</span>
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#8493a0" }}>{soSetor ? nomeArea : `Média de ${dados.setores.length} áreas avaliadas.`}</p>
          </Card>
          <Card>
            <Titulo>Radar dos 4 níveis</Titulo>
            <Radar valores={dados.radarEmpresa} />
          </Card>
          <Card>
            <Titulo>Pendências</Titulo>
            <div style={{ fontSize: 52, fontWeight: 800, color: dados.totalPendencias > 0 ? "#d98a00" : "#33853a", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{dados.totalPendencias}</div>
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#8493a0" }}>{soSetor ? "Critérios ainda não respondidos na sua área." : "Critérios ainda não respondidos em todas as áreas."}</p>
          </Card>
          <Card>
            <Titulo>Plano de ação</Titulo>
            <div style={{ display: "flex", gap: 24, alignItems: "baseline" }}>
              <div>
                <div style={{ fontSize: 52, fontWeight: 800, color: "#0068a9", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{dados.totalAcoesAbertas}</div>
                <div style={{ fontSize: 11.5, color: "#8493a0", marginTop: 4 }}>ações abertas</div>
              </div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 800, color: dados.totalAcoesAtrasadas > 0 ? "#c0392b" : "#33853a", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{dados.totalAcoesAtrasadas}</div>
                <div style={{ fontSize: 11.5, color: "#8493a0", marginTop: 4 }}>atrasadas</div>
              </div>
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#8493a0" }}>O que o diagnóstico virou — e o que está atrasado.</p>
          </Card>
        </div>

        {/* Governança: ciclos de avaliação + evolução histórica */}
        {governanca && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>
            <Card>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Titulo>Ciclos de avaliação</Titulo>
                <Link href="/configuracoes" style={{ marginLeft: "auto", marginBottom: 12, fontSize: 12, fontWeight: 700, color: "#0068a9", textDecoration: "none" }}>⚙ parâmetros ›</Link>
              </div>
              {atrasadas.length === 0 && emAlerta.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "#33853a", fontWeight: 700 }}>✓ Todas as áreas em dia com a análise NEXO.</p>
              ) : (
                <div style={{ display: "grid", gap: 6 }}>
                  {[...atrasadas, ...emAlerta].map((c) => (
                    <Link key={c.setorId} href={`/setor/${c.setorId}/avaliar`}
                      style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, background: c.estado === "atrasada" ? "#fdecea" : "#fdf3e0", borderRadius: 8, padding: "8px 10px" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#0e1a24" }}>{c.setorNome}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 800, color: c.estado === "atrasada" ? "#c0392b" : "#8a5a08", whiteSpace: "nowrap" }}>
                        {c.estado === "atrasada" ? `${ROTULO_ESTADO.atrasada} há ${-c.diasRestantes}d` : `vence em ${c.diasRestantes}d`}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "#8493a0" }}>
                Ritmo definido pela direção: reavaliação a cada <b>{governanca.politica.periodicidadeDias} dias</b> · meta padrão <b>{governanca.politica.metaPadrao}%</b>.
              </p>
            </Card>
            <Card>
              <Titulo>Evolução da maturidade</Titulo>
              <EvolucaoChart historico={governanca.historico} mediaAtual={dados.mediaEmpresa} />
            </Card>
          </div>
        )}

        {/* Heatmap setores × níveis */}
        <Card>
          <Titulo>Maturidade por setor e nível</Titulo>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4, minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: 12, color: "#8493a0", fontWeight: 700, padding: "4px 8px" }}>Setor</th>
                  {NIVEIS.map((n) => (
                    <th key={n.id} style={{ fontSize: 11.5, color: "#8493a0", fontWeight: 700, padding: "4px 8px", textAlign: "center" }}>{n.titulo}</th>
                  ))}
                  <th style={{ fontSize: 11.5, color: "#46586a", fontWeight: 800, padding: "4px 8px", textAlign: "center" }}>Geral</th>
                </tr>
              </thead>
              <tbody>
                {dados.setores.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontSize: 13.5, fontWeight: 700, color: "#0e1a24", padding: "6px 8px", whiteSpace: "nowrap" }}>
                      <Link href={`/setor/${s.id}`} style={{ color: "inherit", textDecoration: "none" }}>{s.nome}</Link>
                    </td>
                    {NIVEIS.map((n) => {
                      const v = Math.round(s.porNivel[n.id]);
                      const c = corCelula(v);
                      return (
                        <td key={n.id} style={{ textAlign: "center", background: c.bg, color: c.fg, fontWeight: 800, fontSize: 13, borderRadius: 8, padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{v}</td>
                      );
                    })}
                    {(() => { const c = corCelula(Math.round(s.geral)); const t = cicloDe(s.id)?.tendencia; return (
                      <td style={{ textAlign: "center", background: c.bg, color: c.fg, fontWeight: 800, fontSize: 13.5, borderRadius: 8, padding: "10px 8px", fontVariantNumeric: "tabular-nums", border: "2px solid #fff", outline: "1px solid #e3ebf1", whiteSpace: "nowrap" }}>
                        {Math.round(s.geral)}
                        {t != null && t !== 0 && (
                          <span title={`${t > 0 ? "+" : ""}${t} pontos vs. último ciclo`} style={{ fontSize: 10, marginLeft: 4, color: t > 0 ? "#1f5b28" : "#8a2a22" }}>
                            {t > 0 ? "▲" : "▼"}
                          </span>
                        )}
                      </td>
                    ); })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "#8493a0" }}>Clique num setor para abrir a avaliação. Cores: vermelho (inicial) → verde (referência).</p>
        </Card>

        {/* Ferramentas de gestão (hub NEXO) */}
        {ferramentas && (
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Titulo>Ferramentas de gestão</Titulo>
              <Link href="/ferramentas" style={{ marginLeft: "auto", marginBottom: 12, fontSize: 12, fontWeight: 700, color: "#0068a9", textDecoration: "none" }}>abrir hub ›</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <Link href="/ferramentas/5w2h" style={{ textDecoration: "none", background: "#f4f8fb", borderRadius: 10, padding: "12px 14px", display: "block" }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#8493a0" }}>🗂️ Planos 5W2H</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#0068a9", fontVariantNumeric: "tabular-nums" }}>{ferramentas.planos5w2h}</div>
                <div style={{ fontSize: 12, color: "#5b6b78" }}>
                  {ferramentas.acoes5w2h > 0
                    ? `${ferramentas.acoesConcluidas} de ${ferramentas.acoes5w2h} ações concluídas (${Math.round((ferramentas.acoesConcluidas / ferramentas.acoes5w2h) * 100)}%)`
                    : "Nenhuma ação cadastrada"}
                </div>
              </Link>
              <Link href="/ferramentas/ishikawa" style={{ textDecoration: "none", background: "#f4f8fb", borderRadius: 10, padding: "12px 14px", display: "block" }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#8493a0" }}>🐟 Análises Ishikawa</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#0068a9", fontVariantNumeric: "tabular-nums" }}>{ferramentas.analisesIshikawa}</div>
                <div style={{ fontSize: 12, color: "#5b6b78" }}>{ferramentas.causasIshikawa} causa{ferramentas.causasIshikawa === 1 ? "" : "s"} mapeada{ferramentas.causasIshikawa === 1 ? "" : "s"}</div>
              </Link>
              <Link href="/ferramentas/bcg" style={{ textDecoration: "none", background: "#f4f8fb", borderRadius: 10, padding: "12px 14px", display: "block" }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#8493a0" }}>🎯 Matriz BCG</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#0068a9", fontVariantNumeric: "tabular-nums" }}>{ferramentas.itensBcg}</div>
                <div style={{ fontSize: 12, color: "#5b6b78" }}>
                  {ferramentas.itensBcg > 0
                    ? (Object.entries(ferramentas.porQuadrante) as [Quadrante, number][])
                        .filter(([, n]) => n > 0)
                        .map(([q, n]) => `${n} ${ROTULO_QUADRANTE[q]}`)
                        .join(" · ") || "itens ainda sem posição"
                    : "Portfólio vazio"}
                </div>
              </Link>
            </div>
          </Card>
        )}

        {/* Ranking / comparação — só faz sentido com várias áreas (admin/direção). */}
        {!soSetor && (
        <Card>
          <Titulo>Comparação de áreas</Titulo>
          <div style={{ display: "grid", gap: 8 }}>
            {dados.setores.map((s, i) => {
              const c = corCelula(Math.round(s.geral));
              const ciclo = cicloDe(s.id);
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 20, fontSize: 13, fontWeight: 800, color: "#8493a0", textAlign: "right" }}>{i + 1}</span>
                  <span style={{ width: 110, fontSize: 13.5, fontWeight: 700, color: "#0e1a24" }}>{s.nome}</span>
                  <div style={{ flex: 1, height: 14, background: "#eef4f9", borderRadius: 999, overflow: "hidden", position: "relative" }}>
                    <div style={{ width: `${s.geral}%`, height: "100%", background: c.fg, transition: "width .4s" }} />
                    {/* marcador da meta do setor */}
                    {ciclo && (
                      <div title={`Meta: ${ciclo.meta}%`}
                        style={{ position: "absolute", top: -2, bottom: -2, left: `${ciclo.meta}%`, width: 2.5, background: "#0e1a24", opacity: 0.55, borderRadius: 2 }} />
                    )}
                  </div>
                  <span style={{ width: 42, fontSize: 13, fontWeight: 800, color: c.fg, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Math.round(s.geral)}%</span>
                  {ciclo && (
                    <span style={{ width: 64, fontSize: 11, fontWeight: 800, textAlign: "right", fontVariantNumeric: "tabular-nums", color: s.geral >= ciclo.meta ? "#33853a" : "#8493a0" }}>
                      meta {ciclo.meta}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {governanca && (
            <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "#8493a0" }}>O traço escuro na barra indica a meta de maturidade da área (definida em Parâmetros).</p>
          )}
        </Card>
        )}

        {/* Comparativo par-a-par entre dois setores */}
        {dados.setores.length >= 2 && (
          <Card>
            <Titulo>Comparar duas áreas</Titulo>
            <CompararSetores setores={dados.setores} />
          </Card>
        )}

        {/* Estrutura da empresa: organogramas consolidados */}
        {organograma && organograma.length > 0 && (() => {
          const mapeadas = organograma.filter((s) => s.pessoas.length > 0);
          const pendentes = organograma.filter((s) => s.pessoas.length === 0);
          const totalPessoas = organograma.reduce((t, s) => t + s.pessoas.length, 0);
          return (
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Titulo>Estrutura da empresa (organograma)</Titulo>
                <Link href="/organograma" style={{ marginLeft: "auto", marginBottom: 12, fontSize: 12, fontWeight: 700, color: "#0068a9", textDecoration: "none" }}>
                  ver organograma geral ›
                </Link>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 14 }}>
                <div style={{ background: "#f4f8fb", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#8493a0" }}>Áreas mapeadas</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#0068a9", fontVariantNumeric: "tabular-nums" }}>
                    {mapeadas.length}<span style={{ fontSize: 15, color: "#8493a0" }}> / {organograma.length}</span>
                  </div>
                </div>
                <div style={{ background: "#f4f8fb", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#8493a0" }}>Pessoas</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#47ad4b", fontVariantNumeric: "tabular-nums" }}>{totalPessoas}</div>
                </div>
                <div style={{ background: "#f4f8fb", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#8493a0" }}>Áreas pendentes</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: pendentes.length ? "#c0392b" : "#33853a", fontVariantNumeric: "tabular-nums" }}>{pendentes.length}</div>
                </div>
              </div>

              {pendentes.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#8493a0" }}>Faltam montar:</span>
                  {pendentes.map((s) => (
                    <Link
                      key={s.setorId}
                      href={`/setor/${s.setorId}/organograma`}
                      style={{ textDecoration: "none", fontSize: 12, fontWeight: 700, color: "#8a5a08", background: "#fdf3e0", border: "1px solid #f0dcb4", borderRadius: 999, padding: "4px 11px" }}
                    >
                      {s.setorNome} ›
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          );
        })()}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "#fff", border: "1px solid #e3ebf1", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(14,26,36,.06)" }}>{children}</div>;
}
function Titulo({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#8493a0", marginBottom: 12 }}>{children}</div>;
}
