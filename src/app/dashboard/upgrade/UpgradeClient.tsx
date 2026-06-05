"use client";

import { useState } from "react";
import { riscattaCouponAction } from "@/app/dashboard/profilo/actions";

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";
const FR = "var(--font-fredoka, sans-serif)";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       "#fbf9f5",
  white:    "#ffffff",
  border:   "#ede8e5",
  primary:  "#874e58",
  priLight: "#f4acb7",
  priXL:    "#fde8e6",
  onPri:    "#733d47",
  onSurf:   "#1a1a2e",
  onSurfV:  "#5a4e50",
  muted:    "#a89a9b",
  green:    "#166534",
  greenBg:  "#dcfce7",
  greenBrd: "#bbf7d0",
  gold:     "#d4af37",
  goldBg:   "#fefce8",
  goldBrd:  "#fde68a",
  goldText: "#92400e",
} as const;

const FREE_FEATURES = [
  { ok: true,  text: "Fino a 20 partecipanti" },
  { ok: true,  text: "Metriche base: Sesso, Data, Peso" },
  { ok: true,  text: "Hype Space pubblico" },
  { ok: false, text: "Partecipanti illimitati" },
  { ok: false, text: "Metriche avanzate (Ora, Lunghezza, Capelli, Occhi)" },
  { ok: false, text: "Domande personalizzate" },
  { ok: false, text: "PDF ricordo con grafica premium" },
];

const PRO_FEATURES = [
  { text: "Partecipanti illimitati",                         icon: "♾️" },
  { text: "Tutte le 7 metriche di voto",                    icon: "🎯" },
  { text: "Domande personalizzate (nome, chi piange…)",     icon: "✏️" },
  { text: "PDF ricordo con grafica premium",                icon: "📄" },
  { text: "Hype Space con grafici avanzati",                icon: "📊" },
  { text: "Notifiche email per ogni voto",                  icon: "🔔" },
];

interface Props {
  isPremium:        boolean;
  couponRiscattato: string | null;
  pianoAttivatoAt:  Date | null;
}

