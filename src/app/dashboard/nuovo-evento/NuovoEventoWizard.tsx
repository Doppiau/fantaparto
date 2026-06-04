"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { type NuovoEventoFormData, initialFormData } from "./types";
import Step1InfoBase from "./steps/Step1InfoBase";
import Step2Metriche from "./steps/Step2Metriche";
import Step3Personalizzazione from "./steps/Step3Personalizzazione";
import Step4Anteprima from "./steps/Step4Anteprima";
import CelebrationScreen from "./CelebrationScreen";

const C = {
  bg:      "#fef5f4",
  white:   "#ffffff",
  border:  "#f0e8e6",
  primary: "#b5352c",
  priL:    "#f4acb7",
  priXL:   "#fde8e6",
  onSurf:  "#1a1a2e",
  muted:   "#a89a9b",
  mutedL:  "#d9cccb",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";
const FR = "var(--font-fredoka, sans-serif)";

const STEPS = [
  { label: "Info",       emoji: "🍼" },
  { label: "Pronostici", emoji: "🎯" },
  { label: "Messaggio",  emoji: "💌" },
  { label: "Anteprima",  emoji: "✨" },
];

function isStep1Valid(d: NuovoEventoFormData) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dppDate = d.dpp ? new Date(d.dpp) : null;
  return d.nomeFeto.trim().length >= 2 && d.nomeFeto.trim().length <= 30 &&
    dppDate !== null && !isNaN(dppDate.getTime()) && dppDate > today &&
    d.nomeMamma.trim().length >= 2;
}
function isStep2Valid(d: NuovoEventoFormData) {
  return d.metriche.sesso || d.metriche.data || d.metriche.peso;
}

function StepDots({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 32 }}>
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done || active ? C.primary : C.white,
                border: `2px solid ${done || active ? C.primary : C.mutedL}`,
                transition: "all 200ms",
                boxShadow: active ? `0 0 0 4px ${C.priXL}` : "none",
              }}>
                {done
                  ? <span style={{ fontSize: 14, color: C.white }}>✓</span>
                  : <span style={{ fontSize: 13, fontWeight: 700, color: active ? C.white : C.muted, fontFamily: QS }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.primary : C.muted, fontFamily: VN, whiteSpace: "nowrap" }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, width: 48, marginBottom: 20, flexShrink: 0, background: i < current ? C.primary : C.mutedL, transition: "background 200ms" }} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

interface Props { isPremium: boolean; }

export default function NuovoEventoWizard({ isPremium }: Props) {
  const [step, setStep]         = useState(0);
  const [formData, setFormData] = useState<NuovoEventoFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [celebrazione, setCelebrazione] = useState<{ codiceCondivisione: string; eventoId: string } | null>(null);

  const update = (u: Partial<NuovoEventoFormData>) => setFormData((p) => ({ ...p, ...u }));
  const stepValid = [isStep1Valid(formData), isStep2Valid(formData), true, true];

  const handleSubmit = async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch("/api/v1/event", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeBimbo: formData.nomeFeto, dataPresuntaParto: formData.dpp,
          nomeMamma: formData.nomeMamma,
          sessoAttivo: formData.metriche.sesso, dataAttiva: formData.metriche.data,
          pesoAttivo: formData.metriche.peso,
          // Metriche avanzate: inviate solo se l'utente è Premium (il server le ignorerà comunque)
          oraAttiva:       isPremium ? formData.metriche.ora       : false,
          lunghezzaAttiva: isPremium ? formData.metriche.lunghezza : false,
          capelliAttivo:   isPremium ? formData.metriche.capelli   : false,
          occhiAttivo:     isPremium ? formData.metriche.occhi     : false,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setError(json.error ?? "Errore nella creazione."); return; }
      setCelebrazione({ codiceCondivisione: json.data.codiceCondivisione, eventoId: json.data.id });
    } catch { setError("Errore di rete. Riprova."); }
    finally { setIsLoading(false); }
  };

  if (celebrazione) {
    return <CelebrationScreen nomeFeto={formData.nomeFeto} codiceCondivisione={celebrazione.codiceCondivisione} eventoId={celebrazione.eventoId} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: VN, opacity: isLoading ? 0.7 : 1, transition: "opacity 200ms", pointerEvents: isLoading ? "none" : "auto" }}>

      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, height: 56, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 16 }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.muted, textDecoration: "none" }}>
          ← Dashboard
        </Link>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.onSurf, fontFamily: QS }}>Crea FantaParto</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isPremium && (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, background: C.priXL, borderRadius: 999, padding: "2px 8px" }}>
              🆓 Free
            </span>
          )}
          <span style={{ fontSize: 12, color: C.muted, background: C.priXL, borderRadius: 999, padding: "3px 10px", fontWeight: 700 }}>
            {step + 1} / {STEPS.length}
          </span>
        </div>
      </div>

      {/* Contenuto */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 80px" }}>
        <StepDots current={step} />

        <div style={{ marginBottom: 28 }}>
          {step === 0 && <Step1InfoBase data={formData} onChange={update} />}
          {step === 1 && <Step2Metriche data={formData} onChange={update} isPremium={isPremium} />}
          {step === 2 && <Step3Personalizzazione data={formData} onChange={update} />}
          {step === 3 && <Step4Anteprima data={formData} onGoToStep={setStep} onSubmit={handleSubmit} isLoading={isLoading} error={error} />}
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "12px 20px", borderRadius: 14, background: "#fde8e6", border: `1px solid ${C.priL}`, fontSize: 13, fontWeight: 600, color: "#7a1f18" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 0 ? (
            <button onClick={() => setStep((s) => s - 1)}
              style={{ fontSize: 14, fontWeight: 600, color: C.muted, fontFamily: VN, border: `2px solid ${C.mutedL}`, background: "transparent", borderRadius: 14, padding: "12px 24px", cursor: "pointer", transition: "all 150ms" }}>
              ← Indietro
            </button>
          ) : <div />}

          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!stepValid[step]}
              style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: FR, border: "none", background: stepValid[step] ? C.primary : C.mutedL, borderRadius: 14, padding: "13px 32px", cursor: stepValid[step] ? "pointer" : "not-allowed", boxShadow: stepValid[step] ? "0 6px 20px rgba(181,53,44,0.30)" : "none", transition: "all 200ms" }}>
              Avanti →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isLoading}
              style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: FR, border: "none", background: C.primary, borderRadius: 14, padding: "13px 32px", cursor: "pointer", boxShadow: "0 6px 20px rgba(181,53,44,0.30)" }}>
              {isLoading ? "⏳ Creazione…" : "✨ Crea il mio FantaParto"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
