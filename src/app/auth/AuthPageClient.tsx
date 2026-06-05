"use client";

import { useState, useRef, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, signupAction, type AuthActionState } from "./actions";
import { createClient } from "@/lib/supabase/client";

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        "#fbf9f5",
  white:     "#ffffff",
  border:    "#e8e4e1",
  primary:   "#874e58",
  priLight:  "#f4acb7",
  priXLight: "#ffd9de",
  onPri:     "#733d47",
  secondary: "#40627b",
  onSurf:    "#1b1c1a",
  onSurfVar: "#6b5b5d",
  muted:     "#b0a0a2",
  error:     "#b91c1c",
  errBg:     "#fef2f2",
  errBrd:    "#fecaca",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

// ── Helpers ───────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.2 4.2L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

async function handleGoogleLogin() {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

// ── Input field ───────────────────────────────────────────────────────────────

function Field({
  label, id, name, type = "text", placeholder, children,
}: {
  label: string; id: string; name: string; type?: string;
  placeholder?: string; children?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: C.onSurfVar, fontFamily: VN }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id} name={name} type={type} placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", outline: "none", boxSizing: "border-box",
            border: `1.5px solid ${focused ? C.primary : C.border}`,
            borderRadius: 999, padding: "12px 20px",
            fontSize: 14, fontFamily: VN, color: C.onSurf,
            background: C.white, transition: "border-color 150ms",
          }}
        />
        {children}
      </div>
    </div>
  );
}

// ── Submit button ─────────────────────────────────────────────────────────────

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: "100%", border: "none", outline: "none", cursor: pending ? "wait" : "pointer",
        background: pending ? C.muted : C.primary, color: C.white,
        borderRadius: 999, padding: "13px 24px",
        fontSize: 14, fontWeight: 700, fontFamily: VN,
        boxShadow: pending ? "none" : "0 4px 14px rgba(135,78,88,0.22)",
        transition: "all 150ms",
      }}
    >
      {pending ? "Un momento…" : label}
    </button>
  );
}

// ── Auth form card ────────────────────────────────────────────────────────────

function AuthCard({ initialTab }: { initialTab: "signup" | "login" }) {
  const [tab, setTab] = useState<"signup" | "login">(initialTab);
  const [showPw, setShowPw] = useState(false);
  const [consent, setConsent] = useState(false);
  const signupRef = useRef<HTMLButtonElement>(null);
  const loginRef  = useRef<HTMLButtonElement>(null);
  const [ind, setInd] = useState({ left: 4, width: 0 });

  useEffect(() => {
    const el = tab === "signup" ? signupRef.current : loginRef.current;
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const initial: AuthActionState = {};
  const [signupState, signupFn] = useFormState(signupAction, initial);
  const [loginState,  loginFn]  = useFormState(loginAction,  initial);

  const isSignup      = tab === "signup";
  const currentState  = isSignup ? signupState  : loginState;
  const currentAction = isSignup ? signupFn     : loginFn;

  return (
    <div
      style={{
        width: "100%", maxWidth: 400, margin: "0 auto",
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "32px 32px 28px",
        fontFamily: VN,
      }}
    >
      {/* Tab switcher */}
      <div
        style={{
          position: "relative", display: "flex", background: C.bg,
          borderRadius: 999, padding: 4, marginBottom: 28,
        }}
      >
        <div
          style={{
            position: "absolute", top: 4, borderRadius: 999,
            height: "calc(100% - 8px)", background: C.white,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            left: ind.left, width: ind.width,
            transition: "left 200ms ease, width 200ms ease",
          }}
        />
        {(["signup", "login"] as const).map((t) => (
          <button
            key={t}
            ref={t === "signup" ? signupRef : loginRef}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1, position: "relative", zIndex: 1,
              border: "none", background: "transparent", cursor: "pointer",
              padding: "8px 16px", borderRadius: 999,
              fontSize: 13, fontWeight: tab === t ? 700 : 500,
              color: tab === t ? C.onSurf : C.muted,
              transition: "color 150ms", fontFamily: VN,
            }}
          >
            {t === "signup" ? "Crea Account" : "Accedi"}
          </button>
        ))}
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10,
          border: `1.5px solid ${C.border}`, borderRadius: 999,
          background: C.white, cursor: "pointer",
          padding: "11px 20px", fontSize: 14, fontWeight: 600,
          color: C.onSurf, fontFamily: VN, marginBottom: 20,
          transition: "border-color 150ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.primary)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
      >
        <GoogleIcon />
        {isSignup ? "Registrati con Google" : "Accedi con Google"}
      </button>

      {/* Divider */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
        }}
      >
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontSize: 12, color: C.muted }}>oppure con email</span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* Form */}
      <form action={currentAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {isSignup && (
          <Field label="Il tuo Nome" id="nome" name="nome" placeholder="Mamma Giulia" />
        )}
        <Field label="Email" id="email" name="email" type="email" placeholder="giulia@esempio.it" />
        <Field label="Password" id="password" name="password" type={showPw ? "text" : "password"} placeholder="Minimo 8 caratteri">
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              border: "none", background: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, color: C.muted, fontFamily: VN,
            }}
          >
            {showPw ? "Nascondi" : "Mostra"}
          </button>
        </Field>

        {isSignup && (
          <div
            onClick={() => setConsent((c) => !c)}
            style={{
              display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                border: `1.5px solid ${consent ? C.primary : C.border}`,
                background: consent ? C.primary : C.white,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 150ms",
              }}
            >
              {consent && <CheckIcon />}
            </div>
            <p style={{ fontSize: 12, color: C.onSurfVar, lineHeight: 1.5 }}>
              Accetto la Privacy Policy e acconsento a ricevere gli auguri alla nascita.
            </p>
          </div>
        )}

        {currentState.error && (
          <div
            style={{
              background: C.errBg, border: `1px solid ${C.errBrd}`,
              borderRadius: 12, padding: "10px 14px",
              fontSize: 13, color: C.error, fontWeight: 500,
            }}
          >
            ⚠ {currentState.error}
          </div>
        )}

        <SubmitBtn label={isSignup ? "Crea il mio account →" : "Accedi →"} />
      </form>

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 20 }}>
        {isSignup ? "Hai già un account? " : "Non hai un account? "}
        <button
          type="button"
          onClick={() => setTab(isSignup ? "login" : "signup")}
          style={{
            border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 700, color: C.primary, fontFamily: VN,
          }}
        >
          {isSignup ? "Accedi" : "Registrati"}
        </button>
      </p>
    </div>
  );
}

