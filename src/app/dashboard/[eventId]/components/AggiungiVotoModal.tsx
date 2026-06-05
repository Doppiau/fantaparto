"use client";

import { useState, useTransition } from "react";
import { aggiungiVotoManualeAction } from "../actions";

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

const C = {
  primary: "#874e58", priXL: "#fde8e6", priL: "#f4acb7", onPri: "#733d47",
  sec: "#40627b", secLight: "#bee1ff",
  white: "#ffffff", bg: "#f7f5f2", border: "#F1ECE4",
  onSurf: "#1b1c1a", onSurfV: "#6b5b5d", muted: "#b0a0a2",
  error: "#b91c1c", errBg: "#fef2f2",
} as const;

interface Props {
  eventId:         string;
  dppIso:          string;
  sessoAttivo:     boolean;
  dataAttiva:      boolean;
  pesoAttivo:      boolean;
  lunghezzaAttiva: boolean;
  oraAttiva:       boolean;
  capelliAttivo:   boolean;
  occhiAttivo:     boolean;
  isPremium:       boolean;
  onClose:         () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.45)", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%", boxSizing: "border-box", padding: "10px 14px",
        borderRadius: 12, border: `1.5px solid ${C.border}`,
        background: C.white, fontSize: 14, fontFamily: VN, color: C.onSurf,
        outline: "none", ...props.style,
      }}
    />
  );
}

function ChoiceRow({ value, selected, onClick, children }: { value: string; selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, padding: "10px 8px", borderRadius: 10,
      border: `1.5px solid ${selected ? C.primary : C.border}`,
      background: selected ? C.priXL : C.white,
      color: selected ? C.primary : C.onSurfV,
      fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: VN,
      transition: "all 150ms", boxShadow: selected ? `0 0 0 2px ${C.priL}40` : "none",
    }}>
      {children}
    </button>
  );
}

