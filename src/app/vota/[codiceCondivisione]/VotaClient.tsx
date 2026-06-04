"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C_BASE = {
  bg:        "#fbf9f5",
  white:     "#ffffff",
  border:    "#e8e4e1",
  primary:   "#874e58",
  priLight:  "#f4acb7",
  priXLight: "#ffd9de",
  onPri:     "#733d47",
  secondary: "#40627b",
  secLight:  "#bee1ff",
  onSec:     "#42647e",
  onSurf:    "#1b1c1a",
  onSurfVar: "#6b5b5d",
  muted:     "#b0a0a2",
  error:     "#b91c1c",
  errBg:     "#fef2f2",
  errBrd:    "#fecaca",
};

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = "form" | "submitting" | "success" | "already_voted" | "limit_reached";
type Sesso = "MASCHIO" | "FEMMINA";
type Capelli = "LISCI" | "RICCI" | "CALVO";
type Occhi = "CHIARI" | "SCURI";

interface Props {
  eventId:        string;
  nomeBimbo:      string | null;
  dataPresuntaParto: string;
  sessoAttivo:    boolean;
  dataAttiva:     boolean;
  pesoAttivo:     boolean;
  lunghezzaAttiva:boolean;
  oraAttiva:      boolean;
  capelliAttivo:  boolean;
  occhiAttivo:    boolean;
  temaColore?:    string | null;
  isPremium:      boolean;
}

const TEMA: Record<string, { primary: string; priLight: string; priXLight: string; onPri: string }> = {
  ROSA:    { primary: "#874e58", priLight: "#f4acb7", priXLight: "#ffd9de", onPri: "#733d47" },
  CELESTE: { primary: "#2c6e8a", priLight: "#bee1ff", priXLight: "#dff0ff", onPri: "#1a5578" },
  NEUTRO:  { primary: "#6b5b5d", priLight: "#d6c2c3", priXLight: "#f0e8e9", onPri: "#514345" },
};

// ── Sezione card ──────────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C_BASE.white, border: `1px solid ${C_BASE.border}`,
        borderRadius: 16, padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 14,
      }}
    >
      <p
        style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.07em", color: C_BASE.muted, margin: 0,
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

