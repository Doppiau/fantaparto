"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
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

export default function TabGrandGiorno({ eventId, stato, risultatiEsistenti }: TabGrandGiornoProps) {
  const [step, setStep] = useState<Step>(0);
  const [sesso, setSesso] = useState(risultatiEsistenti.realeSesso ?? "");
  const [data, setData] = useState(
    risultatiEsistenti.realeData
      ? new Date(risultatiEsistenti.realeData).toISOString().split("T")[0]
      : ""
  );
  const [peso, setPeso] = useState(
    risultatiEsistenti.realePeso ? String(risultatiEsistenti.realePeso) : ""
  );
  const [ora, setOra] = useState(risultatiEsistenti.realeOra ?? "");
  const [, startTransition] = useTransition();
  const [state, formAction] = useFormState(inserisciRisultatiAction.bind(null, eventId), { error: undefined, success: false });

  const giaConcluso = stato === "CONCLUSO";

  async function lanciaConfetti() {
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 180,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#FFD166", "#FF6B6B", "#FF8787", "#6FA8DC", "#F296C2", "#34C759"],
    });
    setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.5 } }), 500);
  }

  if (giaConcluso || state.success) {
    return (
      <div className="fp-card p-8 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">🎉</span>
        <h3 className="text-xl font-black text-[var(--ink)]">FantaParto concluso!</h3>
        <p className="text-sm text-[var(--ink-60)]">
          I risultati sono stati registrati e la classifica è stata calcolata.
        </p>
        <button className="fp-btn-gold text-sm font-bold px-6 py-2.5" onClick={lanciaConfetti}>
          🎊 Rivivi il momento
        </button>
      </div>
    );
  }

  const steps: { titolo: string; emoji: string }[] = [
    { titolo: "È arrivato/a!", emoji: "🍼" },
    { titolo: "Maschio o femmina?", emoji: "💫" },
    { titolo: "Quando è nato/a?", emoji: "📅" },
    { titolo: "Quanto pesava?", emoji: "⚖️" },
    { titolo: "A che ora?", emoji: "🕐" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {step === 0 && (
        <div className="fp-card p-8 flex flex-col items-center gap-5 text-center">
          <span className="text-6xl">👶</span>
          <h3 className="text-xl font-black text-[var(--ink)]">È arrivato il grande giorno?</h3>
          <p className="text-sm text-[var(--ink-60)]">
            Inserisci i risultati reali e scopri chi ha indovinato di più tra i tuoi cari!
          </p>
          <button
            className="fp-btn-gold text-base font-bold px-8 py-4 w-full"
            onClick={() => setStep(1)}
          >
            🚀 Inserisci i risultati
          </button>
        </div>
      )}

      {step > 0 && step <= 4 && (
        <div className="flex flex-col gap-4">
          {/* Progress steps */}
          <div className="flex items-center gap-1 px-1">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-1">
                <div
                  className="h-1.5 flex-1 rounded-full transition-all duration-300"
                  style={{ background: s <= step ? "var(--honey)" : "#F0E7D6" }}
                />
              </div>
            ))}
          </div>

          <div className="fp-card p-6 flex flex-col gap-4">
            <div className="text-center">
              <span className="text-4xl">{steps[step].emoji}</span>
              <h3 className="text-lg font-bold text-[var(--ink)] mt-2">{steps[step].titolo}</h3>
              <p className="text-xs text-[var(--ink-45)] mt-0.5">Passo {step} di 4</p>
            </div>

            {step === 1 && (
              <div className="flex gap-3">
                {["MASCHIO", "FEMMINA"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSesso(s)}
                    className="flex-1 py-4 rounded-2xl font-bold text-sm border-2 transition-all"
                    style={{
                      borderColor: sesso === s ? "var(--honey)" : "var(--border)",
                      background: sesso === s ? "#FFF8E7" : "white",
                      color: sesso === s ? "var(--honey)" : "var(--ink-60)",
                    }}
                  >
                    {s === "MASCHIO" ? "💙 Maschio" : "🩷 Femmina"}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="fp-input w-full text-center text-lg font-bold"
              />
            )}

            {step === 3 && (
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  placeholder="es. 3200 (grammi)"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  min={500} max={8000}
                  className="fp-input w-full text-center text-lg font-bold"
                />
                <p className="text-xs text-[var(--ink-45)] text-center">Inserisci in grammi (es. 3200 = 3,2 kg)</p>
              </div>
            )}

            {step === 4 && (
              <input
                type="time"
                value={ora}
                onChange={(e) => setOra(e.target.value)}
                className="fp-input w-full text-center text-lg font-bold"
              />
            )}

            {state.error && (
              <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-3 py-2">{state.error}</p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="flex-1 py-3 rounded-2xl border-2 border-[var(--border)] text-sm font-bold text-[var(--ink-60)] hover:border-[var(--honey)] transition-colors"
              >
                ← Indietro
              </button>

              {step < 4 ? (
                <button
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  disabled={step === 1 && !sesso}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(100deg, #FFD166, #FFAA44)" }}
                >
                  Avanti →
                </button>
              ) : (
                <form action={formAction} className="flex-1">
                  <input type="hidden" name="sesso" value={sesso} />
                  <input type="hidden" name="data" value={data} />
                  <input type="hidden" name="peso" value={peso} />
                  <input type="hidden" name="ora" value={ora} />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl text-sm font-bold text-white"
                    style={{ background: "linear-gradient(100deg, #FFD166, #FFAA44)" }}
                    onClick={lanciaConfetti}
                  >
                    🎉 Calcola la classifica!
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