export default function AggiungiVotoModal({
  eventId, dppIso, sessoAttivo, dataAttiva, pesoAttivo,
  lunghezzaAttiva, oraAttiva, capelliAttivo, occhiAttivo, isPremium,
  onClose,
}: Props) {
  const dppDate = dppIso.split("T")[0];

  const [nome, setNome]               = useState("");
  const [email, setEmail]             = useState("");
  const [sesso, setSesso]             = useState<"MASCHIO" | "FEMMINA" | "">("");
  const [data, setData]               = useState(dppDate);
  const [peso, setPeso]               = useState(3200);
  const [lunghezza, setLunghezza]     = useState(500);
  const [ora, setOra]                 = useState("");
  const [capelli, setCapelli]         = useState<"LISCI" | "RICCI" | "CALVO" | "">("");
  const [occhi, setOcchi]             = useState<"CHIARI" | "SCURI" | "">("");
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);
  const [, startTransition]           = useTransition();

  // Rispetta il paywall Free per le metriche avanzate
  const showLunghezza = lunghezzaAttiva && isPremium;
  const showOra       = oraAttiva       && isPremium;
  const showCapelli   = capelliAttivo   && isPremium;
  const showOcchi     = occhiAttivo     && isPremium;

  function handleSubmit() {
    if (nome.trim().length < 2) { setError("Il nome deve avere almeno 2 caratteri."); return; }
    setError("");

    const payload: Record<string, unknown> = { nomeInvitato: nome.trim() };
    if (email.trim()) payload.emailInvitato = email.trim();
    if (sessoAttivo  && sesso) payload.votoSesso = sesso;
    if (dataAttiva   && data)  payload.votoData  = new Date(data);
    if (pesoAttivo)            payload.votoPeso  = peso;
    if (showLunghezza)         payload.votoLunghezza = lunghezza;
    if (showOra && ora)        payload.votoOra   = ora;
    if (showCapelli && capelli) payload.votoCapelli = capelli;
    if (showOcchi   && occhi)   payload.votoOcchi   = occhi;

    startTransition(async () => {
      const res = await aggiungiVotoManualeAction(eventId, payload);
      if (res.success) { setSuccess(true); }
      else setError(res.error);
    });
  }

  if (success) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
        <div style={{ background: C.white, borderRadius: 20, padding: "40px 32px", maxWidth: 360, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 48, margin: 0 }}>✅</p>
          <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>Voto aggiunto!</h3>
          <p style={{ fontSize: 14, color: C.onSurfV, margin: 0 }}>Il pronostico di <strong>{nome}</strong> è stato registrato.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={() => { setSuccess(false); setNome(""); setEmail(""); setSesso(""); setData(dppDate); setPeso(3200); setLunghezza(500); setOra(""); setCapelli(""); setOcchi(""); }}
              style={{ flex: 1, padding: "11px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 13, fontWeight: 700, cursor: "pointer", color: C.onSurf, fontFamily: VN }}>
              + Aggiungi un altro
            </button>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: C.primary, fontSize: 13, fontWeight: 700, cursor: "pointer", color: C.white, fontFamily: VN }}>
              Chiudi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.40)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.white, borderRadius: 24, padding: "28px 28px 24px", maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: QS, color: C.onSurf, margin: 0 }}>Aggiungi voto manuale</h2>
            <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0" }}>Per conto di un ospite che non può accedere al link</p>
          </div>
          <button type="button" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: C.muted, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* ── Dati invitato ─────────────────────────────────────── */}
        <div style={{ background: C.bg, borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Nome *">
            <Input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="es. Zia Maria" maxLength={80} autoFocus />
          </Field>
          <Field label="Email (opzionale)">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@esempio.it" />
          </Field>
        </div>

        {/* ── Pronostici ────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: C.muted, margin: 0 }}>Pronostici</p>

          {/* Sesso */}
          {sessoAttivo && (
            <Field label="Sesso">
              <div style={{ display: "flex", gap: 8 }}>
                <ChoiceRow value="MASCHIO" selected={sesso === "MASCHIO"} onClick={() => setSesso(sesso === "MASCHIO" ? "" : "MASCHIO")}>💙 Maschio</ChoiceRow>
                <ChoiceRow value="FEMMINA" selected={sesso === "FEMMINA"} onClick={() => setSesso(sesso === "FEMMINA" ? "" : "FEMMINA")}>🩷 Femmina</ChoiceRow>
              </div>
            </Field>
          )}

          {/* Data */}
          {dataAttiva && (
            <Field label="Data prevista">
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </Field>
          )}

          {/* Peso */}
          {pesoAttivo && (
            <Field label={`Peso previsto — ${(peso / 1000).toFixed(2).replace(".", ",")} kg`}>
              <input type="range" min={1000} max={6000} step={50} value={peso}
                onChange={(e) => setPeso(Number(e.target.value))}
                style={{ width: "100%", accentColor: C.primary, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 2 }}>
                <span>1,0 kg</span><span>6,0 kg</span>
              </div>
            </Field>
          )}

          {/* Lunghezza (solo Premium) */}
          {showLunghezza && (
            <Field label={`Lunghezza — ${(lunghezza / 10).toFixed(1).replace(".", ",")} cm`}>
              <input type="range" min={300} max={700} step={5} value={lunghezza}
                onChange={(e) => setLunghezza(Number(e.target.value))}
                style={{ width: "100%", accentColor: C.primary, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 2 }}>
                <span>30 cm</span><span>70 cm</span>
              </div>
            </Field>
          )}

          {/* Ora */}
          {showOra && (
            <Field label="Ora di nascita">
              <Input type="time" value={ora} onChange={(e) => setOra(e.target.value)} />
            </Field>
          )}

          {/* Capelli */}
          {showCapelli && (
            <Field label="Capelli">
              <div style={{ display: "flex", gap: 8 }}>
                {(["LISCI", "RICCI", "CALVO"] as const).map((v) => (
                  <ChoiceRow key={v} value={v} selected={capelli === v} onClick={() => setCapelli(capelli === v ? "" : v)}>
                    {v === "LISCI" ? "💇 Lisci" : v === "RICCI" ? "🌀 Ricci" : "✨ Calvo"}
                  </ChoiceRow>
                ))}
              </div>
            </Field>
          )}

          {/* Occhi */}
          {showOcchi && (
            <Field label="Colore occhi">
              <div style={{ display: "flex", gap: 8 }}>
                <ChoiceRow value="CHIARI" selected={occhi === "CHIARI"} onClick={() => setOcchi(occhi === "CHIARI" ? "" : "CHIARI")}>🔵 Chiari</ChoiceRow>
                <ChoiceRow value="SCURI"  selected={occhi === "SCURI"}  onClick={() => setOcchi(occhi === "SCURI"  ? "" : "SCURI")}>🟤 Scuri</ChoiceRow>
              </div>
            </Field>
          )}
        </div>

        {/* Errore */}
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: C.errBg, border: `1px solid #fecaca`, fontSize: 13, color: C.error }}>
            ⚠ {error}
          </div>
        )}

        {/* Footer azioni */}
        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 14, fontWeight: 700, cursor: "pointer", color: C.onSurf, fontFamily: VN }}>
            Annulla
          </button>
          <button type="button" onClick={handleSubmit} disabled={nome.trim().length < 2}
            style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: nome.trim().length < 2 ? C.muted : C.primary, color: C.white, fontSize: 14, fontWeight: 700, cursor: nome.trim().length < 2 ? "not-allowed" : "pointer", fontFamily: VN }}>
            ✓ Aggiungi voto
          </button>
        </div>
      </div>
    </div>
  );
}
