"use client";

import { useState, useTransition } from "react";
import { inserisciRisultatiAction, type ClassificaEntry } from "../actions";
import type { Toggle, Partecipante, RisultatiEsistenti } from "./BottomTabs";

interface TabGrandGiornoProps {
  eventId:            string;
  stato:              string;
  toggles:            Toggle[];
  risultatiEsistenti: RisultatiEsistenti;
  partecipanti:       Partecipante[];
}

async function lanciaConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  const opts = {
    colors: ["#FF6B6B","#FF8787","#FFD166","#6FA8DC","#F296C2","#34C759","#FF9F45"],
  };
  confetti({ particleCount: 120, spread: 80,  origin: { y: 0.55 }, ...opts });
  setTimeout(() => confetti({ particleCount: 80, spread: 110, origin: { y: 0.45, x: 0.3 }, ...opts }), 350);
  setTimeout(() => confetti({ particleCount: 80, spread: 110, origin: { y: 0.45, x: 0.7 }, ...opts }), 500);
  setTimeout(() => confetti({ particleCount: 60, spread: 60,  origin: { y: 0.6 }, ...opts }), 800);
}

function buildInitialPodium(partecipanti: Partecipante[]): ClassificaEntry[] {
  return partecipanti
    .filter((p) => p.punteggioOttenuto !== null)
    .sort((a, b) => (b.punteggioOttenuto ?? 0) - (a.punteggioOttenuto ?? 0))
    .slice(0, 3)
    .map((p) => ({ id: p.id, nomeInvitato: p.nomeInvitato, punteggio: p.punteggioOttenuto! }));
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function TabGrandGiorno({
  eventId,
  stato,
  toggles,
  risultatiEsistenti,
  partecipanti,
}: TabGrandGiornoProps) {
  const isAttivo = (key: string) => toggles.find((t) => t.key === key)?.attivo ?? false;

  const initialPodium = buildInitialPodium(partecipanti);
  const alreadyDone   = stato === "CONCLUSO";

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(
    alreadyDone && initialPodium.length > 0 ? 3 : 1,
  );
  const [podium,     setPodium]     = useState<ClassificaEntry[]>(initialPodium);
  const [error,      setError]      = useState<string | null>(null);
  const [isPending,  startTransition] = useTransition();

  // Form state — pre-popolato se i risultati esistono già
  const [sesso,     setSesso]     = useState(risultatiEsistenti.realeSesso     ?? "FEMMINA");
  const [data,      setData]      = useState(
    risultatiEsistenti.realeData
      ? new Date(risultatiEsistenti.realeData).toISOString().split("T")[0]
      : "",
  );
  const [ora,       setOra]       = useState(risultatiEsistenti.realeOra       ?? "");
  const [peso,      setPeso]      = useState(
    risultatiEsistenti.realePeso ? String(risultatiEsistenti.realePeso) : "",
  );
  const [lunghezza, setLunghezza] = useState(
    risultatiEsistenti.realeLunghezza ? String(risultatiEsistenti.realeLunghezza) : "",
  );
  const [capelli,   setCapelli]   = useState(risultatiEsistenti.realeCapelli   ?? "");
  const [occhi,     setOcchi]     = useState(risultatiEsistenti.realeOcchi     ?? "");

  function handleSubmit() {
    if (!sesso || !data) {
      setError("Inserisci almeno sesso e data di nascita.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.set("sesso", sesso);
    formData.set("data",  data);
    if (ora)       formData.set("ora",       ora);
    if (peso)      formData.set("peso",      peso);
    if (lunghezza) formData.set("lunghezza", lunghezza);
    if (capelli)   formData.set("capelli",   capelli);
    if (occhi)     formData.set("occhi",     occhi);

    setWizardStep(2);

    startTransition(async () => {
      const result = await inserisciRisultatiAction(eventId, { success: false }, formData);
      if (result.success) {
        setPodium(result.classifica.slice(0, 3));
        setWizardStep(3);
        lanciaConfetti();
      } else {
        setError(result.error);
        setWizardStep(1);
      }
    });
  }

  // ── Step indicator ───────────────────────────────────────────────────────

  function StepDots({ current }: { current: 1 | 2 | 3 }) {
    return (
      <div className="flex items-center justify-center gap-2">
        {([1, 2, 3] as const).map((s) => {
          const done   = s < current;
          const active = s === current;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                style={{
                  background: active || done ? "#FF6B6B" : "#F1ECE4",
                  color:      active || done ? "white"   : "rgba(44,44,46,0.40)",
                }}
              >
                {done ? "✓" : s === 2 && isPending
                  ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : s}
              </div>
              {s < 3 && (
                <div
                  className="h-0.5 w-10"
                  style={{ background: done ? "#FF6B6B" : "#F1ECE4" }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Step 1: Form ─────────────────────────────────────────────────────────

  if (wizardStep === 1) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <StepDots current={1} />

        <div className="text-center space-y-1">
          <h4
            className="font-extrabold text-xl text-[#2C2C2E]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            {alreadyDone ? "Modifica Risultati" : "Il Bimbo è Nato! 🎉"}
          </h4>
          <p className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.55)" }}>
            {alreadyDone
              ? "Aggiorna i parametri — ricalcolerà la classifica."
              : "Inserisci i parametri reali per generare la classifica."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Sesso */}
          {isAttivo("sessoAttivo") && (
            <div className="space-y-1.5">
              <label className={fieldLabel}>Sesso</label>
              <select
                value={sesso}
                onChange={(e) => setSesso(e.target.value)}
                className={fieldBase}
              >
                <option value="FEMMINA">Femmina 🩷</option>
                <option value="MASCHIO">Maschio 💙</option>
              </select>
            </div>
          )}

          {/* Peso */}
          {isAttivo("pesoAttivo") && (
            <div className="space-y-1.5">
              <label className={fieldLabel}>Peso (grammi)</label>
              <input
                type="number" placeholder="es. 3250"
                value={peso} onChange={(e) => setPeso(e.target.value)}
                min={500} max={8000}
                className={fieldBase}
                style={{ fontFamily: "var(--font-mono, monospace)" }}
              />
              {peso && Number(peso) >= 500 && (
                <p className="text-[10px] font-bold" style={{ color: "#FF6B6B" }}>
                  = {(Number(peso) / 1000).toFixed(3).replace(".", ",")} kg
                </p>
              )}
            </div>
          )}

          {/* Data */}
          {isAttivo("dataAttiva") && (
            <div className="space-y-1.5">
              <label className={fieldLabel}>Data di Nascita</label>
              <input
                type="date" value={data} onChange={(e) => setData(e.target.value)}
                className={fieldBase}
              />
            </div>
          )}

          {/* Ora */}
          {isAttivo("oraAttiva") && (
            <div className="space-y-1.5">
              <label className={fieldLabel}>Ora di Nascita</label>
              <input
                type="time" value={ora} onChange={(e) => setOra(e.target.value)}
                className={fieldBase}
              />
              <p className="text-[10px]" style={{ color: "rgba(44,44,46,0.40)" }}>Facoltativa</p>
            </div>
          )}

          {/* Lunghezza */}
          {isAttivo("lunghezzaAttiva") && (
            <div className="space-y-1.5">
              <label className={fieldLabel}>Lunghezza (mm)</label>
              <input
                type="number" placeholder="es. 500"
                value={lunghezza} onChange={(e) => setLunghezza(e.target.value)}
                min={200} max={800}
                className={fieldBase}
                style={{ fontFamily: "var(--font-mono, monospace)" }}
              />
              {lunghezza && Number(lunghezza) >= 200 && (
                <p className="text-[10px] font-bold" style={{ color: "#FF6B6B" }}>
                  = {(Number(lunghezza) / 10).toFixed(1)} cm
                </p>
              )}
            </div>
          )}

          {/* Capelli */}
          {isAttivo("capelliAttivo") && (
            <div className="space-y-1.5">
              <label className={fieldLabel}>Capelli</label>
              <select
                value={capelli} onChange={(e) => setCapelli(e.target.value)}
                className={fieldBase}
              >
                <option value="">— Seleziona —</option>
                <option value="LISCI">Lisci</option>
                <option value="RICCI">Ricci</option>
                <option value="CALVO">Calvo</option>
              </select>
            </div>
          )}

          {/* Occhi */}
          {isAttivo("occhiAttivo") && (
            <div className="space-y-1.5">
              <label className={fieldLabel}>Occhi</label>
              <select
                value={occhi} onChange={(e) => setOcchi(e.target.value)}
                className={fieldBase}
              >
                <option value="">— Seleziona —</option>
                <option value="CHIARI">Chiari</option>
                <option value="SCURI">Scuri</option>
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-2xl text-center border border-red-200" style={{ background: "#FFF0F0" }}>
            <p className="text-[13px] font-semibold text-red-500">{error}</p>
          </div>
        )}

        <button
          type="button" onClick={handleSubmit}
          className="w-full clay-btn-slate text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest"
        >
          {alreadyDone ? "Ricalcola Classifica →" : "Calcola Classifica Finale →"}
        </button>
      </div>
    );
  }

  // ── Step 2: Loading ───────────────────────────────────────────────────────

  if (wizardStep === 2) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-8">
        <StepDots current={2} />
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
            Confrontiamo i pronostici e assegniamo i punteggi.
          </p>
        </div>
      </div>
    );
  }

  // ── Step 3: Podio ─────────────────────────────────────────────────────────

  const medals      = ["🥇", "🥈", "🥉"];
  // Ordine visivo del podio: 2° | 1° | 3°
  const podiumOrder = podium.length >= 3
    ? [podium[1], podium[0], podium[2]]
    : podium;
  const colHeights  = ["h-44", "h-56", "h-36"];

  return (
    <div className="space-y-8 py-4">
      <StepDots current={3} />

      <div className="text-center space-y-2">
        <h4
          className="font-extrabold text-2xl text-[#2C2C2E]"
          style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
        >
          Verdetto Finale FantaParto! 🎉
        </h4>
        <p className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.55)" }}>
          {partecipanti.length} pronostici analizzati · Punteggio max 100 pt
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
                className={`relative flex flex-col justify-end items-center space-y-2 p-4 rounded-3xl ${colHeights[idx]}`}
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
                    width:      isFirst ? 56 : 40,
                    height:     isFirst ? 56 : 40,
                    background: isFirst ? "#FFD166" : "#F1ECE4",
                    boxShadow:  isFirst ? "0 4px 16px rgba(255,209,102,0.45)" : "none",
                    animation:  isFirst ? "gentle-float-1 3s ease-in-out infinite" : undefined,
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
                  {winner.punteggio} pti
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
          type="button" onClick={lanciaConfetti}
          className="px-6 py-3 border-2 font-extrabold text-xs rounded-2xl transition-all"
          style={{ borderColor: "#FF6B6B", color: "#FF6B6B" }}
        >
          🎊 Festeggia ancora!
        </button>
        <button
          type="button" onClick={() => setWizardStep(1)}
          className="block mx-auto text-xs font-semibold transition-colors"
          style={{ color: "rgba(44,44,46,0.38)" }}
        >
          Modifica parametri reali
        </button>
      </div>
    </div>
  );
}

// ── Stili condivisi form ──────────────────────────────────────────────────────

const fieldLabel = "block text-xs font-bold uppercase tracking-wider text-[rgba(44,44,46,0.55)]";
const fieldBase  = "w-full px-3 py-3 rounded-xl font-bold text-sm border-2 border-[#F1ECE4] bg-[#FDFBF7] text-[#2C2C2E] transition-all";
