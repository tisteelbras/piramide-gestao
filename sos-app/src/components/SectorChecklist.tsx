"use client";

import { useState } from "react";
import {
  BRAND,
  STAGES,
  uid,
  type Sector,
  type SectorChecklistData,
  type Task,
} from "@/lib/sos-data";

const { blue: BLUE, green: GREEN, blueDark: BLUE_D, greenDark: GREEN_D, ink: INK } = BRAND;

const btn = (c: string): React.CSSProperties => ({
  border: "none",
  background: c,
  color: "#fff",
  fontWeight: 700,
  fontSize: 12.5,
  padding: "8px 14px",
  borderRadius: 8,
  cursor: "pointer",
});

type Props = {
  sector: Sector;
  data: SectorChecklistData;
  locked: boolean;
  onChange: (data: SectorChecklistData) => void;
  onBack: () => void;
};

export default function SectorChecklist({ sector, data, locked, onChange, onBack }: Props) {
  const [openStage, setOpenStage] = useState<string | null>(STAGES[0].id);

  const stageData = (sid: string): Task[] => data[sid] || [];
  const addTask = (sid: string) => {
    onChange({ ...data, [sid]: [...stageData(sid), { id: uid(), title: "", who: "", done: false }] });
  };
  const updTask = (sid: string, tid: string, patch: Partial<Task>) => {
    onChange({ ...data, [sid]: stageData(sid).map((t) => (t.id === tid ? { ...t, ...patch } : t)) });
  };
  const delTask = (sid: string, tid: string) => {
    onChange({ ...data, [sid]: stageData(sid).filter((t) => t.id !== tid) });
  };

  const totalTasks = STAGES.reduce((a, s) => a + stageData(s.id).length, 0);
  const doneTasks = STAGES.reduce((a, s) => a + stageData(s.id).filter((t) => t.done).length, 0);

  return (
    <div style={{ animation: "rise .35s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ ...btn("#8493a0"), padding: "8px 12px" }}>
          ‹ Voltar à roda
        </button>
        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: BLUE_D }}>{sector.name}</h3>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12.5,
            fontWeight: 700,
            color: doneTasks === totalTasks && totalTasks > 0 ? GREEN_D : "#8493a0",
          }}
        >
          {doneTasks}/{totalTasks} concluídas
        </span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {STAGES.map((st, idx) => {
          const tasks = stageData(st.id);
          const isOpen = openStage === st.id;
          const done = tasks.filter((t) => t.done).length;
          const accent = idx % 2 === 0 ? GREEN : BLUE;
          const accentD = idx % 2 === 0 ? GREEN_D : BLUE_D;
          return (
            <div key={st.id} style={{ border: `1px solid #e3ebf1`, borderRadius: 14, overflow: "hidden", background: "#fff" }}>
              <button
                onClick={() => setOpenStage(isOpen ? null : st.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "13px 16px",
                  background: isOpen ? "#f4f8fb" : "#fff",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: accent,
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 13,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </span>
                <span>
                  <span style={{ display: "block", fontWeight: 800, fontSize: 15, color: INK }}>{st.label}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "#8493a0" }}>{st.hint}</span>
                </span>
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                  {tasks.length > 0 && (
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: done === tasks.length ? GREEN_D : "#8493a0",
                        background: "#f0f4f8",
                        padding: "3px 9px",
                        borderRadius: 999,
                      }}
                    >
                      {done}/{tasks.length}
                    </span>
                  )}
                  <span style={{ color: accentD, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s", fontWeight: 800 }}>
                    ›
                  </span>
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: "6px 16px 16px" }}>
                  {tasks.length === 0 && (
                    <p style={{ margin: "6px 0 12px", fontSize: 13, color: "#a2afba", fontStyle: "italic" }}>
                      {locked ? "Nenhum item." : "Nenhum item ainda. Adicione o primeiro abaixo."}
                    </p>
                  )}
                  <div style={{ display: "grid", gap: 7 }}>
                    {tasks.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          background: "#f7fafc",
                          borderRadius: 10,
                          padding: "8px 10px",
                          borderLeft: `3px solid ${accent}`,
                          animation: "pop .2s ease both",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={t.done}
                          disabled={locked}
                          onChange={(e) => updTask(st.id, t.id, { done: e.target.checked })}
                          style={{ width: 18, height: 18, accentColor: accent, cursor: locked ? "default" : "pointer", flexShrink: 0 }}
                        />
                        {locked ? (
                          <span
                            style={{
                              flex: 1,
                              fontSize: 14,
                              fontWeight: 600,
                              color: INK,
                              textDecoration: t.done ? "line-through" : "none",
                              opacity: t.done ? 0.55 : 1,
                            }}
                          >
                            {t.title || <em style={{ color: "#c0ccd6" }}>(sem título)</em>}
                          </span>
                        ) : (
                          <input
                            value={t.title}
                            placeholder="Descreva a ação..."
                            onChange={(e) => updTask(st.id, t.id, { title: e.target.value })}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              border: "none",
                              background: "transparent",
                              fontSize: 14,
                              fontWeight: 600,
                              color: INK,
                              textDecoration: t.done ? "line-through" : "none",
                            }}
                          />
                        )}
                        {locked ? (
                          t.who && (
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: accentD,
                                background: "#fff",
                                padding: "3px 9px",
                                borderRadius: 999,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {t.who}
                            </span>
                          )
                        ) : (
                          <input
                            value={t.who}
                            placeholder="Responsável"
                            onChange={(e) => updTask(st.id, t.id, { who: e.target.value })}
                            style={{
                              width: 110,
                              border: `1px solid #dce6ee`,
                              borderRadius: 8,
                              padding: "5px 8px",
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: accentD,
                              background: "#fff",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        {!locked && (
                          <button
                            onClick={() => delTask(st.id, t.id)}
                            aria-label="Remover item"
                            style={{ border: "none", background: "transparent", color: "#c0ccd6", fontSize: 18, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!locked && (
                    <button
                      onClick={() => addTask(st.id)}
                      style={{
                        marginTop: 10,
                        border: `1.5px dashed ${accent}`,
                        background: "transparent",
                        color: accentD,
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "8px 14px",
                        borderRadius: 10,
                        cursor: "pointer",
                      }}
                    >
                      + Adicionar item
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
