"use client";

import { useState, useRef, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, signupAction, type AuthActionState } from "./actions";
import { createClient } from "@/lib/supabase/client";

/* ── Icons ──────────────────────────────────────────────────── */
function StorkMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
      <circle cx="20.5" cy="9" r="4" fill="#FF6B6B" />
      <circle cx="21.4" cy="8.3" r="0.95" fill="#FFFFFF" />
      <path d="M24 9 L31 7.4 L24 11 Z" fill="#FFD166" />
      <path d="M18.5 12.2 C16 15 16.5 18 13 19.2 C9 20.5 5 19 3 21.5" stroke="#FF6B6B" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M14.5 16.5 C12 15.5 9.5 16 8 18" stroke="#FF8787" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M12 19.6 L11 27 M14.5 19 L16 26.5" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.2 4.2L19 7" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Star() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M12 2.6l2.7 5.46 6.02.88-4.36 4.25 1.03 6L12 16.9 6.6 19.2l1.03-6L3.27 8.94l6.03-.88L12 2.6z" fill="#FFD166" />
    </svg>
  );
}

/* ── Dashboard preview ──────────────────────────────────────── */
function Preview() {
  return (
    <div className="preview">
      <div className="preview-head">
        <div className="preview-title">
          <span className="live-dot" />
          I pronostici dei tuoi cari
        </div>
        <div className="preview-pill">42 giocatori</div>
      </div>
      <div className="preview-grid">
        <div className="gender-card">
          <div className="mini-label">Maschio o femmina?</div>
          <div className="bubbles">
            <div className="bubble boy">
              <span className="pct">60%</span>
              <span className="who">Maschio</span>
            </div>
            <div className="bubble girl">
              <span className="pct">40%</span>
              <span className="who">Femmina</span>
            </div>
          </div>
        </div>
        <div className="weight-card">
          <div className="mini-label">Peso previsto</div>
          <div className="weight-value">3,2<span> kg</span></div>
          <div className="gauge">
            <div className="gauge-fill" />
            <div className="gauge-knob" />
          </div>
          <div className="gauge-scale"><span>2,5 kg</span><span>4,0 kg</span></div>
        </div>
      </div>
    </div>
  );
}

/* ── Submit button ──────────────────────────────────────────── */
function SubmitButton({ isSignup }: { isSignup: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`cta fredoka${pending ? " success" : ""}`} disabled={pending}>
      {pending ? "Un momento…" : isSignup ? "Crea il mio FantaParto 🚀" : "Accedi al mio FantaParto 🚀"}
    </button>
  );
}

/* ── Google OAuth ───────────────────────────────────────────── */
async function handleGoogleLogin() {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

/* ── Auth card ──────────────────────────────────────────────── */
function AuthCard({ initialTab }: { initialTab: "signup" | "login" }) {
  const [tab, setTab] = useState<"signup" | "login">(initialTab);
  const [showPw, setShowPw] = useState(false);
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const signupRef = useRef<HTMLButtonElement>(null);
  const loginRef = useRef<HTMLButtonElement>(null);
  const [ind, setInd] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tab === "signup" ? signupRef.current : loginRef.current;
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const initialState: AuthActionState = {};
  const [signupState, signupAction_] = useFormState(signupAction, initialState);
  const [loginState, loginAction_] = useFormState(loginAction, initialState);

  const isSignup = tab === "signup";
  const currentState = isSignup ? signupState : loginState;
  const currentAction = isSignup ? signupAction_ : loginAction_;

  const mark = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* Tabs */}
        <div className="tabs">
          <button ref={signupRef} className={`tab${isSignup ? " active" : ""}`} type="button" onClick={() => { setTab("signup"); setTouched({}); }}>
            Crea Account
          </button>
          <button ref={loginRef} className={`tab${!isSignup ? " active" : ""}`} type="button" onClick={() => { setTab("login"); setTouched({}); }}>
            Accedi
          </button>
          <div className="tab-indicator" style={{ left: ind.left, width: ind.width }} />
        </div>

        {/* Google */}
        <button type="button" className="gbtn" onClick={handleGoogleLogin}>
          <GoogleG />
          {isSignup ? "Registrati con Google" : "Accedi con Google"}
        </button>

        <div className="divider"><span>oppure con la tua email</span></div>

        {/* Form */}
        <form action={currentAction}>
          {isSignup && (
            <div className={`field${touched.nome ? "" : ""}`}>
              <label htmlFor="nome">Il tuo Nome / Soprannome</label>
              <div className="input-shell">
                <input id="nome" name="nome" type="text" placeholder="Mamma Giulia" onBlur={() => mark("nome")} />
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="email">La tua Email</label>
            <div className="input-shell">
              <input id="email" name="email" type="email" placeholder="giulia@esempio.it" onBlur={() => mark("email")} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-shell">
              <input
                id="password" name="password"
                type={showPw ? "text" : "password"}
                placeholder="Minimo 8 caratteri"
                onBlur={() => mark("pw")}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}>
                {showPw ? "Nascondi" : "Mostra"}
              </button>
            </div>
          </div>

          {isSignup && (
            <div className={`consent${consent ? " checked" : ""}`} onClick={() => setConsent((c) => !c)}>
              <div className="consent-box">{consent && <Check />}</div>
              <div className="consent-text">
                Accetto la Privacy Policy e acconsento a ricevere gli auguri alla nascita.
              </div>
            </div>
          )}

          {currentState.error && (
            <div style={{ fontSize: 13, color: "#E5484D", fontWeight: 500, marginBottom: 12, background: "#FFF0F0", borderRadius: 12, padding: "10px 14px" }}>
              ⚠ {currentState.error}
            </div>
          )}

          <SubmitButton isSignup={isSignup} />
        </form>

        <div className="foot-note">
          {isSignup ? (
            <>Hai già un account?{" "}
              <button type="button" onClick={() => setTab("login")}>Accedi qui</button>
            </>
          ) : (
            <>Non hai un account?{" "}
              <button type="button" onClick={() => setTab("signup")}>Crea il tuo FantaParto</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Full page ──────────────────────────────────────────────── */
export default function AuthPageClient({ initialTab }: { initialTab: "signup" | "login" }) {
  return (
    <>
      <div className="bg-blobs">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
      </div>
      <div className="auth-page">
        {/* Left column */}
        <div className="left-col">
          <div className="brand">
            <div className="brand-mark"><StorkMark /></div>
            <div className="brand-name fredoka">Fanta<span className="accent">Parto</span></div>
          </div>

          <h1 className="hook fredoka">Il fantacalcio della dolce attesa 🍼</h1>

          <p className="subtitle">
            Crea la tua sfida, personalizza le domande (peso, sesso, data, colore degli occhi)
            e lascia che amici e parenti facciano i loro pronostici. Chi indovinerà i dettagli della nascita?
          </p>

          <Preview />

          <div className="trust">
            <div className="stars">
              {[0,1,2,3,4].map((i) => <Star key={i} />)}
            </div>
            <div className="trust-text">
              Più di <b>15.000 mamme</b> hanno già giocato con i loro cari.
            </div>
          </div>
        </div>

        {/* Right column */}
        <AuthCard initialTab={initialTab} />
      </div>
    </>
  );
}
