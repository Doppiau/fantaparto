"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { aggiornaToggleAction } from "@/app/dashboard/[eventId]/actions";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:      "#f8f4f5",
  white:   "#ffffff",
  border:  "#e8e4e1",
  primary: "#874e58",
  priL:    "#f4acb7",
  priXL:   "#ffd9de",
  onPri:   "#733d47",
  onSurf:  "#1b1c1a",
  onSurfV: "#6b5b5d",
  muted:   "#b0a0a2",
  amberBg: "#fef3c7",
  amberBrd:"#fde68a",
  amberTx: "#92400e",
} as const;

const QS = "var(--font-quicksand, sans-serif)";

// ── Definizione metriche con punteggio ─────────────────────────────────────────
const METRICHE = [
  { key: "sessoAttivo",     label: "Sesso",           emoji: "👶", punti: 30, desc: "Maschio o femmina"        },
  { key: "dataAttiva",      label: "Data di nascita", emoji: "📅", punti: 25, desc: "Giorno esatto del parto"  },
  { key: "pesoAttivo",      label: "Peso",            emoji: "⚖️", punti: 20, desc: "Grammi alla nascita"      },
  { key: "oraAttiva",       label: "Ora di nascita",  emoji: "🕐", punti: 15, desc: "Orario del parto"         },
  { key: "lunghezzaAttiva", label: "Lunghezza",       emoji: "📏", punti: 5,  desc: "Centimetri alla nascita"  },
  { key: "capelliAttivo",   label: "Capelli",         emoji: "💇", punti: 3,  desc: "Lisci, ricci o calvo/a"   },
  { key: "occhiAttivo",     label: "Colore occhi",    emoji: "👁️", punti: 2,  desc: "Chiari o scuri"           },
] as const;

type MetricKey = (typeof METRICHE)[number]["key"];
type ToggleMap  = Record<MetricKey, boolean>;

const MAX_PUNTI = METRICHE.reduce((s, m) => s + m.punti, 0); // 100

// ── Tipi ───────────────────────────────────────────────────────────────────────
export interface EventoConfig {
  id:                string;
  nomeBimbo:         string | null;
  dataPresuntaParto: Date;
  isPremium:         boolean;
  stato:             string;
  sessoAttivo:       boolean;
  dataAttiva:        boolean;
  pesoAttivo:        boolean;
  oraAttiva:         boolean;
  lunghezzaAttiva:   boolean;
  capelliAttivo:     boolean;
  occhiAttivo:       boolean;
}

