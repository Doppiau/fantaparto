"use client";

import { useState, Fragment } from "react";
import { type NuovoEventoFormData, initialFormData } from "./types";
import Step1InfoBase from "./steps/Step1InfoBase";
import Step2Metriche from "./steps/Step2Metriche";
import Step3Personalizzazione from "./steps/Step3Personalizzazione";
import Step4Anteprima from "./steps/Step4Anteprima";
import CelebrationScreen from "./CelebrationScreen";

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  surface:     "#fbf9f5",
  primary:     "#874e58",
  onSurfVar:   "#514345",
  outlineVar:  "#d6c2c3",
  primaryFixed:"#ffd9de",
  white:       "#ffffff",
  shadow:      "0px 12px 32px rgba(135,78,88,0.08)",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

const STEP_LABELS = ["Info base", "Pronostici", "Personalizza", "Anteprima"];

// ── Validazione per step ─────────────────────────────────────────────────────

function isStep1Valid(d: NuovoEventoFormData): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dppDate = d.dpp ? new Date(d.dpp) : null;
  return (
    d.nomeFeto.trim().length >= 2 &&
    d.nomeFeto.trim().length <= 30 &&
    dppDate !== null &&
    !isNaN(dppDate.getTime()) &&
    dppDate > today &&
    d.nomeMamma.trim().length >= 2
  );
}

function isStep2Valid(d: NuovoEventoFormData): boolean {
  return d.metriche.sesso || d.metriche.data || d.metriche.peso;
}

// ── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEP_LABELS.map((label, i) => {
        const isActive    = i === current;
        const isCompleted = i < current;

        return (
          <Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5">
              {isActive ? (
                <div
                  className="flex items-center gap-1.5 rounded-full px-4 py-2"
                  style={{ background: C.primary }}
                >
                  <span className="text-white text-[13px] font-bold leading-none">
                    {i + 1}
                  </span>
                  <span
                    className="text-white text-[12px] font-semibold leading-none hidden sm:block"
                    style={{ fontFamily: VN }}
                  >
                    {label}
                  </span>
                </div>
              ) : isCompleted ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: C.primary }}
                >
                  <span className="text-white text-[13px]">✓</span>
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: C.outlineVar }}
                >
                  <span
                    className="text-[12px] font-bold"
                    style={{ color: C.onSurfVar, fontFamily: VN }}
                  >
                    {i + 1}
                  </span>
                </div>
              )}

              {/* Label sotto — solo completati/futuri, solo desktop */}
              {!isActive && (
                <span
                  className="text-[10px] font-semibold hidden sm:block"
                  style={{
                    color:     isCompleted ? C.primary : C.outlineVar,
                    fontFamily: VN,
                  }}
                >
                  {label}
                </span>
              )}
            </div>

            {/* Connettore */}
            {i < STEP_LABELS.length - 1 && (
              <div
                className="h-px flex-1 mx-2 mb-5 sm:mb-4"
                style={{
                  background: i < current ? C.primary : C.outlineVar,
                  maxWidth:   64,
                }}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NuovoEventoPage() {
  const [step, setStep]           = useState(0);
  const [formData, setFormData]   = useState<NuovoEventoFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [celebrazione, setCelebrazione] = useState<{
    codiceCondivisione: string;
    eventoId: string;
  } | null>(null);

  const updateFormData = (updates: Partial<NuovoEventoFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const stepValid = [isStep1Valid(formData), isStep2Valid(formData), true, true];

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/event", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeBimbo:         formData.nomeFeto,
          dataPresuntaParto: formData.dpp,
          nomeMamma:         formData.nomeMamma,
          isPremium:         false,
          sessoAttivo:       formData.metriche.sesso,
          dataAttiva:        formData.metriche.data,
          pesoAttivo:        formData.metriche.peso,
          oraAttiva:         formData.metriche.ora,
          lunghezzaAttiva:   formData.metriche.lunghezza,
          capelliAttivo:     formData.metriche.capelli,
          occhiAttivo:       formData.metriche.occhi,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Errore nella creazione dell'evento.");
        return;
      }

      setCelebrazione({
        codiceCondivisione: json.data.codiceCondivisione,
        eventoId:           json.data.id,
      });
    } catch {
      setError("Errore di rete. Riprova tra qualche istante.");
    } finally {
      setIsLoading(false);
    }
  };

  // Schermata celebrazione — full screen overlay
  if (celebrazione) {
    return (
      <CelebrationScreen
        nomeFeto={formData.nomeFeto}
        codiceCondivisione={celebrazione.codiceCondivisione}
        eventoId={celebrazione.eventoId}
      />
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:       C.surface,
        fontFamily:       VN,
        pointerEvents:    isLoading ? "none" : "auto",
        opacity:          isLoading ? 0.7 : 1,
        transition:       "opacity 200ms",
      }}
    >
      <div className="px-6 md:px-10 py-8 max-w-[640px] mx-auto">

        {/* Header pagina */}
        <div className="mb-8">
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-1"
            style={{ color: C.onSurfVar }}
          >
            Nuovo evento
          </p>
          <h1
            className="text-[28px] font-semibold"
            style={{ fontFamily: QS, color: "#1b1c1a" }}
          >
            Crea il tuo FantaParto
          </h1>
        </div>

        <StepIndicator current={step} />

        {/* Step content */}
        <div className="mb-8">
          {step === 0 && (
            <Step1InfoBase data={formData} onChange={updateFormData} />
          )}
          {step === 1 && (
            <Step2Metriche data={formData} onChange={updateFormData} />
          )}
          {step === 2 && (
            <Step3Personalizzazione data={formData} onChange={updateFormData} />
          )}
          {step === 3 && (
            <Step4Anteprima
              data={formData}
              onGoToStep={setStep}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-4 px-5 py-3 rounded-full text-[13px] font-semibold"
            style={{ background: "#ffdad6", color: "#93000a" }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Navigazione bottom */}
        <div className="flex items-center justify-between">
          {/* Indietro */}
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full px-6 py-3 text-[14px] font-semibold transition-all active:scale-95"
              style={{
                border:     `2px solid ${C.outlineVar}`,
                color:      C.onSurfVar,
                background: "transparent",
                fontFamily: VN,
              }}
            >
              ← Indietro
            </button>
          ) : (
            <div />
          )}

          {/* Avanti / Crea */}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!stepValid[step]}
              className="rounded-full px-8 py-3 text-[14px] font-semibold text-white transition-all active:scale-95"
              style={{
                background:    stepValid[step] ? C.primary : C.outlineVar,
                boxShadow:     stepValid[step]
                  ? "0 12px 32px rgba(135,78,88,0.22)"
                  : "none",
                cursor:        stepValid[step] ? "pointer" : "not-allowed",
                fontFamily:    VN,
              }}
            >
              Avanti →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="rounded-full px-8 py-3 text-[14px] font-semibold text-white transition-all active:scale-95"
              style={{
                background:  C.primary,
                boxShadow:   "0 12px 32px rgba(135,78,88,0.22)",
                fontFamily:  VN,
              }}
            >
              {isLoading ? "⏳ Creazione in corso..." : "Crea il mio FantaParto ✨"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
