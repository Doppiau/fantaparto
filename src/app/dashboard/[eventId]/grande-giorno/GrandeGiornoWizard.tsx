"use client";

import { useState, useTransition, Fragment } from "react";
import { inserisciRisultatiAction, type ClassificaEntry } from "../actions";
import type { Toggle, Partecipante, RisultatiEsistenti } from "../components/BottomTabs";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:      "#fef5f4",
  white:   "#ffffff",
  border:  "#f0e8e6",
  primary: "#b5352c",
  priL:    "#f4acb7",
  priXL:   "#fde8e6",
  onSurf:  "#1a1a2e",
  muted:   "#a89a9b",
  mutedL:  "#e8dedd",
  boy:     "#dbeafe",
  boyDark: "#1e40af",
  girl:    "#fde8e6",
  girlDark:"#b5352c",
} as const;

const FR = "var(--font-fredoka, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";
const QS = "var(--font-quicksand, sans-serif)";

// ── Step indicator ─────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: "Sesso"  },
  { num: 2, label: "Dati"   },
  { num: 3, label: "Finale" },
];

function StepDots({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
      {STEPS.map((s, i) => {
        const done   = s.num < current;
        const active = s.num === current;
        return (
          <Fragment key={s.num}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done || active ? C.primary : C.white,
                border: `2px solid ${done || active ? C.primary : C.mutedL}`,
                boxShadow: active ? `0 0 0 5px ${C.priXL}` : "none",
                transition: "all 250ms",
              }}>
                {done
                  ? <span style={{ fontSize: 16, color: C.white }}>✓</span>
                  : <span style={{ fontSize: 16, fontWeight: 800, color: active ? C.white : C.muted, fontFamily: QS }}>{s.num}</span>
                }
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? C.primary : C.muted, fontFamily: VN }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                height: 2, flex: 1, maxWidth: 120, margin: "0 8px 18px",
                background: s.num < current ? C.primary : C.mutedL,
                transition: "background 250ms",
              }} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Gender card ────────────────────────────────────────────────────────────────
function GenderCard({
  value, label, selected, onClick,
  circleBg, circleColor, iconPath,
}: {
  value: string; label: string; selected: boolean; onClick: () => void;
  circleBg: string; circleColor: string; iconPath: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, position: "relative", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20,
        padding: "40px 20px 32px",
        background: selected ? (value === "MASCHIO" ? "#eff6ff" : "#fef5f4") : C.white,
        border: `2px solid ${selected ? C.primary : C.mutedL}`,
        borderRadius: 20, cursor: "pointer",
        transition: "all 200ms",
        boxShadow: selected ? `0 8px 32px -8px ${C.primary}30` : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Checkmark badge */}
      {selected && (
        <div style={{
          position: "absolute", top: 14, right: 14,
          width: 28, height: 28, borderRadius: "50%",
          background: C.primary, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 14, color: C.white }}>✓</span>
        </div>
      )}

      {/* Circle + icon */}
      <div style={{
        width: 110, height: 110, borderRadius: "50%",
        background: circleBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 200ms",
        boxShadow: selected ? `0 4px 20px ${circleColor}40` : "none",
      }}>
        <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
          <path d={iconPath} fill={circleColor} />
        </svg>
      </div>

      {/* Label */}
      <span style={{
        fontSize: 22, fontWeight: 700, fontFamily: FR,
        color: selected ? (value === "MASCHIO" ? C.boyDark : C.girlDark) : C.muted,
        transition: "color 200ms",
      }}>
        {label}
      </span>
    </button>
  );
}

// ── Input fields ───────────────────────────────────────────────────────────────
const lbl  = { fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "#a89a9b", marginBottom: 6, display: "block", fontFamily: VN };
const inp  = { width: "100%", boxSizing: "border-box" as const, border: "2px solid #f0e8e6", borderRadius: 14, padding: "13px 16px", fontSize: 15, fontFamily: VN, color: C.onSurf, background: C.white, outline: "none", transition: "border-color 150ms" };