function toToggleMap(ev: EventoConfig): ToggleMap {
  return {
    sessoAttivo:     ev.sessoAttivo,
    dataAttiva:      ev.dataAttiva,
    pesoAttivo:      ev.pesoAttivo,
    oraAttiva:       ev.oraAttiva,
    lunghezzaAttiva: ev.lunghezzaAttiva,
    capelliAttivo:   ev.capelliAttivo,
    occhiAttivo:     ev.occhiAttivo,
  };
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function MetrichePanel({ eventi, userIsPremium = false }: { eventi: EventoConfig[]; userIsPremium?: boolean }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  // un array di toggleMap, uno per evento, per conservare lo stato se si cambia tab
  const [allToggles, setAllToggles] = useState<ToggleMap[]>(() => eventi.map(toToggleMap));
  const [, startTransition]         = useTransition();

  const evento     = eventi[selectedIdx];
  const toggles    = allToggles[selectedIdx];
  const isConcluso = evento.stato === "CONCLUSO";
  const isPremium  = evento.isPremium || userIsPremium;

  const punteggiAttivi = METRICHE.reduce((s, m) => s + (toggles[m.key] ? m.punti : 0), 0);
  const barPct         = Math.round((punteggiAttivi / MAX_PUNTI) * 100);

  function flip(key: MetricKey) {
    if (isConcluso) return;
    const newVal = !toggles[key];
    setAllToggles((prev) => {
      const copy = [...prev];
      copy[selectedIdx] = { ...copy[selectedIdx], [key]: newVal };
      return copy;
    });
    startTransition(() => { aggiornaToggleAction(evento.id, key, newVal); });
  }

  function selectEvent(idx: number) {
    setSelectedIdx(idx);
  }

  const STATO_BADGE: Record<string, { label: string; bg: string; color: string }> = {
    IN_CORSO:           { label: "In corso",       bg: "#f0fdf4", color: "#166534" },
    PRONTO_RIVELAZIONE: { label: "In rivelazione", bg: C.amberBg, color: C.amberTx },
    CONCLUSO:           { label: "Concluso",        bg: C.priXL,  color: C.onPri   },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Tabs evento (solo se >1) ─────────────────────────────────────── */}
      {eventi.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {eventi.map((ev, idx) => {
            const isSelected = idx === selectedIdx;
            const nome       = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a";
            const badge      = STATO_BADGE[ev.stato] ?? STATO_BADGE.IN_CORSO;
            return (
              <button
                key={ev.id}
                onClick={() => selectEvent(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 12, cursor: "pointer",
                  border: `2px solid ${isSelected ? C.primary : C.border}`,
                  background: isSelected ? C.priXL : C.white,
                  color: isSelected ? C.primary : C.onSurf,
                  fontSize: 13, fontWeight: 700,
                  transition: "all 150ms",
                }}
              >
                {nome}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                  background: badge.bg, color: badge.color,
                }}>
                  {badge.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Score summary card ───────────────────────────────────────────── */}
      <div style={{
        background: C.white, border: `1px solid ${C.border}`, borderRadius: 20,
        padding: "24px 28px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: "0 0 3px" }}>
              Punteggio Configurato
            </p>
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
              Punti totali disponibili per ogni invitato
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <span style={{ fontSize: 38, fontWeight: 900, fontFamily: QS, color: C.onSurf, lineHeight: 1 }}>
              {punteggiAttivi}
            </span>
            <span style={{ fontSize: 16, fontWeight: 600, color: C.muted }}> / {MAX_PUNTI}</span>
          </div>
        </div>

        {/* Barra progresso */}
        <div style={{ height: 8, borderRadius: 999, background: C.border, overflow: "hidden", marginBottom: 14 }}>
          <div style={{
            height: "100%",
            width: `${barPct}%`,
            background: `linear-gradient(90deg, ${C.primary}, ${C.priL})`,
            borderRadius: 999,
            transition: "width 350ms cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>

        {/* Pillole metriche attive/inattive */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {METRICHE.map((m) => {
            const isOn = toggles[m.key];
            return (
              <span
                key={m.key}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
                  background: isOn ? C.priXL : C.bg,
                  color:      isOn ? C.onPri : C.muted,
                  border:     `1px solid ${isOn ? C.priL : C.border}`,
                  transition: "all 200ms",
                }}
              >
                <span style={{ fontSize: 14 }}>{m.emoji}</span>
                {m.punti}pt
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Warning evento concluso ──────────────────────────────────────── */}
      {isConcluso && (
        <div style={{
          background: C.amberBg, border: `1px solid ${C.amberBrd}`, borderRadius: 14,
          padding: "12px 18px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.amberTx, margin: 0 }}>
            Evento concluso — le metriche non possono essere modificate.
          </p>
        </div>
      )}

      {/* ── Grid toggle metriche ─────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: "0 0 12px" }}>
          Metriche di Gioco
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {METRICHE.map((m) => {
            const isOn = toggles[m.key];
            return (
              <div
                key={m.key}
                style={{
                  background: isOn
                    ? `linear-gradient(135deg, ${C.white} 0%, ${C.priXL}55 100%)`
                    : C.white,
                  border:       `2px solid ${isOn ? C.priL : C.border}`,
                  borderRadius: 16,
                  padding:      "16px 20px",
                  display:      "flex",
                  alignItems:   "center",
                  gap:          14,
                  transition:   "border-color 200ms, background 200ms",
                  opacity:      isConcluso ? 0.6 : 1,
                }}
              >
                {/* Emoji box */}
                <div style={{
                  width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                  background: isOn ? C.priXL : C.bg,
                  border:     `1px solid ${isOn ? C.priL : C.border}`,
                  display:    "flex", alignItems: "center", justifyContent: "center",
                  fontSize:   22,
                  transition: "background 200ms, border-color 200ms",
                }}>
                  {m.emoji}
                </div>

                {/* Testo */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14, fontWeight: 700,
                    color: isOn ? C.onSurf : C.onSurfV,
                    margin: 0, lineHeight: 1.2,
                  }}>
                    {m.label}
                  </p>
                  <p style={{ fontSize: 11, color: C.muted, margin: "3px 0 0" }}>
                    {m.desc}
                  </p>
                </div>

                {/* Badge punti + toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 999,
                    background: isOn ? C.priXL : C.bg,
                    color:      isOn ? C.primary : C.muted,
                    border:     `1px solid ${isOn ? C.priL : C.border}`,
                    fontFamily: QS,
                    transition: "all 200ms",
                  }}>
                    {m.punti}pt
                  </span>

                  {/* Toggle iOS-style */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    disabled={isConcluso}
                    onClick={() => flip(m.key)}
                    style={{
                      width: 48, height: 28, borderRadius: 999,
                      border: "none",
                      cursor: isConcluso ? "not-allowed" : "pointer",
                      padding: "3px",
                      background: isOn
                        ? `linear-gradient(100deg, ${C.primary}, ${C.priL})`
                        : "#d4c5c8",
                      boxShadow: isOn
                        ? `inset 0 1px 3px rgba(0,0,0,0.12), 0 2px 8px ${C.priL}80`
                        : "inset 0 1px 3px rgba(0,0,0,0.10)",
                      transition: "background 220ms",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: "#ffffff",
                      transform:  isOn ? "translateX(20px)" : "translateX(0px)",
                      transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                      boxShadow:  isOn
                        ? `0 2px 6px ${C.primary}60`
                        : "0 2px 5px rgba(0,0,0,0.15)",
                    }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Domande personalizzate (Premium) ────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <div style={{
          background: isPremium
            ? "linear-gradient(135deg, #fffbeb, #fef3c7)"
            : C.white,
          border:       `2px solid ${isPremium ? C.amberBrd : C.border}`,
          borderRadius: 20,
          padding:      "24px 28px",
          opacity:      isPremium ? 1 : 0.65,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>✏️</span>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.onSurf, margin: 0 }}>
                  Domande Personalizzate
                </p>
                <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0" }}>
                  Nome del bebè, chi piange per primo, e altro ancora
                </p>
              </div>
            </div>
            {!isPremium && (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 999, flexShrink: 0,
                background: C.amberBg, color: "#9A7000",
                border: "1px solid rgba(212,175,55,0.30)",
              }}>
                PREMIUM
              </span>
            )}
          </div>

          {isPremium && (
            <button style={{
              marginTop: 12, fontSize: 13, fontWeight: 700,
              padding: "10px 20px", borderRadius: 12,
              border: "none", cursor: "pointer", color: "#fff",
              background: `linear-gradient(100deg, ${C.primary} 0%, #5e2d3a 100%)`,
              boxShadow: "0 6px 16px rgba(135,78,88,0.30)",
            }}>
              + Aggiungi domanda
            </button>
          )}
        </div>

        {/* Frosted glass lock per non-premium */}
        {!isPremium && (
          <>
            <div style={{
              position: "absolute", inset: 0, borderRadius: 20,
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              background: "rgba(253,251,247,0.65)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", inset: 0, borderRadius: 20,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: C.white, border: `2px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, boxShadow: "0 4px 16px rgba(44,44,46,0.10)",
              }}>
                👑
              </div>
              <a href="/dashboard/upgrade" style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 24px", borderRadius: 14,
                border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 700, color: "#fff",
                background: "linear-gradient(100deg, #D4AF37 0%, #C08A3E 100%)",
                boxShadow: "0 10px 24px -6px rgba(212,175,55,0.45)",
                textDecoration: "none",
              }}>
                ⭐ Sblocca Premium
              </a>
            </div>
          </>
        )}
      </div>

      {/* ── Link evento ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link
          href={`/dashboard/${evento.id}`}
          style={{
            fontSize: 13, fontWeight: 600, color: C.muted,
            textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
          }}
        >
          Vai alla dashboard evento →
        </Link>
      </div>
    </div>
  );
}
