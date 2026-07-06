"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  BRAND,
  DEFAULT_SECTORS,
  LEVELS,
  uid,
  type ChecklistsState,
  type Sector,
  type SectorChecklistData,
} from "@/lib/sos-data";
import Pyramid from "./Pyramid";
import SectorWheel from "./SectorWheel";
import SectorChecklist from "./SectorChecklist";

const { blue: BLUE, green: GREEN, blueDark: BLUE_D, greenDark: GREEN_D } = BRAND;

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

// ————————————————————— Storage (Etapa 0: localStorage) —————————————————————
const STORAGE_KEY = "steelbras:planner:v1";
type PersistedState = { sectors: Sector[]; checklists: ChecklistsState };

function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    /* primeira execução — sem dados ainda */
  }
  return null;
}
function saveState(state: PersistedState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("save failed", e);
  }
}

export default function Sos() {
  const [open, setOpen] = useState<number | null>(null);
  const [sectors, setSectors] = useState<Sector[]>(() =>
    DEFAULT_SECTORS.map((name) => ({ id: uid(), name })),
  );
  const [checklists, setChecklists] = useState<ChecklistsState>({});
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  // Carrega uma vez
  useEffect(() => {
    const s = loadState();
    if (s) {
      if (Array.isArray(s.sectors) && s.sectors.length) setSectors(s.sectors);
      if (s.checklists) setChecklists(s.checklists);
    }
    setLoaded(true);
  }, []);

  // Autosave (debounced) após o load
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      saveState({ sectors, checklists });
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    }, 500);
    return () => clearTimeout(t);
  }, [sectors, checklists, loaded]);

  const addSector = useCallback(
    (name: string) => setSectors((s) => [...s, { id: uid(), name }]),
    [],
  );
  const renameSector = useCallback(
    (id: string, name: string) => setSectors((s) => s.map((x) => (x.id === id ? { ...x, name } : x))),
    [],
  );
  const removeSector = useCallback(
    (id: string) => {
      setSectors((s) => s.filter((x) => x.id !== id));
      setChecklists((c) => {
        const n = { ...c };
        delete n[id];
        return n;
      });
      setActiveSector((cur) => (cur === id ? null : cur));
    },
    [],
  );
  const setSectorData = useCallback(
    (id: string, data: SectorChecklistData) => setChecklists((c) => ({ ...c, [id]: data })),
    [],
  );

  const activeLevel = open != null ? LEVELS[open] : null;
  const sectorObj = sectors.find((s) => s.id === activeSector);

  if (!loaded)
    return <div style={{ padding: 40, textAlign: "center", color: "#8493a0" }}>Carregando planner…</div>;

  return (
    <div style={{ minHeight: "100vh", color: BRAND.ink, padding: "clamp(16px,4vw,48px)" }}>
      <header style={{ maxWidth: 1160, margin: "0 auto 24px", display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image src="/steelbras-logo.svg" alt="Steelbras" width={128} height={47} style={{ height: 42, width: "auto", display: "block" }} priority />
          </div>
          <h1 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, margin: "10px 0 4px", lineHeight: 1.05 }}>
            SOS — Sistema de Operação Steelbras
          </h1>
          <p style={{ margin: 0, color: "#5b6b78", fontSize: "clamp(14px,1.6vw,16px)", maxWidth: 620 }}>
            Ferramenta para todos os níveis de gestão
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: saved ? GREEN_D : "#a2afba", fontWeight: 700, transition: "color .2s" }}>
            {saved ? "✓ Salvo" : "salvamento automático"}
          </span>
          <button
            onClick={() => setLocked((l) => !l)}
            style={{ ...btn(locked ? GREEN : BLUE), padding: "10px 18px", boxShadow: "0 4px 14px rgba(0,104,169,.25)" }}
          >
            {locked ? "✎ Editar" : "▷ Apresentar"}
          </button>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(300px,1fr) minmax(340px,1.15fr)",
          gap: "clamp(20px,3vw,44px)",
          alignItems: "center",
        }}
      >
        {/* Pirâmide */}
        <Pyramid
          open={open}
          onSelect={(i) => {
            setOpen(i);
            setActiveSector(null);
          }}
        />

        {/* Detalhe */}
        <div>
          {!activeLevel && (
            <div
              style={{
                border: "2px dashed #c3d3df",
                borderRadius: 20,
                padding: "40px 28px",
                textAlign: "center",
                color: "#7c8b98",
                background: "rgba(255,255,255,.5)",
              }}
            >
              <div style={{ fontSize: 34, marginBottom: 8 }}>▲</div>
              Selecione um nível da pirâmide para começar.
            </div>
          )}

          {activeLevel && !activeLevel.sectors && (
            <div
              key={activeLevel.id}
              style={{
                background: "#fff",
                borderRadius: 22,
                padding: "clamp(20px,3vw,32px)",
                boxShadow: "0 24px 60px rgba(14,26,36,.14)",
                borderTop: `6px solid ${activeLevel.color}`,
                animation: "rise .4s ease both",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span style={{ background: activeLevel.color, color: "#fff", fontWeight: 800, fontSize: 14, padding: "5px 12px", borderRadius: 999 }}>
                  {activeLevel.n}
                </span>
                <h2 style={{ margin: 0, fontSize: "clamp(22px,3vw,30px)", fontWeight: 800 }}>{activeLevel.title}</h2>
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: activeLevel.dark, textTransform: "uppercase", letterSpacing: 1 }}>
                  {activeLevel.tag}
                </span>
              </div>
              <p style={{ margin: "0 0 18px", color: "#5b6b78", fontSize: 15, lineHeight: 1.5 }}>{activeLevel.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {activeLevel.items.map((it, k) => (
                  <li
                    key={k}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      fontSize: 14.5,
                      lineHeight: 1.45,
                      padding: "9px 12px",
                      background: "#f4f8fb",
                      borderRadius: 10,
                      borderLeft: `3px solid ${activeLevel.color}`,
                    }}
                  >
                    <span style={{ color: activeLevel.color, fontWeight: 800 }}>›</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeLevel && activeLevel.sectors && (
            <div
              key="op"
              style={{
                background: "#fff",
                borderRadius: 22,
                padding: "clamp(18px,3vw,28px)",
                boxShadow: "0 24px 60px rgba(14,26,36,.14)",
                borderTop: `6px solid ${activeLevel.color}`,
                animation: "rise .4s ease both",
              }}
            >
              {!sectorObj ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <span style={{ background: activeLevel.color, color: "#fff", fontWeight: 800, fontSize: 14, padding: "5px 12px", borderRadius: 999 }}>
                      {activeLevel.n}
                    </span>
                    <h2 style={{ margin: 0, fontSize: "clamp(22px,3vw,28px)", fontWeight: 800 }}>{activeLevel.title}</h2>
                    <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: activeLevel.dark, textTransform: "uppercase", letterSpacing: 1 }}>
                      {activeLevel.tag}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 16px", color: "#5b6b78", fontSize: 15, lineHeight: 1.5 }}>{activeLevel.desc}</p>
                  <SectorWheel
                    sectors={sectors}
                    locked={locked}
                    onPick={setActiveSector}
                    onAdd={addSector}
                    onRename={renameSector}
                    onRemove={removeSector}
                  />
                </>
              ) : (
                <SectorChecklist
                  sector={sectorObj}
                  locked={locked}
                  data={checklists[sectorObj.id] || {}}
                  onChange={(d) => setSectorData(sectorObj.id, d)}
                  onBack={() => setActiveSector(null)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <footer style={{ maxWidth: 1160, margin: "clamp(28px,5vw,52px) auto 0", paddingTop: 20, borderTop: "1px solid #d7e0e8", textAlign: "center" }}>
        <p style={{ margin: 0, color: "#5b6b78", fontSize: 14, fontWeight: 600 }}>
          Em <strong style={{ color: BLUE_D }}>Processos</strong>, cada setor tem o mesmo checklist de 6 etapas.
        </p>
      </footer>
    </div>
  );
}
