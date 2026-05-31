"use client";

import { useState, useTransition } from "react";
import { inserisciRisultatiAction } from "../actions";

interface Partecipante {
  id: string;
  nomeInvitato: string;
  votoSesso: string | null;
  votoPeso: number | null;
  votoData: Date | null;
}

interface TabGrandGiornoProps {
  eventId: string;
  stato: string;
  risultatiEsistenti: {
    realeSesso?: string | null;
    realeData?: Date | null;
    realePeso?: number | null;
    realeOra?: string | null;
  };
  partecipanti: Partecipante[];
}

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

function computePodium(
  preds: Partecipante[],
  realSesso: string,
  realDataStr: string,
  realPesoG: number
): Array<Partecipante & { score: number }> {
  return preds
    .map((p) => {
      let score = 0;
      if (p.votoSesso === realSesso) score += 50;
      if (p.votoData && realDataStr) {
        const daysDiff = Math.abs(
          (new Date(p.votoData).getTime() - new Date(realDataStr).getTime()) / 86_400_000
        );
        score += Math.max(0, 25 - Math.floor(daysDiff) * 5);
      }
      if (p.votoPeso && realPesoG > 0) {
        const gramsDiff = Math.abs(p.votoPeso - realPesoG);
        score += Math.max(0, 25 - Math.floor(gramsDiff / 100) * 2);
      }
      return { ...p, score: Math.max(0, score) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export default function TabGrandGiorno({
  eventId,
  stato,
  risultatiEsistenti,
  partecipanti,
}: TabGrandGiornoProps) {
  const [success, setSuccess] = useState(stato === "CONCLUSO");
  const [error, setError] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();

  const [sesso, setSesso] = useState(risultatiEsistenti.realeSesso ?? "FEMMINA");
  const [data, setData] = useState(
    risultatiEsistenti.realeData
      ? new Date(risultatiEsistenti.realeData).toISOString().split("T")[0]
      : ""
  );
  const [ora, setOra] = useState(risultatiEsistenti.realeOra ?? "");
  const [peso, setPeso] = useState(
    risultatiEsistenti.realePeso ? String(risultatiEsistenti.realePeso) : ""
  );

  const [podium, setPodium] = useState<Array<Partecipante & { score: number }>>([]);

  function handleSubmit() {
    if (!sesso || !data) {
      setError("Inserisci almeno il sesso e la data di nascita.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.set("sesso", sesso);
    formData.set("data", data);
    if (ora) formData.set("ora", ora);
    if (peso) formData.set("peso", peso);

    setWizardStep(2);

    startTransition(async () => {
      const result = await inserisciRisultatiAction(eventId, { success: false }, formData);
      if (result.success) {
        const top3 = computePodium(partecipanti, sesso, data, Number(peso) || 0);
        setPodium(top3);
        setWizardStep(3);
        setSuccess(true);
        lanciaConfetti();
      } else {
        setError(result.error ?? "Errore sconosciuto. Riprova.");
        setWizardStep(1);
      }
    });
  }

  /* ── Già concluso ── */
  if (success && wizardStep !== 3) {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-8">
        <span className="text-6xl select-none">🎉</span>
        <div>
          <h3
            className="text-[22px] font-black text-[#2C2C2E]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            FantaParto concluso!
          </h3>
          <p className="text-[13px] mt-2" style={{ color: "rgba(44,44,46,0.55)" }}>
            I risultati sono stati registrati e la classifica calcolata.
          </p>
        </div>
        <button
          onClick={() => lanciaConfetti()}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] text-white transition-all active:scale-95 clay-btn-coral"
        >
          🎊 Rivivi il momento
        </button>
      </div>
    );
  }

  /* ── Step 1: Form ── */
  if (wizardStep === 1) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                style={{
                  background: s === 1 ? "#FF6B6B" : "#F1ECE4",
                  color: s === 1 ? "white" : "rgba(44,44,46,0.40)",
                }}
              >
                {s}
              </div>
              {s < 3 && <div className="h-0.5 w-10" style={{ background: "#F1ECE4" }} />}
            </div>
          ))}
        </div>

        <div className="text-center space-y-1">
          <h4
            className="font-extrabold text-xl text-[#2C2C2E]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            Il Bimbo è Nato! 🎉
          </h4>
          <p className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.55)" }}>
            Inserisci i parametri reali di nascita per generare la classifica.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Sesso */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(44,44,46,0.55)" }}>
              Sesso
            </label>
            <select
              value={sesso}
              onChange={(e) => setSesso(e.target.value)}
              className="w-full px-3 py-3 rounded-xl font-bold text-sm border-2 border-[#F1ECE4] transition-all"
              style={{ background: "#FDFBF7", color: "#2C2C2E" }}
            >
              <option value="FEMMINA">Femmina 🩷</option>
              <option value="MASCHIO">Maschio 💙</option>
            </select>
          </div>

          {/* Peso */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(44,44,46,0.55)" }}>
              Peso (grammi)
            </label>
            <input
              type="number"
              placeholder="es. 3250"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              min={500}
              max={8000}
              className="w-full px-3 py-3 rounded-xl font-bold text-sm border-2 border-[#F1ECE4] transition-all"
              style={{ background: "#FDFBF7", color: "#2C2C2E", fontFamily: "var(--font-mono, monospace)" }}
            />
            {peso && Number(peso) >= 500 && (
              <p className="text-[10px] font-bold" style={{ color: "#FF6B6B" }}>
                = {(Number(peso) / 1000).toFixed(3).replace(".", ",")} kg
              </p>
            )}
          </div>

          {/* Data */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(44,44,46,0.55)" }}>
              Data di Nascita
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-3 rounded-xl font-bold text-sm border-2 border-[#F1ECE4] transition-all"
              style={{ background: "#FDFBF7", color: "#2C2C2E" }}
            />
          </div>

          {/* Ora */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(44,44,46,0.55)" }}>
              Ora di Nascita
            </label>
            <input
              type="time"
              value={ora}
              onChange={(e) => setOra(e.target.value)}
              className="w-full px-3 py-3 rounded-xl font-bold text-sm border-2 border-[#F1ECE4] transition-all"
              style={{ background: "#FDFBF7", color: "#2C2C2E" }}
            />
            <p className="text-[10px]" style={{ color: "rgba(44,44,46,0.40)" }}>Puoi saltare</p>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-2xl text-center border border-red-200" style={{ background: "#FFF0F0" }}>
            <p className="text-[13px] font-semibold text-red-500">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full clay-btn-slate text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest"
        >
          Calcola Classifica Finale →
        </button>
      </div>
    );
  }

  /* ── Step 2: Calculating ── */
  if (wizardStep === 2) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                style={{
                  background: s <= 2 ? "#FF6B6B" : "#F1ECE4",
                  color: s <= 2 ? "white" : "rgba(44,44,46,0.40)",
                }}
              >
                {s === 2 && isPending ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : s}
              </div>
              {s < 3 && <div className="h-0.5 w-10" style={{ background: s < 2 ? "#FF6B6B" : "#F1ECE4" }} />}
            </div>
          ))}
        </div>

        <div
          className="w-16 h-16 border-4 rounded-full animate-spin mx-auto"
          style={{ borderColor: "#FF6B6B", borderTopColor: "transparent" }}
        />
        <div className="space-y-2">
          <h5
            className="font-extrabold text-base text-[#2C2C2E]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            Calcolo Classifica in corso…
          </h5>
          <p className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.55)" }}>
            Analizziamo i pronostici e assegniamo i punteggi.
          </p>
        </div>
      </div>
    );
  }

  /* ── Step 3: Podium ── */
  const medals = ["🥇", "🥈", "🥉"];
  const podiumOrder = podium.length >= 3 ? [podium[1], podium[0], podium[2]] : podium;
  const heights = ["h-44", "h-56", "h-36"];

  return (
    <div className="space-y-8 py-4">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {([1, 2, 3] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
              style={{ background: "#FF6B6B", color: "white" }}
            >
              {s === 3 ? "✓" : s}
            </div>
            {s < 3 && <div className="h-0.5 w-10" style={{ background: "#FF6B6B" }} />}
          </div>
        ))}
      </div>

      <div className="text-center space-y-2">
        <h4
          className="font-extrabold text-2xl text-[#2C2C2E]"
          style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
        >
          Verdetto Finale FantaParto! 🎉
        </h4>
        <p className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.55)" }}>
          Ecco i campioni del pronostico!
        </p>
      </div>

      {podium.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto items-end pt-8 text-center">
          {podiumOrder.map((winner, idx) => {
            if (!winner) return <div key={idx} />;
            const realIdx = podium.indexOf(winner);
            const isFirst = realIdx === 0;
            return (
              <div
                key={winner.id}
                className={`relative flex flex-col justify-end items-center space-y-2 p-4 rounded-3xl ${heights[idx]}`}
                style={
                  isFirst
                    ? {
                        background: "linear-gradient(180deg, rgba(255,209,102,0.15), white)",
                        border: "3px solid #FFD166",
                        boxShadow: "0 8px 32px rgba(255,209,102,0.30)",
                      }
                    : {
                        background: "#FDFBF7",
                        border: "2px solid #F1ECE4",
                        boxShadow: "0 4px 12px rgba(44,44,46,0.06)",
                      }
                }
              >
                <div
                  className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full text-xl border-4 border-white"
                  style={{
                    width: isFirst ? 56 : 40,
                    height: isFirst ? 56 : 40,
                    background: isFirst ? "#FFD166" : "#F1ECE4",
                    boxShadow: isFirst ? "0 4px 16px rgba(255,209,102,0.45)" : "none",
                    animation: isFirst ? "gentle-float-1 3s ease-in-out infinite" : undefined,
                  }}
                >
                  {medals[realIdx]}
                </div>
                <div>
                  <span className="text-xs font-black text-[#2C2C2E] block truncate max-w-[80px]">
                    {winner.nomeInvitato}
                  </span>
                  {isFirst && (
                    <span
                      className="text-[9px] text-white px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "#34C759" }}
                    >
                      CAMPIONE
                    </span>
                  )}
                </div>
                <span
                  className="font-black text-sm"
                  style={{ color: "#FF6B6B", fontFamily: "var(--font-mono, monospace)" }}
                >
                  {winner.score} pti
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-sm" style={{ color: "rgba(44,44,46,0.45)" }}>
          Nessun pronostico disponibile per la classifica.
        </p>
      )}

      <div className="text-center space-y-3">
        <button
          type="button"
          onClick={() => lanciaConfetti()}
          className="px-6 py-3 border-2 font-extrabold text-xs rounded-2xl transition-all"
          style={{ borderColor: "#FF6B6B", color: "#FF6B6B" }}
        >
          🎊 Festeggia ancora!
        </button>
        <button
          type="button"
          onClick={() => { setWizardStep(1); setSuccess(false); }}
          className="block mx-auto text-xs font-semibold transition-colors"
          style={{ color: "rgba(44,44,46,0.38)" }}
        >
          Modifica parametri reali
        </button>
      </div>
    </div>
  );
}
