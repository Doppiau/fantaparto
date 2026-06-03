import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import CopyLinkButton from "@/components/dashboard/CopyLinkButton";

export const dynamic = "force-dynamic";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:       "#fef5f4",
  white:    "#ffffff",
  border:   "#f0e8e6",
  primary:  "#b5352c",
  priLight: "#f4acb7",
  priXL:    "#fde8e6",
  onPri:    "#7a1f18",
  sec:      "#40627b",
  secLight: "#bee1ff",
  onSec:    "#42647e",
  onSurf:   "#1a1a2e",
  onSurfV:  "#5a4e50",
  muted:    "#a89a9b",
  amberCard:"#fef3c7",
  amberText:"#92400e",
  amberAcc: "#f59e0b",
  cardBg:   "#ffffff",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";
const FR = "var(--font-fredoka, sans-serif)";

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcolaGiorni(d: Date) {
  return Math.max(0, Math.round((d.getTime() - Date.now()) / 86_400_000));
}
function settimana(giorni: number) {
  return Math.max(0, 40 - Math.ceil(giorni / 7));
}
function formatDPP(d: Date) {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

// ── Donut SVG ─────────────────────────────────────────────────────────────────
function Donut({ pct, label, sub, color }: { pct: number; label: string; sub: string; color: string }) {
  const r = 30; const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(1, pct / 100);
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke={C.border} strokeWidth="9" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 40 40)" />
      <text x="40" y="38" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.onSurf} fontFamily={QS}>{label}</text>
      <text x="40" y="52" textAnchor="middle" fontSize="8" fill={C.muted} fontFamily={VN}>{sub}</text>
    </svg>
  );
}

function Bar({ pct, color, h = 6 }: { pct: number; color: string; h?: number }) {
  return (
    <div style={{ height: h, borderRadius: 999, background: C.border, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: 999 }} />
    </div>
  );
}

