"use client";

import { useState } from "react";
import { type NuovoEventoFormData } from "../types";

const C = {
  white: "#ffffff", bg: "#fbf9f5", border: "#e8e4e1",
  primary: "#874e58", priXLight: "#ffd9de", priLight: "#f4acb7", onPri: "#733d47",
  onSurf: "#1b1c1a", onSurfVar: "#6b5b5d", muted: "#b0a0a2",
} as const;
const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

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

function PremiumModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.3)" }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "36px 32px", maxWidth: 360, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 44, margin: 0 }}>✨</p>
        <h3 style={{ fontSize: 22, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>
          Funzione Premium
        </h3>
        <p style={{ fontSize: 14, color: C.onSurfVar, lineHeight: 1.65, margin: 0 }}>
          Sblocca tutte le metriche avanzate con il piano Premium.{" "}
          <strong style={{ color: C.onSurf }}>Solo €2.99</strong> per questo evento.
        </p>
        <button
          onClick={() => { console.log("TODO: redirect Stripe"); onClose(); }}
          style={{ border: "none", cursor: "pointer", background: C.primary, color: C.white, borderRadius: 999, padding: "12px 24px", fontSize: 14, fontWeight: 700, fontFamily: VN, boxShadow: "0 4px 14px rgba(135,78,88,0.22)" }}
        >
          Sblocca Premium →
        </button>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: C.muted, fontFamily: VN }}>
          Continua con il piano gratuito
        </button>
      </div>
    </div>
  );
}

const METRICHE = [
  { key: "sesso",     icon: "👶", nome: "Sesso",              desc: "Maschio o femmina?",        premium: false },
  { key: "data",      icon: "📅", nome: "Data del parto",     desc: "Il giorno esatto",          premium: false },
  { key: "peso",      icon: "⚖️", nome: "Peso alla nascita",  desc: "In grammi",                 premium: false },
  { key: "ora",       icon: "🕐", nome: "Ora di nascita",     desc: "La fascia oraria",          premium: true  },
  { key: "lunghezza", icon: "📏", nome: "Lunghezza",          desc: "In centimetri",             premium: true  },
  { key: "capelli",   icon: "💇", nome: "Quantità di capelli",desc: "Calvo, poco, tanto",        premium: true  },
  { key: "occhi",     icon: "👁️", nome: "Colore degli occhi", desc: "Azzurri, marroni, verdi…", premium: true  },
] as const;

interface Props { data: NuovoEventoFormData; onChange: (u: Partial<NuovoEventoFormData>) => void; }

export default function Step2Metriche({ data, onChange }: Props) {
  const [showPremium, setShowPremium] = useState(false);

  const handle = (key: string, isPremium: boolean) => {
    if (isPremium) { setShowPremium(true); return; }
    onChange({ metriche: { ...data.metriche, [key]: !data.metriche[key as keyof typeof data.metriche] } });
  };

  return (
    <>
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      <div style={{ maxWidth: 480, margin: "0 auto", background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "36px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: "0 0 8px" }}>
            Su cosa voteranno?
          </h2>
          <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>
            Scegli i pronostici che gli invitati potranno fare. Puoi cambiarli in seguito.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {METRICHE.map((m) => {
            const isOn = data.metriche[m.key as keyof typeof data.metriche] && !m.premium;
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
                  opacity: m.premium ? 0.7 : 1,
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: isOn ? C.priLight + "60" : C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.onSurf, fontFamily: VN }}>{m.nome}</span>
                    {m.premium && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: C.priXLight, color: C.onPri }}>
                        🔒 Premium
                      </span>
                    )}
                  </div>
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
