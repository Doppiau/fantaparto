import Link from "next/link";

const C = {
  bg:        "#fbf9f5",
  white:     "#ffffff",
  border:    "#e8e4e1",
  primary:   "#874e58",
  priLight:  "#f4acb7",
  priXLight: "#ffd9de",
  onPri:     "#733d47",
  secondary: "#40627b",
  secLight:  "#bee1ff",
  onSurf:    "#1b1c1a",
  onSurfVar: "#6b5b5d",
  muted:     "#b0a0a2",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

const FEATURES = [
  {
    icon: "🎯",
    title: "Pronostici social",
    desc: "Sesso, peso, data e ora del parto. Ogni invitato fa la sua previsione, senza registrarsi.",
  },
  {
    icon: "🏆",
    title: "Classifica automatica",
    desc: "Alla nascita inserisci i dati reali. Il sistema calcola i punteggi e genera la classifica finale.",
  },
  {
    icon: "📱",
    title: "Solo un link su WhatsApp",
    desc: "Nessuna app da scaricare per gli invitati. Apri il link, vota, chiudi. Fatto.",
  },
  {
    icon: "📄",
    title: "PDF ricordo",
    desc: "Un documento personalizzato con la classifica, i voti e i messaggi dei tuoi cari. Da conservare per sempre.",
  },
];

const HOW = [
  { n: "01", title: "Crea l'evento",      desc: "Configura le domande (sesso, peso, data…) e scrivi un messaggio di benvenuto." },
  { n: "02", title: "Condividi il link",  desc: "Invia il link su WhatsApp. Gli invitati votano dal browser, senza login." },
  { n: "03", title: "Aspetta la nascita", desc: "Quando nasce il bimbo, inserisci i dati reali e scopri chi ha vinto!" },
];

export default function LandingPage() {
  return (
    <div style={{ background: C.bg, fontFamily: VN, color: C.onSurf }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 40px", height: 64,
          borderBottom: `1px solid ${C.border}`, background: C.white,
          position: "sticky", top: 0, zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.priLight}, ${C.primary})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span style={{ color: C.white, fontWeight: 900, fontSize: 14, fontFamily: QS }}>F</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.primary, fontFamily: QS }}>
            FantaParto
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/login"
            style={{
              fontSize: 14, fontWeight: 600, color: C.onSurfVar,
              textDecoration: "none", padding: "6px 16px",
            }}
          >
            Accedi
          </Link>
          <Link
            href="/signup"
            style={{
              fontSize: 14, fontWeight: 700, color: C.white,
              background: C.primary, borderRadius: 999,
              padding: "8px 20px", textDecoration: "none",
              boxShadow: "0 4px 12px rgba(135,78,88,0.20)",
            }}
          >
            Inizia gratis
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "80px 40px 72px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: C.priXLight, border: `1px solid ${C.priLight}`,
            borderRadius: 999, padding: "4px 14px", marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 12 }}>🍼</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.onPri }}>
            Il fantacalcio della dolce attesa
          </span>
        </div>

        <h1
          style={{
            fontSize: 52, fontWeight: 700, lineHeight: 1.15,
            letterSpacing: "-0.03em", fontFamily: QS, color: C.onSurf,
            maxWidth: 700, margin: "0 auto 20px",
          }}
        >
          Fai indovinare la nascita ai tuoi cari
        </h1>

        <p
          style={{
            fontSize: 18, color: C.onSurfVar, lineHeight: 1.7,
            maxWidth: 520, margin: "0 auto 40px",
          }}
        >
          Crea il tuo FantaParto, condividi un link su WhatsApp e trasforma l&apos;attesa in un gioco che tutti ricorderanno.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/signup"
            style={{
              fontSize: 15, fontWeight: 700, color: C.white,
              background: C.primary, borderRadius: 999,
              padding: "14px 32px", textDecoration: "none",
              boxShadow: "0 8px 24px rgba(135,78,88,0.25)",
            }}
          >
            ✨ Crea il tuo FantaParto — è gratis
          </Link>
          <Link
            href="/login"
            style={{
              fontSize: 15, fontWeight: 600, color: C.onSurfVar,
              border: `1.5px solid ${C.border}`, borderRadius: 999,
              padding: "14px 28px", textDecoration: "none",
              background: C.white,
            }}
          >
            Già registrata? Accedi →
          </Link>
        </div>

        <p style={{ fontSize: 13, color: C.muted, marginTop: 20 }}>
          Gratis fino a 20 partecipanti · Nessuna carta richiesta
        </p>
      </section>

      {/* ── Features grid ──────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "0 40px 80px",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
        className="max-md:grid-cols-1"
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              background: C.white, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "28px 32px",
              display: "flex", flexDirection: "column", gap: 12,
            }}
          >
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: C.priXLight, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 22,
              }}
            >
              {f.icon}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>
              {f.title}
            </h3>
            <p style={{ fontSize: 14, color: C.onSurfVar, lineHeight: 1.65, margin: 0 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </section>

      {/* ── Come funziona ───────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
          background: C.white, padding: "72px 40px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p
            style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: C.muted, marginBottom: 12,
              textAlign: "center",
            }}
          >
            Come funziona
          </p>
          <h2
            style={{
              fontSize: 32, fontWeight: 700, fontFamily: QS, color: C.onSurf,
              textAlign: "center", marginBottom: 48, letterSpacing: "-0.02em",
            }}
          >
            Tre passi e sei pronta
          </h2>

          <div
            style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32,
            }}
            className="max-md:grid-cols-1"
          >
            {HOW.map((h, i) => (
              <div key={h.n} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontSize: 13, fontWeight: 800, color: C.primary,
                      fontFamily: QS, opacity: 0.5,
                    }}
                  >
                    {h.n}
                  </span>
                  {i < HOW.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: C.border }} className="hidden md:block" />
                  )}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>
                  {h.title}
                </h3>
                <p style={{ fontSize: 14, color: C.onSurfVar, lineHeight: 1.65, margin: 0 }}>
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA bottom ─────────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 600, margin: "80px auto",
          padding: "0 40px", textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 30, fontWeight: 700, fontFamily: QS, color: C.onSurf,
            marginBottom: 16, letterSpacing: "-0.02em",
          }}
        >
          Pronta a iniziare?
        </h2>
        <p style={{ fontSize: 16, color: C.onSurfVar, marginBottom: 32, lineHeight: 1.6 }}>
          Crea il tuo primo FantaParto in meno di 3 minuti. Gratis, nessuna carta richiesta.
        </p>
        <Link
          href="/signup"
          style={{
            fontSize: 15, fontWeight: 700, color: C.white,
            background: C.primary, borderRadius: 999,
            padding: "14px 40px", textDecoration: "none",
            boxShadow: "0 8px 24px rgba(135,78,88,0.25)",
            display: "inline-block",
          }}
        >
          ✨ Inizia gratis
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: `1px solid ${C.border}`, padding: "28px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: C.primary, fontFamily: QS }}>
          🍼 FantaParto
        </span>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy Policy", "Termini di Utilizzo", "Contatti"].map((l) => (
            <a key={l} href="#" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>
              {l}
            </a>
          ))}
        </div>
        <span style={{ fontSize: 13, color: C.muted }}>© 2026 FantaParto</span>
      </footer>
    </div>
  );
}