export default function UpgradeClient({ isPremium, couponRiscattato, pianoAttivatoAt }: Props) {
  const [coupon, setCoupon]   = useState("");
  const [msg, setMsg]         = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCoupon() {
    if (!coupon.trim()) return;
    setLoading(true); setMsg("");
    const res = await riscattaCouponAction(coupon.trim());
    setLoading(false);
    if (res.success) {
      setMsg(`✓ ${res.messaggio}`);
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setMsg(`✗ ${res.error}`);
    }
  }

  // ── Stato: già Premium ─────────────────────────────────────────────────────
  if (isPremium) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.greenBg, border: `2px solid ${C.greenBrd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
          ⭐
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: QS, color: C.onSurf, margin: "0 0 8px" }}>
            Sei già Premium!
          </h1>
          <p style={{ fontSize: 15, color: C.onSurfV, margin: 0, lineHeight: 1.6 }}>
            Il tuo account ha accesso completo a tutte le funzioni Premium.
          </p>
          {pianoAttivatoAt && (
            <p style={{ fontSize: 13, color: C.muted, margin: "6px 0 0" }}>
              Attivo dal {new Date(pianoAttivatoAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
              {couponRiscattato && ` · Coupon: ${couponRiscattato}`}
            </p>
          )}
        </div>
        <div style={{ background: C.white, border: `1.5px solid ${C.greenBrd}`, borderRadius: 20, padding: "24px 28px", width: "100%", textAlign: "left" }}>
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.green, margin: "0 0 14px" }}>
            Le tue funzioni attive
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PRO_FEATURES.map((f) => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{f.icon}</span>
                <span style={{ fontSize: 14, color: C.onSurfV }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <a href="/dashboard" style={{ fontSize: 14, fontWeight: 700, color: C.primary, textDecoration: "none" }}>
          ← Torna alla Dashboard
        </a>
      </div>
    );
  }

  // ── Stato: Free — pagina upgrade ──────────────────────────────────────────
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Hero */}
      <div style={{ textAlign: "center", paddingTop: 8, paddingBottom: 8 }}>
        <div style={{ display: "inline-block", fontSize: 48, marginBottom: 12 }}>🚀</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, fontFamily: FR, color: C.onSurf, margin: "0 0 10px", lineHeight: 1.2 }}>
          Sblocca il tuo FantaParto
        </h1>
        <p style={{ fontSize: 16, color: C.onSurfV, margin: "0 auto", maxWidth: 460, lineHeight: 1.65 }}>
          Rimuovi tutti i limiti. Partecipanti illimitati, metriche complete, PDF ricordo da custodire per sempre.
        </p>
      </div>

      {/* Confronto piani */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>

        {/* Free */}
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: "24px 26px", opacity: 0.75 }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: C.muted, margin: "0 0 6px" }}>
            Piano attuale
          </p>
          <p style={{ fontSize: 24, fontWeight: 800, fontFamily: QS, color: C.onSurf, margin: "0 0 4px" }}>Free</p>
          <p style={{ fontSize: 32, fontWeight: 900, fontFamily: QS, color: C.muted, margin: "0 0 20px" }}>€0</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FREE_FEATURES.map((f) => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, color: f.ok ? C.green : C.muted, width: 18, textAlign: "center" }}>
                  {f.ok ? "✓" : "✗"}
                </span>
                <span style={{ fontSize: 13, color: f.ok ? C.onSurfV : C.muted, textDecoration: f.ok ? "none" : "line-through" }}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium */}
        <div style={{
          background: "linear-gradient(145deg, #1a1a2e 0%, #2d1a2e 100%)",
          border: "1.5px solid rgba(244,172,183,0.20)",
          borderRadius: 20, padding: "24px 26px",
          position: "relative", overflow: "hidden",
          boxShadow: "0 20px 60px rgba(135,78,88,0.25)",
        }}>
          {/* Bagliore decorativo */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,172,183,0.12), transparent 70%)", pointerEvents: "none" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: C.priLight, margin: 0 }}>
              ⭐ Premium
            </p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(212,175,55,0.18)", color: "#fde68a", border: "1px solid rgba(212,175,55,0.25)" }}>
              CONSIGLIATO
            </span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, fontFamily: QS, color: "#fff", margin: "0 0 4px" }}>Premium</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
            <span style={{ fontSize: 36, fontWeight: 900, fontFamily: QS, color: "#fff" }}>€2,99</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.50)" }}>/ evento</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PRO_FEATURES.map((f) => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: "rgba(245,234,237,0.90)" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Stripe */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #2d1a2e)", borderRadius: 20, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, fontFamily: QS, color: "#fff", margin: "0 0 6px" }}>
            Sblocca Premium ora
          </p>
          <p style={{ fontSize: 13, color: "rgba(245,234,237,0.65)", margin: 0 }}>
            Pagamento sicuro · Una tantum per evento · Nessun abbonamento
          </p>
        </div>
        <button
          type="button"
          disabled
          style={{
            padding: "14px 28px", borderRadius: 14, border: "none", cursor: "not-allowed",
            background: "linear-gradient(135deg, #b5352c, #874e58)",
            color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: VN,
            boxShadow: "0 8px 24px rgba(181,53,44,0.40)",
            opacity: 0.6, flexShrink: 0,
          }}
        >
          💳 Paga con Stripe — Presto
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>Hai un codice coupon?</span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* Coupon */}
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: "24px 28px" }}>
        <p style={{ fontSize: 15, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: "0 0 4px" }}>
          🎟️ Riscatta un codice
        </p>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px" }}>
          Se hai ricevuto un codice promozionale o di accesso anticipato, inseriscilo qui.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="es. BABY2025"
            maxLength={32}
            onKeyDown={(e) => e.key === "Enter" && handleCoupon()}
            style={{
              flex: 1, padding: "12px 18px", borderRadius: 12,
              border: `1.5px solid ${C.border}`, background: C.bg,
              fontSize: 15, fontFamily: VN, color: C.onSurf, outline: "none",
              letterSpacing: "0.06em", fontWeight: 600,
            }}
          />
          <button
            type="button"
            onClick={handleCoupon}
            disabled={loading || !coupon.trim()}
            style={{
              padding: "12px 22px", borderRadius: 12, border: "none",
              background: !coupon.trim() || loading ? C.muted : C.primary,
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: !coupon.trim() || loading ? "not-allowed" : "pointer",
              fontFamily: VN, flexShrink: 0,
            }}
          >
            {loading ? "…" : "Riscatta"}
          </button>
        </div>
        {msg && (
          <p style={{ fontSize: 13, marginTop: 10, fontWeight: 600, color: msg.startsWith("✓") ? C.green : "#b91c1c" }}>
            {msg}
          </p>
        )}
        <p style={{ fontSize: 11, color: C.muted, margin: "10px 0 0" }}>
          Il codice attiva Premium istantaneamente su tutto l&apos;account e tutti gli eventi.
        </p>
      </div>

      {/* FAQ rapida */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { q: "Premium vale per tutti gli eventi?", a: "Sì, il Premium si applica all'account. Tutti i tuoi FantaParto presenti e futuri diventano Premium." },
          { q: "È un abbonamento?", a: "No. Il prezzo è una tantum per evento — paghi una volta e non hai sorprese." },
          { q: "Posso tornare al piano Free?", a: "Sì, in qualsiasi momento tramite la Gestione Profilo. I dati rimangono sempre tuoi." },
        ].map((item) => (
          <div key={item.q} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.onSurf, margin: "0 0 4px" }}>{item.q}</p>
            <p style={{ fontSize: 13, color: C.onSurfV, margin: 0, lineHeight: 1.55 }}>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