// ── Full page ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: "🎯", text: "Pronostici su sesso, peso, data e ora" },
  { icon: "🏆", text: "Classifica automatica alla nascita" },
  { icon: "📄", text: "PDF ricordo da conservare per sempre" },
];

export default function AuthPageClient({ initialTab }: { initialTab: "signup" | "login" }) {
  return (
    <div
      style={{
        minHeight: "100vh", background: C.bg, fontFamily: VN,
        display: "flex", alignItems: "stretch",
      }}
    >
      {/* ── Left col ─────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "60px 64px", background: C.priXLight,
          borderRight: `1px solid ${C.border}`,
        }}
        className="hidden lg:flex"
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 12, overflow: "hidden",
              background: C.white, flexShrink: 0,
              boxShadow: "0 8px 20px rgba(135,78,88,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="FantaParto" width={44} height={44} style={{ display: "block" }} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.primary, fontFamily: QS }}>
            FantaParto
          </span>
        </div>

        <h1
          style={{
            fontSize: 36, fontWeight: 700, color: C.onSurf, fontFamily: QS,
            lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 16, maxWidth: 420,
          }}
        >
          Il fantacalcio della dolce attesa 🍼
        </h1>

        <p style={{ fontSize: 16, color: C.onSurfVar, lineHeight: 1.65, maxWidth: 380, marginBottom: 40 }}>
          Crea la tua sfida, condividi il link su WhatsApp e lascia che amici e parenti facciano i loro pronostici. Chi indovinerà la nascita?
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 48 }}>
          {FEATURES.map((f) => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: C.white, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 16,
                  boxShadow: "0 2px 8px rgba(135,78,88,0.10)",
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: C.onSurfVar }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 999, padding: "8px 16px",
            width: "fit-content",
          }}
        >
          <span style={{ fontSize: 14 }}>⭐️⭐️⭐️⭐️⭐️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurfVar }}>
            +15.000 mamme hanno già giocato
          </span>
        </div>
      </div>

      {/* ── Right col ────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "40px 32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Mobile brand */}
          <div
            className="lg:hidden"
            style={{ textAlign: "center", marginBottom: 32 }}
          >
            <span style={{ fontSize: 20, fontWeight: 700, color: C.primary, fontFamily: QS }}>
              🍼 FantaParto
            </span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: 24, fontWeight: 700, color: C.onSurf,
                fontFamily: QS, marginBottom: 4,
              }}
            >
              {initialTab === "signup" ? "Crea il tuo account" : "Bentornata!"}
            </h2>
            <p style={{ fontSize: 14, color: C.muted }}>
              {initialTab === "signup"
                ? "Inizia gratis, nessuna carta richiesta."
                : "Accedi per gestire i tuoi eventi."}
            </p>
          </div>

          <AuthCard initialTab={initialTab} />
        </div>
      </div>
    </div>
  );
}
