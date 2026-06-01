"use client";

import { useState } from "react";
import { type NuovoEventoFormData } from "../types";

const C = {
  white:        "#ffffff",
  primary:      "#874e58",
  primaryFixed: "#ffd9de",
  primaryCont:  "#f4acb7",
  onPriCont:    "#733d47",
  onSurf:       "#1b1c1a",
  onSurfVar:    "#514345",
  outlineVar:   "#d6c2c3",
  surfContLow:  "#f5f3ef",
  shadow:       "0px 12px 32px rgba(135,78,88,0.08)",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

// ── Toggle pill personalizzato ─────────────────────────────────────────────

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      aria-checked={on}
      role="switch"
      className="relative flex-shrink-0 rounded-full transition-colors duration-200"
      style={{
        width:      44,
        height:     24,
        background: on ? C.primary : C.outlineVar,
      }}
    >
      <span
        className="absolute top-0.5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{
          width:     20,
          height:    20,
          transform: on ? "translateX(22px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}

// ── Metrica card ──────────────────────────────────────────────────────────────

interface MetricaConfig {
  key:        keyof NuovoEventoFormData["metriche"];
  icona:      string;
  nome:       string;
  desc:       string;
  premium:    boolean;
}

const METRICHE: MetricaConfig[] = [
  { key: "sesso",     icona: "👶", nome: "Sesso",              desc: "Maschio o femmina?",        premium: false },
  { key: "data",      icona: "📅", nome: "Data del parto",     desc: "Il giorno esatto",          premium: false },
  { key: "peso",      icona: "⚖️", nome: "Peso alla nascita",  desc: "In grammi",                 premium: false },
  { key: "ora",       icona: "🕐", nome: "Ora di nascita",     desc: "La fascia oraria",          premium: true  },
  { key: "lunghezza", icona: "📏", nome: "Lunghezza",          desc: "In centimetri",             premium: true  },
  { key: "capelli",   icona: "💇", nome: "Quantità di capelli",desc: "Calvo, poco, tanto",        premium: true  },
  { key: "occhi",     icona: "👁️", nome: "Colore degli occhi", desc: "Azzurri, marroni, verdi...",premium: true  },
];

// ── Modale Premium ────────────────────────────────────────────────────────────

function PremiumModal({ onClose }: { onClose: () => void }) {
  const handleSblocca = () => {
    console.log("TODO: redirect Stripe");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.3)" }}
    >
      <div
        className="w-full max-w-sm rounded-[2rem] p-8 flex flex-col items-center gap-4 text-center"
        style={{ background: C.white, boxShadow: C.shadow }}
      >
        <span className="text-5xl select-none">✨</span>
        <h3
          className="text-[24px] font-semibold"
          style={{ fontFamily: QS, color: C.onSurf }}
        >
          Funzione Premium
        </h3>
        <p className="text-[15px] font-normal" style={{ color: C.onSurfVar }}>
          Sblocca tutte le metriche avanzate con il piano Premium.{" "}
          <strong style={{ color: C.onSurf }}>Solo €2.99</strong> per questo evento.
        </p>

        <button
          onClick={handleSblocca}
          className="w-full rounded-full py-3 text-[14px] font-semibold text-white transition-all active:scale-95"
          style={{
            background: C.primary,
            boxShadow:  "0 12px 32px rgba(135,78,88,0.22)",
            fontFamily: VN,
          }}
        >
          Sblocca Premium →
        </button>

        <button
          onClick={onClose}
          className="text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: C.onSurfVar, fontFamily: VN }}
        >
          Continua con il piano gratuito
        </button>
      </div>
    </div>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────

interface Props {
  data:     NuovoEventoFormData;
  onChange: (updates: Partial<NuovoEventoFormData>) => void;
}

export default function Step2Metriche({ data, onChange }: Props) {
  const [showPremium, setShowPremium] = useState(false);

  const handleToggle = (cfg: MetricaConfig) => {
    if (cfg.premium) {
      setShowPremium(true);
      return;
    }
    onChange({
      metriche: { ...data.metriche, [cfg.key]: !data.metriche[cfg.key] },
    });
  };

  return (
    <>
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}

      <div
        className="mx-auto max-w-lg rounded-[3rem] p-10 flex flex-col gap-6"
        style={{ background: C.white, boxShadow: C.shadow }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-5xl select-none" aria-hidden>🎯</span>
          <h2
            className="text-[28px] font-semibold"
            style={{ fontFamily: QS, color: C.onSurf }}
          >
            Su cosa voteranno?
          </h2>
          <p className="text-[15px] font-normal max-w-xs" style={{ color: C.onSurfVar }}>
            Scegli i pronostici che gli invitati potranno fare. Puoi cambiarli in qualsiasi momento.
          </p>
        </div>

        {/* Lista metriche */}
        <div className="flex flex-col gap-3">
          {METRICHE.map((cfg) => {
            const isOn     = data.metriche[cfg.key];
            const isPremium = cfg.premium;

            return (
              <button
                key={cfg.key}
                type="button"
                onClick={() => handleToggle(cfg)}
                className="flex items-center gap-4 rounded-[1.25rem] p-4 text-left transition-all duration-200"
                style={{
                  background: isOn && !isPremium ? C.white : C.surfContLow,
                  border:     `1.5px solid ${isOn && !isPremium ? C.primary : "transparent"}`,
                  opacity:    isPremium ? 0.7 : 1,
                }}
              >
                {/* Icona */}
                <div
                  className="w-10 h-10 rounded-[0.75rem] flex items-center justify-center text-[20px] flex-shrink-0"
                  style={{ background: isOn && !isPremium ? C.primaryFixed : C.outlineVar + "40" }}
                >
                  {cfg.icona}
                </div>

                {/* Testo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[15px] font-semibold"
                      style={{ color: C.onSurf, fontFamily: VN }}
                    >
                      {cfg.nome}
                    </span>
                    {isPremium && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: C.primaryFixed, color: C.onPriCont }}
                      >
                        🔒 Premium
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] font-medium mt-0.5" style={{ color: C.onSurfVar }}>
                    {cfg.desc}
                  </p>
                </div>

                {/* Toggle */}
                <Toggle on={isOn && !isPremium} onClick={() => handleToggle(cfg)} />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
