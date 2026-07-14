"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { cor } from "@/design/tokens";
import { addPessoa, atualizarPessoa, removerPessoa, gerarEAnexarPdf } from "./actions";
import ArvoreVisual from "./ArvoreVisual";
import { montarArvore, type NoOrganograma, type PessoaOrganograma } from "./tipos";

// Organograma do setor: cadastra pessoas (nome + função), define a quem
// cada uma responde e gera o PDF, que é anexado à etapa "Estrutura
// Organizacional" da Visão. As mesmas pessoas alimentam o Recurso Humano.
export default function PainelOrganograma({
  setorId,
  setorNome,
  pessoas,
}: {
  setorId: string;
  setorNome: string;
  pessoas: PessoaOrganograma[];
}) {
  const [rodando, start] = useTransition();
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [chefe, setChefe] = useState("");
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const arvore = useMemo(() => montarArvore(pessoas), [pessoas]);

  function adicionar() {
    if (!nome.trim()) return;
    start(async () => {
      const r = await addPessoa({ setorId, nome, cargo, gestorId: chefe || null });
      if (r.ok) {
        setNome("");
        setCargo("");
        setAviso(null);
      } else {
        setAviso({ tipo: "erro", texto: r.erro ?? "Não foi possível adicionar." });
      }
    });
  }

  function trocarChefe(id: string, gestorId: string) {
    start(async () => {
      const r = await atualizarPessoa({ setorId, id, gestorId: gestorId || null });
      if (!r.ok) setAviso({ tipo: "erro", texto: r.erro ?? "Não foi possível atualizar." });
      else setAviso(null);
    });
  }

  function excluir(id: string, nomePessoa: string) {
    if (!confirm(`Remover ${nomePessoa} do organograma? Ela também sai do Recurso Humano do setor.`)) return;
    start(async () => {
      await removerPessoa(setorId, id);
    });
  }

  function gerarPdf() {
    start(async () => {
      const r = await gerarEAnexarPdf(setorId);
      if (r.ok) {
        setAviso({
          tipo: "ok",
          texto: `PDF gerado e anexado à etapa "${r.etapaTitulo}" da Visão.`,
        });
      } else {
        setAviso({ tipo: "erro", texto: r.erro ?? "Falha ao gerar o PDF." });
      }
    });
  }

  return (
    <div>
      {/* ——— Cadastro de pessoa ——— */}
      <div style={{ background: cor.surfaceSunk, borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }}
            placeholder="Nome da pessoa"
            style={{ flex: "2 1 200px", border: `1px solid ${cor.hairline}`, borderRadius: 9, padding: "9px 12px", fontSize: 14, color: cor.ink, background: cor.surface }}
          />
          <input
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }}
            placeholder="Função (ex.: Analista de Compras)"
            style={{ flex: "2 1 200px", border: `1px solid ${cor.hairline}`, borderRadius: 9, padding: "9px 12px", fontSize: 14, color: cor.ink, background: cor.surface }}
          />
          <select
            value={chefe}
            onChange={(e) => setChefe(e.target.value)}
            style={{ flex: "1 1 160px", border: `1px solid ${cor.hairline}`, borderRadius: 9, padding: "9px 12px", fontSize: 13.5, color: cor.ink, background: cor.surface }}
          >
            <option value="">Responde a: — (topo)</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>Responde a: {p.nome}</option>
            ))}
          </select>
          <button
            onClick={adicionar}
            disabled={rodando || !nome.trim()}
            style={{ border: "none", background: cor.brand, color: "#fff", fontWeight: 700, fontSize: 13.5, padding: "10px 18px", borderRadius: 9, cursor: rodando || !nome.trim() ? "default" : "pointer", opacity: rodando || !nome.trim() ? 0.6 : 1 }}
          >
            + Adicionar
          </button>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12, color: cor.faint }}>
          Quem entra aqui vira automaticamente colaborador do Recurso <b>Humano</b> deste setor, pronto para ser avaliado.
        </p>
      </div>

      {/* ——— Aviso ——— */}
      {aviso && (
        <div
          style={{
            background: aviso.tipo === "ok" ? cor.successBg : cor.dangerBg,
            color: aviso.tipo === "ok" ? cor.greenDark : cor.danger,
            border: `1px solid ${aviso.tipo === "ok" ? "#cfe8d2" : "#f5c6c0"}`,
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {aviso.tipo === "ok" ? "✓ " : "⚠ "}
          {aviso.texto}
        </div>
      )}

      {/* ——— Árvore ——— */}
      {pessoas.length === 0 ? (
        <p style={{ fontSize: 13.5, color: cor.faint, margin: "0 0 18px" }}>
          Nenhuma pessoa cadastrada ainda. Comece pelo líder da área (deixe “Responde a” como topo) e depois adicione a equipe.
        </p>
      ) : (
        <>
          {/* Organograma visual: caixas conectadas por níveis. */}
          <div style={{ background: cor.appBg, border: `1px solid ${cor.hairline}`, borderRadius: 14, padding: "20px 16px", marginBottom: 18 }}>
            <ArvoreVisual pessoas={pessoas} />
          </div>

          {/* Lista de edição: definir a quem cada um responde. */}
          <details open style={{ marginBottom: 20 }}>
            <summary style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 800, color: cor.muted, marginBottom: 10, listStyle: "revert" }}>
              Editar pessoas e hierarquia
            </summary>
            <div style={{ display: "grid", gap: 6 }}>
              {arvore.map((no) => (
                <LinhaPessoa
                  key={no.id}
                  no={no}
                  nivel={0}
                  pessoas={pessoas}
                  rodando={rodando}
                  onTrocarChefe={trocarChefe}
                  onExcluir={excluir}
                />
              ))}
            </div>
          </details>
        </>
      )}

      {/* ——— Ações ——— */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", borderTop: `1px solid ${cor.hairline}`, paddingTop: 16 }}>
        <button
          onClick={gerarPdf}
          disabled={rodando || pessoas.length === 0}
          style={{ border: "none", background: cor.brand, color: "#fff", fontWeight: 700, fontSize: 13.5, padding: "11px 18px", borderRadius: 10, cursor: rodando || pessoas.length === 0 ? "default" : "pointer", opacity: rodando || pessoas.length === 0 ? 0.55 : 1, boxShadow: `0 4px 12px ${cor.brand}40` }}
        >
          {rodando ? "Gerando…" : "⭳ Gerar PDF e anexar à Visão"}
        </button>
        <Link
          href={`/setor/${setorId}/avaliar#visao`}
          style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: cor.brand, border: `1px solid #cfe0ee`, background: cor.surface, padding: "10px 14px", borderRadius: 10 }}
        >
          Ver na etapa da Visão ›
        </Link>
        <span style={{ fontSize: 12, color: cor.faint, marginLeft: "auto" }}>
          {pessoas.length} pessoa{pessoas.length === 1 ? "" : "s"} em {setorNome}
        </span>
      </div>
    </div>
  );
}

