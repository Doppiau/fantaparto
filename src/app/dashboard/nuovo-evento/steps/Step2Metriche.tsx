"use client";

import { useState } from "react";
import { type NuovoEventoFormData } from "../types";

const C = {
  white: "#ffffff", bg: "#fef5f4", border: "#f0e8e6",
  primary: "#b5352c", priXLight: "#fde8e6", priLight: "#f4acb7", onPri: "#7a1f18",
  onSurf: "#1a1a2e", onSurfVar: "#5a4e50", muted: "#a89a9b",
  lockBg: "#f7f5f2", lockBorder: "#e8e4e1", lockText: "#b0a0a2",
} as const;
const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";
const FR = "var(--font-fredoka, sans-serif)";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} type="button" role="switch" aria-checked={on}
      style={{
        width: 44, height: 24, borderRadius: 999, flexShrink: 0, border: "none",
        background: on ? C.primary : C.border, cursor: "pointer",
        position: "relative", transition: "background 200ms",
      }}
    >
      <span style={{
        position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%",
        background: C.white, boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        transform: on ? "translateX(22px)" : "translateX(2px)", transition: "transform 200ms",
        display: "block",
      }} />
    </button>
  );
}

function UpsellModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.3)" }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "40px 32px", maxWidth: 360, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: 48, margin: 0 }}>✨</p>
        <h3 style={{ fontSize: 22, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>
          Funzione Premium
        </h3>
        <p style={{ fontSize: 14, color: C.onSurfVar, lineHeight: 1.65, margin: 0 }}>
          Sblocca <strong>Ora, Lunghezza, Capelli e Occhi</strong> con il piano Premium.
          Rendi il tuo FantaParto ancora più completo e divertente!
        </p>
        <div style={{ background: C.priXLight, borderRadius: 12, padding: "14px 16px", textAlign: "left" }}>
          {["Partecipanti illimitati", "Metriche avanzate (ora, lunghezza, capelli, occhi)", "PDF ricordo con grafica premium", "Statistiche avanzate"].map((f) => (
            <p key={f} style={{ fontSize: 13, color: C.onPri, margin: "3px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: C.primary }}>✓</span> {f}
            </p>
          ))}
        </div>
        <a
          href="/dashboard/profilo"
          style={{ border: "none", cursor: "pointer", background: C.primary, color: C.white, borderRadius: 999, padding: "13px 24px", fontSize: 14, fontWeight: 700, fontFamily: VN, boxShadow: "0 4px 14px rgba(181,53,44,0.25)", textDecoration: "none", display: "block" }}
        >
          Sblocca Premium →
        </a>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: C.muted, fontFamily: VN }}>
          Continua con il piano gratuito
        </button>
      </div>
    </div>
  );
}

const METRICHE = [
  { key: "sesso",     icon: "👶", nome: "Sesso",               desc: "Maschio o femmina?",        premium: false },
  { key: "data",      icon: "📅", nome: "Data del parto",      desc: "Il giorno esatto",           premium: false },
  { key: "peso",      icon: "⚖️", nome: "Peso alla nascita",   desc: "In grammi",                  premium: false },
  { key: "ora",       icon: "🕐", nome: "Ora di nascita",      desc: "La fascia oraria",           premium: true  },
  { key: "lunghezza", icon: "📏", nome: "Lunghezza",           desc: "In centimetri",              premium: true  },
  { key: "capelli",   icon: "💇", nome: "Quantità di capelli", desc: "Calvo, poco, tanto",         premium: true  },
  { key: "occhi",     icon: "👁️", nome: "Colore degli occhi",  desc: "Azzurri, marroni, verdi…",  premium: true  },
] as const;

interface Props {
  data:       NuovoEventoFormData;
  onChange:   (u: Partial<NuovoEventoFormData>) => void;
  isPremium:  boolean;
}

export default function Step2Metriche({ data, onChange, isPremium }: Props) {
  const [showUpsell, setShowUpsell] = useState(false);

  const handle = (key: string, isPremiumMetrica: boolean) => {
    if (isPremiumMetrica && !isPremium) { setShowUpsell(true); return; }
    onChange({ metriche: { ...data.metriche, [key]: !data.metriche[key as keyof typeof data.metriche] } });
  };

  return (
    <>
      {showUpsell && <UpsellModal onClose={() => setShowUpsell(false)} />}

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 24, padding: "40px 36px", display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 4px 32px -8px rgba(181,53,44,0.10)" }}>
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <h2 style={{ fontSize: 26, fontWeight: 700, fontFamily: FR, color: C.onSurf, margin: "0 0 8px" }}>
            Su cosa voteranno?
          </h2>
          <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>
            Scegli i pronostici che gli invitati potranno fare. Puoi cambiarli in seguito.
          </p>
          {!isPremium && (
            <div style={{ marginTop: 12, padding: "8px 14px", background: C.priXLight, borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>🆓</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.onPri }}>
                Piano Free: solo Sesso, Data e Peso disponibili
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {METRICHE.map((m) => {
            const locked = m.premium && !isPremium;
            const isOn   = !locked && !!data.metriche[m.key as keyof typeof data.metriche];

            if (locked) {
              return (
                <button
                  key={m.key} type="button"
                  onClick={() => setShowUpsell(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    border: `1.5px solid ${C.lockBorder}`,
                    background: C.lockBg,
                    borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                    textAlign: "left", opacity: 0.65,
                    position: "relative", overflow: "hidden",
                  }}
                >
                  {/* Icona lucchetto sovrapposta */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 16, pointerEvents: "none" }}>
                    <span style={{ fontSize: 14, opacity: 0.5 }}>🔒</span>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, filter: "grayscale(0.6)" }}>
                    {m.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.lockText, fontFamily: VN }}>{m.nome}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "#e8e4e1", color: C.lockText }}>
                        Premium
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: C.lockText, margin: 0, marginTop: 2 }}>{m.desc}</p>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={m.key} type="button"
                onClick={() => handle(m.key, m.premium)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  border: `1.5px solid ${isOn ? C.primary : C.border}`,
                  background: isOn ? C.priXLight : C.white,
                  borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                  textAlign: "left", transition: "all 150ms",
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: isOn ? C.priLight + "60" : C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.onSurf, fontFamily: VN }}>{m.nome}</span>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0, marginTop: 2 }}>{m.desc}</p>
                </div>
                <Toggle on={isOn} onClick={() => handle(m.key, m.premium)} />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