// ── Component ──────────────────────────────────────────────────────────────────
interface Props {
  eventId:            string;
  stato:              string;
  toggles:            Toggle[];
  risultatiEsistenti: RisultatiEsistenti;
  partecipanti:       Partecipante[];
}

async function lanciaConfetti() {
  const c = (await import("canvas-confetti")).default;
  const opts = { colors: ["#b5352c","#f4acb7","#FFD166","#6FA8DC","#F296C2","#34C759"] };
  c({ particleCount: 120, spread: 80, origin: { y: 0.55 }, ...opts });
  setTimeout(() => c({ particleCount: 80, spread: 110, origin: { y: 0.45, x: 0.3 }, ...opts }), 350);
  setTimeout(() => c({ particleCount: 80, spread: 110, origin: { y: 0.45, x: 0.7 }, ...opts }), 500);
}

export default function GrandeGiornoWizard({
  eventId, stato, toggles, risultatiEsistenti, partecipanti,
}: Props) {
  const isOn = (key: string) => toggles.find((t) => t.key === key)?.attivo ?? false;
  const alreadyDone = stato === "CONCLUSO";

  const existingPodium: ClassificaEntry[] = partecipanti
    .filter((p) => p.punteggioOttenuto !== null)
    .sort((a, b) => (b.punteggioOttenuto ?? 0) - (a.punteggioOttenuto ?? 0))
    .slice(0, 3)
    .map((p) => ({ id: p.id, nomeInvitato: p.nomeInvitato, punteggio: p.punteggioOttenuto! }));

  const [step, setStep]         = useState<1 | 2 | 3>(alreadyDone && existingPodium.length > 0 ? 3 : 1);
  const [podium, setPodium]     = useState<ClassificaEntry[]>(existingPodium);
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTx]    = useTransition();

  // Form state
  const [sesso,     setSesso]     = useState<string>(risultatiEsistenti.realeSesso ?? "MASCHIO");
  const [data,      setData]      = useState(risultatiEsistenti.realeData ? new Date(risultatiEsistenti.realeData).toISOString().split("T")[0] : "");
  const [ora,       setOra]       = useState(risultatiEsistenti.realeOra ?? "");
  const [peso,      setPeso]      = useState(risultatiEsistenti.realePeso ? String(risultatiEsistenti.realePeso) : "");
  const [lunghezza, setLunghezza] = useState(risultatiEsistenti.realeLunghezza ? String(risultatiEsistenti.realeLunghezza) : "");
  const [capelli,   setCapelli]   = useState(risultatiEsistenti.realeCapelli ?? "");
  const [occhi,     setOcchi]     = useState(risultatiEsistenti.realeOcchi ?? "");

  function calcolaClassifica() {
    if (!sesso || !data) { setError("Sesso e data di nascita sono obbligatori."); return; }
    setError(null);
    setStep(2);
    const fd = new FormData();
    fd.set("sesso", sesso); fd.set("data", data);
    if (ora)       fd.set("ora",       ora);
    if (peso)      fd.set("peso",      peso);
    if (lunghezza) fd.set("lunghezza", lunghezza);
    if (capelli)   fd.set("capelli",   capelli);
    if (occhi)     fd.set("occhi",     occhi);
    startTx(async () => {
      const res = await inserisciRisultatiAction(eventId, { success: false }, fd);
      if (res.success) {
        setPodium(res.classifica.slice(0, 3));
        setStep(3);
        lanciaConfetti();
      } else {
        setError(res.error);
        setStep(alreadyDone ? 2 : 1);
      }
    });
  }

  // ── SVG person paths ────────────────────────────────────────────────────────
  const personM = "M23 10a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-7 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2v10a2 2 0 0 0 4 0V26h2v10a2 2 0 0 0 4 0V26h2a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H16Z";
  const personF = "M23 10a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-8 5a2 2 0 0 0-1.6 3.2l5 6.6V36a2 2 0 0 0 4 0V26h1v10a2 2 0 0 0 4 0V24.8l5-6.6A2 2 0 0 0 31 15H15Z";

  // ── Step 1: Sesso ──────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <StepDots current={1} />

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: FR, color: C.primary, margin: "0 0 8px" }}>
            È un lui o una lei?
          </h2>
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>La prima grande rivelazione del piccolo nascituro.</p>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
          <GenderCard
            value="MASCHIO" label="Maschio" selected={sesso === "MASCHIO"}
            onClick={() => setSesso("MASCHIO")}
            circleBg={C.boy} circleColor={C.boyDark} iconPath={personM}
          />
          <GenderCard
            value="FEMMINA" label="Femmina" selected={sesso === "FEMMINA"}
            onClick={() => setSesso("FEMMINA")}
            circleBg={C.girl} circleColor={C.girlDark} iconPath={personF}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => isOn("dataAttiva") || isOn("pesoAttivo") || isOn("oraAttiva") || isOn("lunghezzaAttiva") || isOn("capelliAttivo") || isOn("occhiAttivo") ? setStep(2) : calcolaClassifica()}
            style={{
              fontSize: 16, fontWeight: 700, color: C.white, fontFamily: FR,
              background: C.primary, border: "none", borderRadius: 14,
              padding: "14px 36px", cursor: "pointer",
              boxShadow: `0 8px 24px ${C.primary}40`,
            }}
          >
            Continua →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Dati / Calcolo ─────────────────────────────────────────────────
  if (step === 2) {
    if (isPending) {
      return (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <StepDots current={2} />
          <div style={{ width: 56, height: 56, border: `4px solid ${C.priXL}`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 24px" }} />
          <p style={{ fontSize: 20, fontWeight: 700, fontFamily: FR, color: C.onSurf, margin: "0 0 8px" }}>Calcolo classifica in corso…</p>
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Stiamo confrontando {partecipanti.length} pronostici.</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    const hasOtherFields = isOn("pesoAttivo") || isOn("dataAttiva") || isOn("oraAttiva") || isOn("lunghezzaAttiva") || isOn("capelliAttivo") || isOn("occhiAttivo");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <StepDots current={2} />

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: FR, color: C.primary, margin: "0 0 8px" }}>
            I dati del piccolo
          </h2>
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Inserisci i dati reali della nascita.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

          {isOn("dataAttiva") && (
            <div>
              <label style={lbl}>Data di nascita *</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={inp} />
            </div>
          )}
          {isOn("pesoAttivo") && (
            <div>
              <label style={lbl}>Peso (grammi) *</label>
              <input type="number" placeholder="es. 3250" value={peso} onChange={(e) => setPeso(e.target.value)} min={500} max={8000} style={inp} />
              {peso && Number(peso) >= 500 && (
                <p style={{ fontSize: 11, color: C.primary, margin: "4px 0 0", fontWeight: 700 }}>
                  = {(Number(peso) / 1000).toFixed(3).replace(".", ",")} kg
                </p>
              )}
            </div>
          )}
          {isOn("oraAttiva") && (
            <div>
              <label style={lbl}>Ora di nascita</label>
              <input type="time" value={ora} onChange={(e) => setOra(e.target.value)} style={inp} />
            </div>
          )}
          {isOn("lunghezzaAttiva") && (
            <div>
              <label style={lbl}>Lunghezza (mm)</label>
              <input type="number" placeholder="es. 500" value={lunghezza} onChange={(e) => setLunghezza(e.target.value)} min={200} max={800} style={inp} />
              {lunghezza && Number(lunghezza) >= 200 && (
                <p style={{ fontSize: 11, color: C.primary, margin: "4px 0 0", fontWeight: 700 }}>
                  = {(Number(lunghezza) / 10).toFixed(1)} cm
                </p>
              )}
            </div>
          )}
          {isOn("capelliAttivo") && (
            <div>
              <label style={lbl}>Capelli</label>
              <select value={capelli} onChange={(e) => setCapelli(e.target.value)} style={inp}>
                <option value="">— Seleziona —</option>
                <option value="LISCI">Lisci</option>
                <option value="RICCI">Ricci</option>
                <option value="CALVO">Calvo/a</option>
              </select>
            </div>
          )}
          {isOn("occhiAttivo") && (
            <div>
              <label style={lbl}>Occhi</label>
              <select value={occhi} onChange={(e) => setOcchi(e.target.value)} style={inp}>
                <option value="">— Seleziona —</option>
                <option value="CHIARI">Chiari</option>
                <option value="SCURI">Scuri</option>
              </select>
            </div>
          )}
          {!hasOtherFields && !isOn("dataAttiva") && (
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Data di nascita *</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={inp} />
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, fontWeight: 600, color: "#b91c1c", marginBottom: 16, textAlign: "center" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setStep(1)} style={{ fontSize: 14, fontWeight: 600, color: C.muted, background: "transparent", border: `2px solid ${C.mutedL}`, borderRadius: 14, padding: "12px 24px", cursor: "pointer" }}>
            ← Indietro
          </button>
          <button onClick={calcolaClassifica} style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: FR, background: C.primary, border: "none", borderRadius: 14, padding: "14px 36px", cursor: "pointer", boxShadow: `0 8px 24px ${C.primary}40` }}>
            {alreadyDone ? "Ricalcola →" : "Calcola classifica →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Podio ──────────────────────────────────────────────────────────
  const medals = ["🥇", "🥈", "🥉"];
  const podiumOrder = podium.length >= 3 ? [podium[1], podium[0], podium[2]] : podium;
  const colH = [160, 200, 130];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <StepDots current={3} />

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: FR, color: C.primary, margin: "0 0 8px" }}>
          Verdetto Finale! 🎉
        </h2>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
          {partecipanti.length} pronostici analizzati · max 100 pt
        </p>
      </div>

      {podium.length > 0 ? (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, marginBottom: 32, paddingTop: 40 }}>
          {podiumOrder.map((winner, idx) => {
            if (!winner) return <div key={idx} style={{ flex: 1 }} />;
            const realIdx = podium.indexOf(winner);
            const isFirst = realIdx === 0;
            return (
              <div key={winner.id} style={{
                flex: 1, height: colH[idx], borderRadius: 20, padding: "12px 10px",
                display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center",
                position: "relative",
                background: isFirst
                  ? "linear-gradient(180deg, rgba(255,209,102,0.18), #fff)"
                  : C.bg,
                border: `2px solid ${isFirst ? "#FFD166" : C.border}`,
                boxShadow: isFirst ? "0 8px 32px rgba(255,209,102,0.28)" : "none",
              }}>
                <div style={{
                  position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
                  width: isFirst ? 52 : 38, height: isFirst ? 52 : 38, borderRadius: "50%",
                  background: isFirst ? "#FFD166" : C.priXL,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: isFirst ? 26 : 20,
                  boxShadow: isFirst ? "0 4px 16px rgba(255,209,102,0.45)" : "none",
                  border: `3px solid ${C.white}`,
                }}>
                  {medals[realIdx]}
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.onSurf, textAlign: "center", display: "block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {winner.nomeInvitato}
                </span>
                {isFirst && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: C.white, background: "#34C759", borderRadius: 999, padding: "2px 8px", marginTop: 2 }}>
                    CAMPIONE
                  </span>
                )}
                <span style={{ fontSize: 14, fontWeight: 900, color: C.primary, fontFamily: QS, marginTop: 4 }}>
                  {winner.punteggio}pt
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: "center", fontSize: 14, color: C.muted, marginBottom: 24 }}>
          Nessun pronostico disponibile.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <button
          onClick={lanciaConfetti}
          style={{ fontSize: 14, fontWeight: 700, color: C.primary, background: C.priXL, border: `2px solid ${C.priL}`, borderRadius: 14, padding: "12px 28px", cursor: "pointer" }}
        >
          🎊 Festeggia ancora!
        </button>
        <button
          onClick={() => setStep(1)}
          style={{ fontSize: 13, fontWeight: 600, color: C.muted, background: "none", border: "none", cursor: "pointer" }}
        >
          Modifica risultati
        </button>
      </div>
    </div>
  );
}