// ————— Uma linha da árvore (recursiva) —————
function LinhaPessoa({
  no,
  nivel,
  pessoas,
  rodando,
  onTrocarChefe,
  onExcluir,
}: {
  no: NoOrganograma;
  nivel: number;
  pessoas: PessoaOrganograma[];
  rodando: boolean;
  onTrocarChefe: (id: string, gestorId: string) => void;
  onExcluir: (id: string, nome: string) => void;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginLeft: nivel * 26,
          background: cor.surface,
          border: `1px solid #e6edf3`,
          borderLeft: `4px solid ${nivel === 0 ? cor.brand : cor.green}`,
          borderRadius: 10,
          padding: "10px 12px",
        }}
      >
        <div style={{ flex: "1 1 180px", minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: cor.ink }}>{no.nome}</div>
          <div style={{ fontSize: 12.5, color: no.cargo ? cor.muted : cor.faint2 }}>
            {no.cargo || "sem função definida"}
          </div>
        </div>

        <select
          value={no.gestorId ?? ""}
          disabled={rodando}
          onChange={(e) => onTrocarChefe(no.id, e.target.value)}
          style={{ border: `1px solid ${cor.hairline}`, borderRadius: 8, padding: "6px 8px", fontSize: 12.5, color: cor.muted, background: cor.surface, maxWidth: 190 }}
        >
          <option value="">— topo do setor</option>
          {pessoas
            .filter((p) => p.id !== no.id)
            .map((p) => (
              <option key={p.id} value={p.id}>responde a {p.nome}</option>
            ))}
        </select>

        <button
          onClick={() => onExcluir(no.id, no.nome)}
          disabled={rodando}
          aria-label={`Remover ${no.nome}`}
          style={{ border: "none", background: "transparent", color: cor.faint2, cursor: "pointer", fontSize: 17, lineHeight: 1, padding: "0 4px" }}
        >
          ×
        </button>
      </div>

      {no.subordinados.map((filho) => (
        <LinhaPessoa
          key={filho.id}
          no={filho}
          nivel={nivel + 1}
          pessoas={pessoas}
          rodando={rodando}
          onTrocarChefe={onTrocarChefe}
          onExcluir={onExcluir}
        />
      ))}
    </>
  );
}