// ── Input pill ────────────────────────────────────────────────────────────────
function PillInput({ primaryColor, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { primaryColor?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
      style={{
        width: "100%", boxSizing: "border-box", outline: "none",
        border: `1.5px solid ${focused ? (primaryColor ?? C_BASE.primary) : C_BASE.border}`,
        borderRadius: 999, padding: "12px 18px",
        fontSize: 15, fontFamily: VN, color: C_BASE.onSurf,
        background: C_BASE.white, transition: "border-color 150ms",
        ...props.style,
      }}
    />
  );
}

// ── Choice button ─────────────────────────────────────────────────────────────
function Choice({
  selected, onClick, children, accent = C_BASE.primary, accentBg = C_BASE.priXLight,
}: {
  selected: boolean; onClick: () => void; children: React.ReactNode;
  accent?: string; accentBg?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1.5px solid ${selected ? accent : C_BASE.border}`,
        background: selected ? accentBg : C_BASE.white,
        borderRadius: 12, padding: "14px 12px",
        fontSize: 14, fontWeight: 600, fontFamily: VN,
        color: selected ? accent : C_BASE.onSurfVar,
        cursor: "pointer", transition: "all 150ms", textAlign: "center",
        boxShadow: selected ? `0 4px 12px ${accent}22` : "none",
      }}
    >
      {children}
    </button>
  );
}

// ── Slider section ────────────────────────────────────────────────────────────
function SliderField({
  label, value, min, max, step, display, primaryColor,
  onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; primaryColor?: string; onChange: (v: number) => void;
}) {
  const pc = primaryColor ?? C_BASE.primary;
  return (
    <Section label={label}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, color: C_BASE.onSurfVar }}>Trascina per scegliere</span>
        <span style={{ fontSize: 26, fontWeight: 700, fontFamily: QS, color: pc }}>
          {display}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: pc, cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C_BASE.muted }}>
        <span>{min < 1000 ? `${(min / 10).toFixed(0)} cm` : `${(min / 1000).toFixed(2)} kg`}</span>
        <span>{max < 1000 ? `${(max / 10).toFixed(0)} cm` : `${(max / 1000).toFixed(2)} kg`}</span>
      </div>
    </Section>
  );
}

// ── Page component ────────────────────────────────────────────────────────────
export default function VotaClient({
  eventId, nomeBimbo, dataPresuntaParto,
  sessoAttivo, dataAttiva, pesoAttivo,
  lunghezzaAttiva, oraAttiva, capelliAttivo, occhiAttivo,
  temaColore, isPremium,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const C = { ...C_BASE, ...(TEMA[temaColore ?? "ROSA"] ?? TEMA.ROSA) };
  const [phase, setPhase]           = useState<Phase>("form");
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [nomeInvitato, setNome]     = useState("");
  const [emailInvitato, setEmail]   = useState("");
  const [messaggioAugurio, setMsg]  = useState("");
  const [votoSesso, setVotoSesso]   = useState<Sesso | "">("");
  const [votoData, setVotoData]     = useState(dataPresuntaParto.split("T")[0]);
  const [votoPeso, setVotoPeso]     = useState(3200);
  const [votoLunghezza, setVotoLun] = useState(500);
  const [votoOra, setVotoOra]       = useState("");
  const [votoCapelli, setVotoCap]   = useState<Capelli | "">("");
  const [votoOcchi, setVotoOcchi]   = useState<Occhi | "">("");
  const [error, setError]           = useState<string | null>(null);
  const [honeypot, setHoneypot]     = useState("");

  const nomeDisplay = nomeBimbo ? `Baby ${nomeBimbo}` : "Fagiolino 🫘";
  const dppFormatted = new Date(dataPresuntaParto).toLocaleDateString("it-IT", {
    day: "numeric", month: "long", year: "numeric",
  });

  useEffect(() => {
    const votedKey = `fp_voted_${eventId}`;
    const fpKey    = `fp_${eventId}`;

    let fp = localStorage.getItem(fpKey);
    if (!fp) {
      fp = [Date.now().toString(36), Math.random().toString(36).slice(2, 10),
        window.screen.width, window.screen.height, navigator.hardwareConcurrency ?? 0].join("-");
      localStorage.setItem(fpKey, fp);
    }
    setFingerprint(fp);

    if (!localStorage.getItem(votedKey)) return;

    // localStorage dice "già votato" — verifica lato server che il voto esista ancora.
    // Il genitore potrebbe averlo eliminato: in quel caso azzeriamo il flag locale e
    // mostriamo di nuovo il form vuoto (reset del voto completato lato client).
    setPhase("already_voted"); // ottimistico: nessun flash del form
    const fpSnapshot = fp;
    fetch(`/api/v1/predict/status?eventId=${encodeURIComponent(eventId)}&fingerprint=${encodeURIComponent(fpSnapshot)}`)
      .then((r) => r.json())
      .then(({ hasVoted }: { hasVoted: boolean }) => {
        if (!hasVoted) {
          localStorage.removeItem(votedKey);
          setPhase("form");
        }
      })
      .catch(() => {
      // Errore di rete / parsing: non possiamo verificare — mostriamo il form.
      // Il doppio-voto è bloccato a livello DB dal check fingerprint in /api/v1/predict.
      localStorage.removeItem(votedKey);
      setPhase("form");
    });
  }, [eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fingerprint || !nomeInvitato.trim()) return;
    setPhase("submitting"); setError(null);
    const body: Record<string, unknown> = {
      eventId, nomeInvitato: nomeInvitato.trim(), deviceFingerprint: fingerprint,
      _hp: honeypot,
    };
    if (emailInvitato) body.emailInvitato = emailInvitato;
    if (messaggioAugurio) body.messaggioAugurio = messaggioAugurio;
    if (sessoAttivo && votoSesso) body.votoSesso = votoSesso;
    if (dataAttiva && votoData) body.votoData = votoData;
    if (pesoAttivo) body.votoPeso = votoPeso;
    if (lunghezzaAttiva) body.votoLunghezza = votoLunghezza;
    if (oraAttiva && votoOra) body.votoOra = votoOra;
    if (capelliAttivo && votoCapelli) body.votoCapelli = votoCapelli;
    if (occhiAttivo && votoOcchi) body.votoOcchi = votoOcchi;
    try {
      const res = await fetch("/api/v1/predict", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: { success: boolean; limitReached?: boolean; error?: string; data?: { id: string } } = await res.json();
      if (!res.ok) {
        if (json.limitReached) { setPhase("limit_reached"); return; }
        setError(json.error ?? "Errore imprevisto."); setPhase("form"); return;
      }
      localStorage.setItem(`fp_voted_${eventId}`, "1");
      if (json.data?.id) setPredictionId(json.data.id);
      setPhase("success");
    } catch {
      setError("Errore di connessione. Controlla la rete e riprova.");
      setPhase("form");
    }
  }

  // ── Limite raggiunto (Free plan) ──────────────────────────────────────────
  if (phase === "limit_reached") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: VN }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 24, padding: "48px 36px", maxWidth: 400, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.priXLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
            🏆
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>
            Evento al completo!
          </h1>
          <p style={{ fontSize: 14, color: C.onSurfVar, lineHeight: 1.65, margin: 0 }}>
            <strong>{nomeDisplay}</strong> ha raggiunto il limite di partecipanti del piano gratuito.
            I genitori riceveranno una notifica per sbloccare i posti con il piano Premium.
          </p>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: C.primary, textDecoration: "none", marginTop: 4 }}>
            Scopri FantaParto →
          </Link>
        </div>
      </div>
    );
  }

  // ── Already voted ──────────────────────────────────────────────────────────
  if (phase === "already_voted") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: VN }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "40px 32px", maxWidth: 360, width: "100%", textAlign: "center" }}>
          <p style={{ fontSize: 44, marginBottom: 16 }}>✅</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.onSurf, fontFamily: QS, marginBottom: 10 }}>
            Hai già votato!
          </h1>
          <p style={{ fontSize: 14, color: C.onSurfVar, lineHeight: 1.6 }}>
            Hai già espresso il tuo pronostico per <strong>{nomeDisplay}</strong>. Aspetta la nascita per scoprire chi ha vinto!
          </p>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: VN }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "40px 32px", maxWidth: 380, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 52, margin: 0 }}>🎉</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.onSurf, fontFamily: QS, margin: 0 }}>
            Pronostico inviato!
          </h1>
          <p style={{ fontSize: 14, color: C.onSurfVar, lineHeight: 1.65 }}>
            Il tuo voto per <strong>{nomeDisplay}</strong> è salvato. Tornerai qui dopo la nascita per scoprire chi ha indovinato!
          </p>
          {predictionId && (
            <a
              href={`/api/og/voto/${predictionId}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontSize: 14, fontWeight: 700, color: C.white,
                background: "linear-gradient(135deg, #1565c0 0%, #c2185b 100%)",
                borderRadius: 999, padding: "13px 24px",
                textDecoration: "none", boxShadow: "0 4px 14px rgba(135,78,88,0.22)",
              }}
            >
              🖼️ Vedi e condividi la tua card
            </a>
          )}
          <div style={{ paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, marginBottom: 12 }}>
              Aspetti anche tu un bambino?
            </p>
            <Link
              href="/signup"
              style={{
                display: "block", fontSize: 14, fontWeight: 700, color: C.white,
                background: C.primary, borderRadius: 999, padding: "12px 24px",
                textDecoration: "none", boxShadow: "0 4px 14px rgba(135,78,88,0.22)",
              }}
            >
              🍼 Crea il tuo FantaParto
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: VN }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px 64px" }}>

        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginBottom: 8 }}>
            FantaParto
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: QS, color: C.onSurf, marginBottom: 6 }}>
            {nomeDisplay}
          </h1>
          <p style={{ fontSize: 14, color: C.onSurfVar }}>
            Data Presunta Parto · {dppFormatted}
          </p>
          {!isPremium && (
            <p style={{ fontSize: 11, color: C.muted, marginTop: 10, padding: "5px 12px", borderRadius: 999, background: C_BASE.bg, display: "inline-block", border: `1px solid ${C_BASE.border}` }}>
              🆓 Piano Free · max 20 partecipanti · metriche base
            </p>
          )}
        </header>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Honeypot — invisibile agli umani, compilato dai bot */}
          <input
            type="text"
            name="website_confirm"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />

          {/* Chi sei */}
          <Section label="Chi sei? *">
            <PillInput
              primaryColor={C.primary}
              type="text" placeholder="Il tuo nome *" value={nomeInvitato}
              onChange={(e) => setNome(e.target.value)} maxLength={80} required
            />
            <PillInput
              primaryColor={C.primary}
              type="email" placeholder="Email (opzionale)" value={emailInvitato}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Section>

          {/* Sesso */}
          {sessoAttivo && (
            <Section label="Maschio o Femmina?">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Choice selected={votoSesso === "MASCHIO"} onClick={() => setVotoSesso(votoSesso === "MASCHIO" ? "" : "MASCHIO")} accent={C.secondary} accentBg={C.secLight}>
                  💙 Maschio
                </Choice>
                <Choice selected={votoSesso === "FEMMINA"} onClick={() => setVotoSesso(votoSesso === "FEMMINA" ? "" : "FEMMINA")} accent={C.primary} accentBg={C.priXLight}>
                  🩷 Femmina
                </Choice>
              </div>
            </Section>
          )}

          {/* Data */}
          {dataAttiva && (
            <Section label="Quando nascerà?">
              <PillInput
                primaryColor={C.primary}
                type="date" value={votoData}
                onChange={(e) => setVotoData(e.target.value)}
                style={{ textAlign: "center", fontSize: 16, fontWeight: 600 }}
              />
            </Section>
          )}

          {/* Peso */}
          {pesoAttivo && (
            <SliderField
              label="Peso alla nascita" value={votoPeso} min={1000} max={6000} step={50}
              display={`${(votoPeso / 1000).toFixed(2).replace(".", ",")} kg`}
              primaryColor={C.primary}
              onChange={setVotoPeso}
            />
          )}

          {/* Lunghezza */}
          {lunghezzaAttiva && (
            <SliderField
              label="Lunghezza" value={votoLunghezza} min={300} max={700} step={5}
              display={`${(votoLunghezza / 10).toFixed(1).replace(".", ",")} cm`}
              primaryColor={C.primary}
              onChange={setVotoLun}
            />
          )}

          {/* Ora */}
          {oraAttiva && (
            <Section label="Ora di nascita (opzionale)">
              <PillInput
                primaryColor={C.primary}
                type="time" value={votoOra}
                onChange={(e) => setVotoOra(e.target.value)}
                style={{ textAlign: "center", fontSize: 16, fontWeight: 600 }}
              />
            </Section>
          )}

          {/* Capelli */}
          {capelliAttivo && (
            <Section label="Capelli">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {(["LISCI", "RICCI", "CALVO"] as const).map((v) => (
                  <Choice key={v} selected={votoCapelli === v} onClick={() => setVotoCap(votoCapelli === v ? "" : v)} accent={C.primary} accentBg={C.priXLight}>
                    {v === "LISCI" ? "💇 Lisci" : v === "RICCI" ? "🌀 Ricci" : "✨ Calvo"}
                  </Choice>
                ))}
              </div>
            </Section>
          )}

          {/* Occhi */}
          {occhiAttivo && (
            <Section label="Colore occhi">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["CHIARI", "SCURI"] as const).map((v) => (
                  <Choice key={v} selected={votoOcchi === v} onClick={() => setVotoOcchi(votoOcchi === v ? "" : v)} accent={C.primary} accentBg={C.priXLight}>
                    {v === "CHIARI" ? "🔵 Chiari" : "🟤 Scuri"}
                  </Choice>
                ))}
              </div>
            </Section>
          )}

          {/* Messaggio auguri */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: 0 }}>
              Messaggio di auguri 💕
            </p>
            <textarea
              placeholder="Scrivi un pensiero alla mamma..."
              value={messaggioAugurio}
              onChange={(e) => setMsg(e.target.value)}
              maxLength={500}
              rows={3}
              style={{
                width: "100%", boxSizing: "border-box", outline: "none", resize: "none",
                border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "12px 16px",
                fontSize: 14, fontFamily: VN, color: C.onSurf, background: C.white,
              }}
            />
            <p style={{ fontSize: 11, color: C.muted, textAlign: "right", margin: 0 }}>
              {messaggioAugurio.length}/500
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: C.errBg, border: `1px solid ${C.errBrd}`, borderRadius: 12, padding: "12px 16px", fontSize: 13, color: C.error }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={phase === "submitting" || !fingerprint || !nomeInvitato.trim()}
            style={{
              border: "none", outline: "none", cursor: (phase === "submitting" || !nomeInvitato.trim()) ? "not-allowed" : "pointer",
              background: (phase === "submitting" || !nomeInvitato.trim()) ? C.muted : C.primary,
              color: C.white, borderRadius: 999, padding: "16px 24px",
              fontSize: 15, fontWeight: 700, fontFamily: VN,
              boxShadow: (phase === "submitting" || !nomeInvitato.trim()) ? "none" : "0 8px 20px rgba(135,78,88,0.25)",
              transition: "all 150ms", marginTop: 4,
            }}
          >
            {phase === "submitting" ? "⏳ Invio in corso…" : "🚀 Invia il mio pronostico!"}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: C.muted }}>
            Powered by{" "}
            <Link href="/" style={{ color: C.primary, fontWeight: 700, textDecoration: "none" }}>
              FantaParto
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