type EventRow = {
  id: string; nomeBimbo: string | null; codiceCondivisione: string;
  stato: string; dataPresuntaParto: Date; isPremium: boolean;
  visualizzazioniLink: number; _count: { predictions: number };
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [dbUser, eventi] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { nome: true } }),
    prisma.event.findMany({
      where: { userId: user.id }, orderBy: { createdAt: "desc" },
      select: {
        id: true, nomeBimbo: true, codiceCondivisione: true,
        stato: true, dataPresuntaParto: true, isPremium: true,
        visualizzazioniLink: true, _count: { select: { predictions: true } },
      },
    }),
  ]);

  const nomeMamma    = dbUser?.nome ?? "Mamma";
  const eventoAttivo = eventi.find((e) => e.stato === "IN_CORSO") ?? eventi[0] ?? null;
  const altriEventi  = eventoAttivo ? eventi.filter((e) => e.id !== eventoAttivo.id) : [];

  const [maschio, femmina, predictions] = eventoAttivo
    ? await Promise.all([
        prisma.prediction.count({ where: { eventId: eventoAttivo.id, votoSesso: "MASCHIO" } }),
        prisma.prediction.count({ where: { eventId: eventoAttivo.id, votoSesso: "FEMMINA" } }),
        prisma.prediction.findMany({ where: { eventId: eventoAttivo.id }, select: { votoPeso: true } }),
      ])
    : [0, 0, []];

  const pesiValidi = predictions.map((p) => p.votoPeso).filter((p): p is number => p !== null);
  const mediaPeso  = pesiValidi.length > 0 ? pesiValidi.reduce((a, b) => a + b, 0) / pesiValidi.length : null;

  const dpp      = eventoAttivo ? new Date(eventoAttivo.dataPresuntaParto) : null;
  const giorni   = dpp ? calcolaGiorni(dpp) : 0;
  const sett     = settimana(giorni);
  const voti     = eventoAttivo?._count.predictions ?? 0;
  const maxVoti  = eventoAttivo?.isPremium ? null : 20;
  const pctVoti  = maxVoti ? Math.min(100, Math.round((voti / maxVoti) * 100)) : 0;
  const totSesso = maschio + femmina;
  const pctM     = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 0;
  const pctF     = 100 - pctM;
  const pesoPct  = mediaPeso ? Math.round(((mediaPeso - 2500) / 2500) * 100) : 0;
  const urgente  = giorni <= 14 && giorni > 0;
  const nomeEvento = eventoAttivo?.nomeBimbo ? `Baby ${eventoAttivo.nomeBimbo}` : "Il tuo FantaParto";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: VN }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div
        className="pl-16 pr-4 md:px-8"
        style={{
          position: "sticky", top: 0, zIndex: 40, height: 64,
          background: C.white, borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 16,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0, flex: 1 }}>
          Dashboard
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Bell */}
          <button style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            🔔
          </button>
          {/* Help */}
          <button style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.muted, fontFamily: QS }}>
            ?
          </button>
          {/* Share link — solo con evento attivo */}
          {eventoAttivo && (
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href="/dashboard/nuovo-evento"
                style={{
                  fontSize: 13, fontWeight: 600, color: C.onSurfV,
                  border: `1px solid ${C.border}`, borderRadius: 999,
                  padding: "7px 14px", textDecoration: "none", background: C.white,
                }}
              >
                + Nuovo
              </Link>
              <CopyLinkButton codice={eventoAttivo.codiceCondivisione} />
            </div>
          )}
        </div>
      </div>

      {/* ── Contenuto principale ─────────────────────────────────────────────── */}
      <div className="px-4 md:px-8" style={{ maxWidth: 1120, margin: "0 auto", paddingTop: 36, paddingBottom: 64 }}>

        {eventoAttivo === null ? (

          /* ─── EMPTY STATE ─────────────────────────────────────────────────── */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16 }}>

            <div style={{
              width: "100%", maxWidth: 700,
              background: C.white,
              borderRadius: 24,
              border: `1px solid ${C.border}`,
              boxShadow: "0 8px 40px -12px rgba(181,53,44,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)",
              padding: "64px 48px",
              textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
            }}>

              {/* Illustration */}
              <div style={{ marginBottom: 28, position: "relative", display: "inline-block" }}>
                <span style={{ fontSize: 18, position: "absolute", top: -8, left: -12 }}>✨</span>
                <span style={{ fontSize: 90, lineHeight: 1, display: "block" }}>🍼</span>
                <span style={{ fontSize: 14, position: "absolute", top: 4, right: -14 }}>✨</span>
                <span style={{ fontSize: 10, position: "absolute", bottom: 0, right: -8 }}>✦</span>
              </div>

              {/* Heading */}
              <h2 style={{
                fontSize: 30, fontWeight: 700, fontFamily: FR,
                color: C.onSurf, margin: "0 0 14px", lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}>
                Il tuo primo FantaParto<br />ti aspetta!
              </h2>

              {/* Description */}
              <p style={{
                fontSize: 15, color: C.onSurfV, lineHeight: 1.65,
                maxWidth: 420, margin: "0 0 36px",
              }}>
                Inizia a creare il tuo evento personalizzato, invita amici e
                parenti e scopri chi indovinerà i dettagli del grande giorno.
              </p>

              {/* CTA */}
              <Link
                href="/dashboard/nuovo-evento"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontSize: 16, fontWeight: 700, color: C.white,
                  background: C.primary,
                  borderRadius: 14, padding: "14px 32px",
                  textDecoration: "none",
                  boxShadow: "0 8px 24px rgba(181,53,44,0.30)",
                  marginBottom: 16,
                  fontFamily: FR,
                }}
              >
                <span style={{ fontSize: 18 }}>+</span>
                Crea il tuo FantaParto
              </Link>

              {/* Secondary link */}
              <a
                href="#come-funziona"
                style={{ fontSize: 14, fontWeight: 600, color: C.muted, textDecoration: "none" }}
              >
                Guarda come funziona →
              </a>
            </div>

            {/* Come funziona — 3 cards */}
            <div
              id="come-funziona"
              className="grid grid-cols-1 md:grid-cols-3"
              style={{ width: "100%", marginTop: 40, gap: 16 }}
            >
              {[
                { icon: "🎯", title: "Pronostici social",      desc: "Sesso, peso, data, ora. Chi indovina vince.",      color: "#c44a40", bg: "#fde8e6" },
                { icon: "🏆", title: "Classifica automatica",  desc: "I punteggi si calcolano alla nascita del bimbo.",  color: "#92400e", bg: "#fef3c7" },
                { icon: "📄", title: "PDF ricordo",            desc: "Un documento personalizzato da conservare.",        color: "#1e40af", bg: "#dbeafe" },
              ].map((f) => (
                <div key={f.title} style={{
                  background: f.bg, borderRadius: 18, padding: "28px 24px",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}>
                  <p style={{ fontSize: 32, margin: "0 0 12px" }}>{f.icon}</p>
                  <p style={{ fontSize: 15, fontWeight: 700, fontFamily: QS, color: f.color, margin: "0 0 6px" }}>{f.title}</p>
                  <p style={{ fontSize: 13, color: C.onSurfV, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

        ) : (

          /* ─── ACTIVE STATE ────────────────────────────────────────────────── */
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* ROW 1: Hero + Countdown */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px]" style={{ gap: 14 }}>

              <div style={{
                borderRadius: 20, padding: "32px 36px",
                background: `linear-gradient(135deg, #fde8e6 0%, #fff5f4 55%, ${C.bg} 100%)`,
                border: `1px solid ${C.priLight}50`,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: FR, color: C.primary, margin: "0 0 10px", lineHeight: 1.2 }}>
                    Bentornata, {nomeMamma}! 🍼
                  </h2>
                  <p style={{ fontSize: 14, color: C.onSurfV, lineHeight: 1.65, maxWidth: 420, margin: 0 }}>
                    <strong>{nomeEvento}</strong> ha ricevuto{" "}
                    <strong>{voti} pronostic{voti === 1 ? "o" : "i"}</strong>.
                    {dpp && ` La DPP è il ${formatDPP(dpp)}.`}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
                  <Link href={`/dashboard/${eventoAttivo.id}`} style={{
                    fontSize: 13, fontWeight: 700, color: C.white,
                    background: C.primary, borderRadius: 999,
                    padding: "10px 22px", textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(181,53,44,0.30)",
                  }}>
                    Vai alla dashboard →
                  </Link>
                  <CopyLinkButton codice={eventoAttivo.codiceCondivisione} />
                </div>
              </div>

              <div style={{
                borderRadius: 20, padding: "28px 24px",
                background: urgente
                  ? `linear-gradient(135deg, #fecaca 0%, #fee2e2 100%)`
                  : `linear-gradient(135deg, ${C.amberCard} 0%, #fffbeb 100%)`,
                border: `1px solid ${urgente ? "#fca5a5" : "#fde68a"}`,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: urgente ? "#991b1b" : C.amberText, margin: 0 }}>
                  {urgente ? "⚡ Parto imminente!" : "Giorni al parto"}
                </p>
                <div style={{ margin: "12px 0" }}>
                  <p style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, fontFamily: QS, color: urgente ? "#b91c1c" : C.amberText, margin: 0 }}>
                    {giorni}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: urgente ? "#b91c1c" : C.amberText, margin: "6px 0 0" }}>
                    giorni rimasti
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: urgente ? "#b91c1c" : C.amberAcc, color: C.white }}>
                    {urgente ? "PRESTO!" : `Sett. ${sett}`}
                  </span>
                  {dpp && <p style={{ fontSize: 11, color: urgente ? "#b91c1c90" : C.amberText + "90", margin: "6px 0 0" }}>{formatDPP(dpp)}</p>}
                </div>
              </div>
            </div>

            {/* ROW 2: Stats 4 cards */}
            <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12 }}>

              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: "0 0 12px" }}>Total Votes</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 8 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, fontFamily: QS, color: C.onSurf, lineHeight: 1 }}>{voti}</span>
                  {maxVoti && <span style={{ fontSize: 16, fontWeight: 600, color: C.muted }}>/{maxVoti}</span>}
                </div>
                <Bar pct={pctVoti} color={C.primary} h={7} />
                {maxVoti && <p style={{ fontSize: 11, color: C.muted, margin: "6px 0 0" }}>⏰ {maxVoti - voti} posti rimasti</p>}
              </div>

              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: "0 0 10px" }}>Avg Weight</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                  {mediaPeso
                    ? <Donut pct={pesoPct} label={(mediaPeso / 1000).toFixed(1)} sub="kg" color={C.primary} />
                    : <p style={{ fontSize: 13, color: C.muted }}>—</p>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 4 }}>
                  <span>2 kg</span><span>5 kg</span>
                </div>
              </div>

              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: "0 0 14px" }}>Team Challenge</p>
                {totSesso > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.sec }}>💙 Maschio</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.sec }}>{pctM}%</span>
                      </div>
                      <Bar pct={pctM} color={C.sec} h={8} />
                      <p style={{ fontSize: 10, color: C.muted, margin: "3px 0 0" }}>{maschio} voti</p>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>🩷 Femmina</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.primary }}>{pctF}%</span>
                      </div>
                      <Bar pct={pctF} color={C.primary} h={8} />
                      <p style={{ fontSize: 10, color: C.muted, margin: "3px 0 0" }}>{femmina} voti</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: C.muted }}>Nessun voto sul sesso</p>
                )}
              </div>

              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: "0 0 12px" }}>Visite Link</p>
                <p style={{ fontSize: 40, fontWeight: 900, fontFamily: QS, color: C.onSurf, lineHeight: 1, margin: "0 0 8px" }}>{eventoAttivo.visualizzazioniLink}</p>
                <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px" }}>aperture del link</p>
                {eventoAttivo.visualizzazioniLink > 0 && voti > 0 && (
                  <>
                    <Bar pct={Math.round((voti / eventoAttivo.visualizzazioniLink) * 100)} color={C.amberAcc} h={6} />
                    <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                      {Math.round((voti / eventoAttivo.visualizzazioniLink) * 100)}% conversione
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* ROW 3: Altri eventi + Partecipazione */}
            <div className={`grid grid-cols-1 gap-4 ${altriEventi.length > 0 ? "md:grid-cols-2" : ""}`} style={{ gap: 14 }}>
              {altriEventi.length > 0 && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>Active Pools</p>
                    <span style={{ fontSize: 13 }}>🚀</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {altriEventi.slice(0, 3).map((ev, i) => {
                      const g = calcolaGiorni(new Date(ev.dataPresuntaParto));
                      const nome = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a";
                      const pals = [{ bg: C.priXL, color: C.primary }, { bg: C.secLight, color: C.sec }, { bg: C.amberCard, color: C.amberText }];
                      const pal = pals[i % pals.length];
                      return (
                        <Link key={ev.id} href={`/dashboard/${ev.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: C.bg, textDecoration: "none" }}>
                          <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍼</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: C.onSurf, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nome}</p>
                            <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>{g > 0 ? `${g} giorni rimasti` : "Concluso"}</p>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: pal.color }}>{ev._count.predictions} voti</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ borderRadius: 16, padding: "24px 28px", background: `linear-gradient(135deg, ${C.priXL} 0%, #ffe8e6 100%)`, border: `1px solid ${C.priLight}60` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: "0 0 2px" }}>Partecipazione</p>
                    <p style={{ fontSize: 12, color: C.onSurfV, margin: 0 }}>{maxVoti ? `${voti}/${maxVoti} posti` : `${voti} voti totali`}</p>
                  </div>
                  <Link href={`/dashboard/${eventoAttivo.id}`} style={{ fontSize: 12, fontWeight: 700, color: C.primary, textDecoration: "none" }}>Vedi classifica →</Link>
                </div>
                <div style={{ margin: "16px 0 8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurfV }}>{voti} partecipanti</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{maxVoti ? `${voti}/${maxVoti}` : `${voti} voti`}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: "rgba(181,53,44,0.12)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 999, width: `${maxVoti ? pctVoti : Math.min(100, voti * 5)}%`, background: `linear-gradient(to right, ${C.primary}, ${C.priLight})` }} />
                  </div>
                </div>
                {maxVoti && <p style={{ fontSize: 11, color: C.onSurfV, margin: 0 }}>{pctVoti >= 100 ? "🎉 Al completo! Passa a Premium." : `${maxVoti - voti} posti disponibili`}</p>}
              </div>
            </div>

          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div style={{
          marginTop: 56, paddingTop: 20,
          borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 8,
        }}>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
            <span style={{ fontWeight: 700, color: C.primary, fontFamily: FR }}>FantaParto</span>
            {" "}© 2024 FantaParto. Sculpted with care.
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy", "Terms", "Support"].map((l) => (
              <a key={l} href="#" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
