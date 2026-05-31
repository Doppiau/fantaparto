"use client";

import { useState, useTransition } from "react";
import { inserisciRisultatiAction } from "../actions";

interface TabGrandGiornoProps {
  eventId: string;
  stato: string;
  risultatiEsistenti: {
    realeSesso?: string | null;
    realeData?: Date | null;
    realePeso?: number | null;
    realeOra?: string | null;
  };
}

type Step = 0 | 1 | 2 | 3 | 4;

async function lanciaConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  const opts = {
    colors: ["#FF6B6B", "#FF8787", "#FFD166", "#6FA8DC", "#F296C2", "#34C759", "#FF9F45"],
  };
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, ...opts });
  setTimeout(() => confetti({ particleCount: 80, spread: 110, origin: { y: 0.45, x: 0.3 }, ...opts }), 350);
  setTimeout(() => confetti({ particleCount: 80, spread: 110, origin: { y: 0.45, x: 0.7 }, ...opts }), 500);
  setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, ...opts }), 800);
}

export default function TabGrandGiorno({
  eventId,
  stato,
  risultatiEsistenti,
}: TabGrandGiornoProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [success, setSuccess] = useState(stato === "CONCLUSO");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [sesso, setSesso] = useState(risultatiEsistenti.realeSesso ?? "");
  const [data, setData] = useState(
    risultatiEsistenti.realeData
      ? new Date(risultatiEsistenti.realeData).toISOString().split("T")[0]
      : ""
  );
  const [ora, setOra] = useState(risultatiEsistenti.realeOra ?? "");
  const [peso, setPeso] = useState(
    risultatiEsistenti.realePeso ? String(risultatiEsistenti.realePeso) : ""
  );

  function openWizard() {
    setStep(1);
    setError(null);
    setWizardOpen(true);
  }

  function closeWizard() {
    if (isPending) return;
    setWizardOpen(false);
  }

  function handleSubmit() {
    const formData = new FormData();
    if (sesso) formData.set("sesso", sesso);
    if (data) formData.set("data", data);
    if (peso) formData.set("peso", peso);
    if (ora) formData.set("ora", ora);

    startTransition(async () => {
      const result = await inserisciRisultatiAction(
        eventId,
        { success: false },
        formData
      );
      if (result.success) {
        setWizardOpen(false);
        setSuccess(true);
        lanciaConfetti();
      } else {
        setError(result.error ?? "Errore sconosciuto. Riprova.");
      }
    });
  }

  const STEPS = [
    { label: "Maschio o Femmina?", emoji: "💫" },
    { label: "Quando è nato/a?", emoji: "📅" },
    { label: "A che ora?", emoji: "🕐" },
    { label: "Quanto pesava?", emoji: "⚖️" },
  ] as const;

  const canNext =
    step === 1 ? !!sesso :
    step === 2 ? !!data :
    true;

  /* ── Schermata successo ───────────────────────────────── */
  if (success) {
    return (
      <div className="fp-card-plain p-8 flex flex-col items-center gap-5 text-center">
        <span className="text-6xl select-none">🎉</span>
        <div>
          <h3
            className="text-[22px] font-black text-[var(--ink)]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            FantaParto concluso!
          </h3>
          <p
            className="text-[13px] mt-2"
            style={{ color: "rgba(44,44,46,0.55)" }}
          >
            I risultati sono stati registrati e la classifica calcolata.
            Condividila con i tuoi cari!
          </p>
        </div>
        <button
          onClick={lanciaConfetti}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] transition-all active:scale-95"
          style={{
            background: "linear-gradient(100deg, #FF6B6B, #FF8787)",
            color: "white",
            boxShadow: "0 12px 28px -8px rgba(255,107,107,0.40)",
          }}
        >
          🎊 Rivivi il momento
        </button>
      </div>
    );
  }

  /* ── Card di innesco ──────────────────────────────────── */
  return (
    <>
      <div className="fp-card-warm p-6 flex flex-col items-center gap-5 text-center relative overflow-hidden">
        {/* Glow decorativo */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12), transparent 65%)",
          }}
        />

        <span className="text-6xl select-none relative z-10">👶</span>

        <div className="relative z-10">
          <h3
            className="text-[22px] font-black text-[var(--ink)]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            È arrivato il grande giorno?
          </h3>
          <p
            className="text-[13px] mt-2"
            style={{ color: "rgba(44,44,46,0.55)" }}
          >
            Inserisci i dati reali della nascita per calcolare chi ha
            indovinato tra i tuoi cari!
          </p>
        </div>

        <button
          onClick={openWizard}
          className="relative z-10 w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[16px] transition-all duration-300 active:scale-[0.97]"
          style={{
            background: "linear-gradient(100deg, #FF6B6B 0%, #FF8787 100%)",
            color: "white",
            boxShadow: "0 16px 36px -10px rgba(255,107,107,0.45)",
            fontFamily: "var(--font-fredoka, sans-serif)",
          }}
        >
          🚀 Inserisci i risultati
        </button>
      </div>

      {/* ── Wizard Modal ──────────────────────────────────── */}
      {wizardOpen && (
        <div className="fp-modal-overlay">
          {/* Backdrop */}
          <div className="fp-modal-backdrop" onClick={closeWizard} />

          {/* Card modale */}
          <div className="fp-modal-card p-6 flex flex-col gap-5">
            {/* Handle bar (mobile) */}
            <div className="flex justify-center sm:hidden -mb-2">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: "rgba(44,44,46,0.15)" }}
              />
            </div>

            {/* Header modale */}
            <div className="flex items-center justify-between">
              <h2
                className="text-[20px] font-black text-[var(--ink)]"
                style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
              >
                Il Grande Giorno
              </h2>
              <button
                onClick={closeWizard}
                disabled={isPending}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: "rgba(44,44,46,0.07)",
                  color: "rgba(44,44,46,0.50)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2">
              {([1, 2, 3, 4] as const).map((s) => (
                <div
                  key={s}
                  className="fp-step-dot"
                  style={{
                    background:
                      s === step
                        ? "#FF6B6B"
                        : s < step
                        ? "rgba(255,107,107,0.35)"
                        : "rgba(44,44,46,0.12)",
                    width: s === step ? 24 : 8,
                  }}
                />
              ))}
            </div>

            {/* Contenuto step */}
            <div className="flex flex-col gap-4 min-h-[180px]">
              <div className="text-center">
                <span className="text-5xl select-none">{STEPS[step - 1].emoji}</span>
                <h3
                  className="text-[18px] font-bold text-[var(--ink)] mt-3"
                >
                  {STEPS[step - 1].label}
                </h3>
                <p
                  className="text-[12px] mt-0.5"
                  style={{ color: "rgba(44,44,46,0.45)" }}
                >
                  Passo {step} di 4
                </p>
              </div>

              {/* Step 1: Sesso */}
              {step === 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {(["MASCHIO", "FEMMINA"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSesso(s)}
                      className="py-5 rounded-2xl font-bold text-[16px] border-2 transition-all duration-200 active:scale-95"
                      style={{
                        borderColor:
                          sesso === s
                            ? s === "MASCHIO" ? "#6FA8DC" : "#F296C2"
                            : "#EDE8E0",
                        background:
                          sesso === s
                            ? s === "MASCHIO" ? "#EBF4FC" : "#FDEEF6"
                            : "white",
                        color:
                          sesso === s
                            ? s === "MASCHIO" ? "#4A87BB" : "#C060A0"
                            : "rgba(44,44,46,0.45)",
                        boxShadow:
                          sesso === s
                            ? s === "MASCHIO"
                              ? "0 8px 20px -8px rgba(111,168,220,0.40)"
                              : "0 8px 20px -8px rgba(242,150,194,0.40)"
                            : "none",
                      }}
                    >
                      {s === "MASCHIO" ? "💙 Maschio" : "🩷 Femmina"}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Data */}
              {step === 2 && (
                <div className="flex flex-col gap-2">
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="fp-input w-full text-center text-[18px] font-bold"
                  />
                </div>
              )}

              {/* Step 3: Ora */}
              {step === 3 && (
                <div className="flex flex-col gap-2">
                  <input
                    type="time"
                    value={ora}
                    onChange={(e) => setOra(e.target.value)}
                    className="fp-input w-full text-center text-[18px] font-bold"
                    placeholder="--:--"
                  />
                  <p
                    className="text-[12px] text-center"
                    style={{ color: "rgba(44,44,46,0.45)" }}
                  >
                    Puoi saltare questo passo
                  </p>
                </div>
              )}

              {/* Step 4: Peso */}
              {step === 4 && (
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="es. 3250"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      min={500}
                      max={8000}
                      className="fp-input w-full text-center text-[18px] font-bold pr-14"
                    />
                    <span
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold"
                      style={{ color: "rgba(44,44,46,0.40)" }}
                    >
                      grammi
                    </span>
                  </div>
                  {peso && Number(peso) >= 500 && (
                    <p
                      className="text-[13px] font-bold text-center"
                      style={{ color: "var(--salmon)" }}
                    >
                      = {(Number(peso) / 1000).toFixed(3).replace(".", ",")} kg
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Messaggio di errore */}
            {error && (
              <div
                className="px-4 py-3 rounded-2xl text-center"
                style={{ background: "#FFF0F0", borderColor: "#FFD5D5", border: "1px solid" }}
              >
                <p className="text-[13px] font-semibold text-red-500">{error}</p>
              </div>
            )}

            {/* Navigazione step */}
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  disabled={isPending}
                  className="flex-1 py-3.5 rounded-2xl border-2 font-bold text-[14px] transition-all disabled:opacity-40"
                  style={{ borderColor: "#EDE8E0", color: "rgba(44,44,46,0.55)" }}
                >
                  ← Indietro
                </button>
              )}

              {step < 4 ? (
                <button
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  disabled={!canNext}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-white transition-all disabled:opacity-40 active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(100deg, #FF6B6B, #FF8787)",
                    boxShadow: canNext
                      ? "0 10px 24px -8px rgba(212,175,55,0.45)"
                      : "none",
                  }}
                >
                  Avanti →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-white transition-all disabled:opacity-50 active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(100deg, #FF6B6B, #FF8787)",
                    boxShadow: "0 10px 24px -8px rgba(212,175,55,0.45)",
                    fontFamily: "var(--font-fredoka, sans-serif)",
                    fontSize: "1rem",
                  }}
                >
                  {isPending ? "⏳ Calcolo..." : "🎉 Calcola la classifica!"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
