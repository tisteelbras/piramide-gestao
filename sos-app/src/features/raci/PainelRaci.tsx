"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { cor } from "@/design/tokens";
import { definirPapel } from "./actions";
import {
  PAPEIS_RACI,
  PAPEL_POR_ID,
  validarRaci,
  type MatrizRaci,
  type PapelRaci,
} from "./tipos";

// Matriz de Responsabilidade (RACI): atividades nas linhas (os processos do
// setor), pessoas nas colunas (o organograma). Clicar numa célula cicla
// entre os papéis: — → R → A → C → I → —.
//
// Resolve o pilar "Responsabilidades" da Governança Operacional, e aponta
// as lacunas: atividade sem aprovador, com vários aprovadores, ou sem
// ninguém executando.

const CICLO: (PapelRaci | null)[] = ["responsavel", "aprovador", "consultado", "informado", null];

function proximoPapel(atual: PapelRaci | null): PapelRaci | null {
  const i = CICLO.indexOf(atual);
  return CICLO[(i + 1) % CICLO.length];
}

export default function PainelRaci({
  setorId,
  setorNome,
  matriz,
}: {
  setorId: string;
  setorNome: string;
  matriz: MatrizRaci;
}) {
  const [rodando, start] = useTransition();
  const [otimista, setOtimista] = useState<Record<string, PapelRaci | null>>({});

  const chave = (p: string, c: string) => `${p}|${c}`;

  // Estado efetivo: o do banco, sobreposto pelas mudanças otimistas.
  const papelDe = (processoId: string, colaboradorId: string): PapelRaci | null => {
    const k = chave(processoId, colaboradorId);
    if (k in otimista) return otimista[k];
    return (
      matriz.atribuicoes.find(
        (a) => a.processoId === processoId && a.colaboradorId === colaboradorId,
      )?.papel ?? null
    );
  };

  // Revalida com o estado efetivo (inclui as mudanças otimistas).
  const problemas = useMemo(() => {
    const atribuicoes = matriz.atividades.flatMap((at) =>
      matriz.pessoas
        .map((p) => ({ processoId: at.id, colaboradorId: p.id, papel: papelDe(at.id, p.id) }))
        .filter((a): a is { processoId: string; colaboradorId: string; papel: PapelRaci } => a.papel !== null),
    );
    return validarRaci({ ...matriz, atribuicoes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matriz, otimista]);

  function clicarCelula(processoId: string, colaboradorId: string) {
    const atual = papelDe(processoId, colaboradorId);
    const novo = proximoPapel(atual);
    setOtimista((o) => ({ ...o, [chave(processoId, colaboradorId)]: novo }));
    start(async () => {
      await definirPapel({ setorId, processoId, colaboradorId, papel: novo });
    });
  }

  // ——— Casos vazios: a matriz depende de processos e de pessoas ———
  if (matriz.pessoas.length === 0 || matriz.atividades.length === 0) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: cor.muted, lineHeight: 1.6 }}>
          A matriz cruza <b>as atividades do setor</b> (os processos cadastrados) com <b>as pessoas</b> (o organograma).
          Para montá-la, é preciso ter os dois.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {matriz.pessoas.length === 0 && (
            <Link href={`/setor/${setorId}/organograma`} style={atalho}>
              🏛 Cadastrar pessoas no organograma ›
            </Link>
          )}
          {matriz.atividades.length === 0 && (
            <Link href={`/setor/${setorId}/avaliar#processos`} style={atalho}>
              ⚙ Cadastrar processos ›
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Legenda */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        {PAPEIS_RACI.map((p) => (
          <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: p.cor,
                color: "#fff",
                fontSize: 11,
                fontWeight: 800,
                display: "grid",
                placeItems: "center",
              }}
            >
              {p.sigla}
            </span>
            <span style={{ fontSize: 12.5, color: cor.muted }}>
              <b style={{ color: cor.ink }}>{p.label}</b> — {p.descricao}
            </span>
          </span>
        ))}
      </div>

      {/* Lacunas de governança */}
      {problemas.length > 0 && (
        <div style={{ background: cor.warnBg, border: "1px solid #f0dcb4", borderRadius: 12, padding: "12px 15px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: cor.warnFg, marginBottom: 6 }}>
            {problemas.length} lacuna{problemas.length === 1 ? "" : "s"} de responsabilidade
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 3 }}>
            {problemas.map((p, i) => (
              <li key={i} style={{ fontSize: 12.5, color: cor.warnFg }}>
                <b>{p.atividade}</b>: {p.texto}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* A matriz */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 3, minWidth: "100%" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  fontSize: 12,
                  fontWeight: 800,
                  color: cor.faint,
                  padding: "6px 10px",
                  position: "sticky",
                  left: 0,
                  background: cor.surface,
                  minWidth: 190,
                }}
              >
                Atividade \ Pessoa
              </th>
              {matriz.pessoas.map((p) => (
                <th
                  key={p.id}
                  title={p.cargo ?? undefined}
                  style={{ fontSize: 11.5, fontWeight: 800, color: cor.ink, padding: "6px 8px", minWidth: 78, verticalAlign: "bottom" }}
                >
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 92 }}>
                    {p.nome.split(/\s+/)[0]}
                  </div>
                  {p.cargo && (
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: cor.faint2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 92 }}>
                      {p.cargo}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matriz.atividades.map((at) => {
              const temProblema = problemas.some((p) => p.processoId === at.id);
              return (
                <tr key={at.id}>
                  <td
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: cor.ink,
                      padding: "8px 10px",
                      position: "sticky",
                      left: 0,
                      background: cor.surface,
                      borderLeft: `4px solid ${temProblema ? cor.warn : "transparent"}`,
                      borderRadius: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {at.nome}
                  </td>
                  {matriz.pessoas.map((p) => {
                    const papel = papelDe(at.id, p.id);
                    const meta = papel ? PAPEL_POR_ID.get(papel)! : null;
                    return (
                      <td key={p.id} style={{ padding: 0 }}>
                        <button
                          onClick={() => clicarCelula(at.id, p.id)}
                          disabled={rodando}
                          aria-label={`${p.nome} em ${at.nome}: ${meta?.label ?? "sem papel"}`}
                          title={meta ? `${meta.label} — clique para trocar` : "clique para atribuir"}
                          style={{
                            width: "100%",
                            height: 40,
                            border: `1px solid ${meta ? "transparent" : cor.hairline}`,
                            borderRadius: 8,
                            background: meta ? meta.cor : cor.surfaceSunk,
                            color: meta ? "#fff" : cor.faint2,
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: rodando ? "default" : "pointer",
                            transition: "background .15s",
                          }}
                        >
                          {meta?.sigla ?? "·"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ margin: "14px 0 0", fontSize: 12, color: cor.faint }}>
        Clique numa célula para percorrer os papéis: <b>R → A → C → I → vazio</b>. As atividades são os processos de {setorNome};
        as pessoas vêm do organograma.
      </p>
    </div>
  );
}

const atalho: React.CSSProperties = {
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 700,
  color: cor.brand,
  border: "1px solid #cfe0ee",
  background: cor.surface,
  padding: "9px 14px",
  borderRadius: 10,
};
