import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import CopyLinkButton from "@/components/dashboard/CopyLinkButton";

export const dynamic = "force-dynamic";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        "#faf8f5",
  white:     "#ffffff",
  border:    "#ede8e5",
  borderSoft:"#f2eeeb",
  primary:   "#b5352c",
  priLight:  "#f4acb7",
  priXL:     "#fde8e6",
  onPri:     "#7a1f18",
  sec:       "#40627b",
  secLight:  "#bee1ff",
  onSec:     "#255470",
  onSurf:    "#1a1a2e",
  onSurfV:   "#5a4e50",
  muted:     "#a89a9b",
  amber:     "#f59e0b",
  amberBg:   "#fef3c7",
  amberText: "#92400e",
  green:     "#16a34a",
  greenBg:   "#dcfce7",
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

// ── Mini components ───────────────────────────────────────────────────────────
function Bar({ pct, color, h = 6 }: { pct: number; color: string; h?: number }) {
  return (
    <div style={{ height: h, borderRadius: 999, background: C.borderSoft, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: 999, transition: "width 0.5s ease" }} />
    </div>
  );
}

function StatCard({ label, icon, children, accent = C.primary }: { label: string; icon: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 18, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: 0 }}>{label}</p>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
      </div>
      {children}
    </div>
  );
}

function QuickAction({ href, icon, label, accent = C.onSurfV, bg = C.white }: { href: string; icon: string; label: string; accent?: string; bg?: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: "14px 10px", borderRadius: 14, textDecoration: "none",
        background: bg, border: `1px solid ${C.border}`,
        transition: "all 150ms", flex: 1,
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: accent, textAlign: "center", lineHeight: 1.3 }}>{label}</span>
    </Link>
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
    prisma.user.findUnique({ where: { id: user.id }, select: { nome: true, isPremium: true } }),
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
  const isPremium    = dbUser?.isPremium ?? false;
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

  const dpp         = eventoAttivo ? new Date(eventoAttivo.dataPresuntaParto) : null;
  const giorni      = dpp ? calcolaGiorni(dpp) : 0;
  const sett        = settimana(giorni);
  const voti        = eventoAttivo?._count.predictions ?? 0;
  const maxVoti     = eventoAttivo?.isPremium ? null : 20;
  const pctVoti     = maxVoti ? Math.min(100, Math.round((voti / maxVoti) * 100)) : 0;
  const totSesso    = maschio + femmina;
  const pctM        = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 0;
  const pctF        = 100 - pctM;
  const urgente     = giorni <= 14 && giorni > 0;
  const nomeEvento  = eventoAttivo?.nomeBimbo ? `Baby ${eventoAttivo.nomeBimbo}` : "Il tuo FantaParto";
  const cvr         = eventoAttivo && eventoAttivo.visualizzazioniLink > 0
    ? Math.round((voti / eventoAttivo.visualizzazioniLink) * 100)
    : 0;

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
        <h1 style={{ fontSize: 18, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0, flex: 1 }}>
          Dashboard
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {eventoAttivo && (
            <>
              <Link
                href="/dashboard/nuovo-evento"
                style={{
                  fontSize: 12, fontWeight: 600, color: C.onSurfV,
                  border: `1px solid ${C.border}`, borderRadius: 999,
                  padding: "6px 14px", textDecoration: "none", background: C.white,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <span style={{ fontSize: 14 }}>+</span> Nuovo
              </Link>
              <CopyLinkButton codice={eventoAttivo.codiceCondivisione} />
            </>
          )}
        </div>
      </div>

      {/* ── Contenuto principale ─────────────────────────────────────────────── */}
      <div className="px-4 md:px-8" style={{ maxWidth: 1100, margin: "0 auto", paddingTop: 32, paddingBottom: 64 }}>

        {eventoAttivo === null ? (

          /* ─── EMPTY STATE ────────────────────────────────────────────────── */
          <EmptyState nomeMamma={nomeMamma} />

        ) : (

          /* ─── ACTIVE STATE ───────────────────────────────────────────────── */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ROW 1: Hero + Countdown */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px]" style={{ gap: 14 }}>

              {/* Hero */}
              <div style={{
                borderRadius: 20, padding: "28px 32px",
                background: `linear-gradient(135deg, #fde8e6 0%, #fff8f7 60%, ${C.bg} 100%)`,
                border: `1px solid ${C.priLight}55`,
                display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16,
              }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.primary, margin: "0 0 6px" }}>
                    👋 Bentornata, {nomeMamma}
                  </p>
                  <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: FR, color: C.onSurf, margin: "0 0 8px", lineHeight: 1.2 }}>
                    {nomeEvento}
                  </h2>
                  <p style={{ fontSize: 13, color: C.onSurfV, lineHeight: 1.6, maxWidth: 400, margin: 0 }}>
                    {voti === 0
                      ? "Nessun pronostico ancora. Condividi il link con amici e parenti!"
                      : `${voti} pronostic${voti === 1 ? "o ricevuto" : "i ricevuti"}${dpp ? ` · DPP ${formatDPP(dpp)}` : ""}`
                    }
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href={`/dashboard/${eventoAttivo.id}`} style={{
                    fontSize: 13, fontWeight: 700, color: C.white,
                    background: C.primary, borderRadius: 999,
                    padding: "10px 20px", textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(181,53,44,0.28)",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    Vedi dettagli →
                  </Link>
                  <CopyLinkButton codice={eventoAttivo.codiceCondivisione} />
                </div>
              </div>

              {/* Countdown */}
              <div style={{
                borderRadius: 20, padding: "24px 22px",
                background: urgente
                  ? "linear-gradient(135deg, #fecaca 0%, #fee2e2 100%)"
                  : `linear-gradient(135deg, ${C.amberBg} 0%, #fffbeb 100%)`,
                border: `1px solid ${urgente ? "#fca5a5" : "#fde68a"}`,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: urgente ? "#991b1b" : C.amberText, margin: 0 }}>
                  {urgente ? "⚡ Parto imminente!" : "Conto alla rovescia"}
                </p>
                <div style={{ margin: "10px 0" }}>
                  <p style={{ fontSize: 60, fontWeight: 900, lineHeight: 1, fontFamily: QS, color: urgente ? "#b91c1c" : C.amberText, margin: 0 }}>
                    {giorni}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: urgente ? "#b91c1c" : C.amberText, margin: "4px 0 0" }}>
                    giorni al parto
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ height: 6, borderRadius: 999, background: urgente ? "#fca5a522" : "#fde68a55", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 999, width: `${Math.min(100, Math.round((sett / 40) * 100))}%`, background: urgente ? "#ef4444" : C.amber }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: urgente ? "#b91c1c90" : C.amberText + "90" }}>Settimana {sett} / 40</span>
                    {dpp && <span style={{ fontSize: 10, color: urgente ? "#b91c1c90" : C.amberText + "90" }}>{formatDPP(dpp)}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: Quick actions */}
            <div className="grid grid-cols-4" style={{ gap: 10 }}>
              <QuickAction href={`/dashboard/${eventoAttivo.id}`}      icon="👥" label="Partecipanti"   />
              <QuickAction href="/dashboard/settings"                  icon="⚙️" label="Impostazioni"   />
              <QuickAction href="/dashboard/rivelazione"               icon="🎉" label="Grande Giorno"  accent={C.primary} bg={C.priXL} />
              <QuickAction href="/dashboard/eventi"                    icon="📋" label="Tutti gli eventi" />
            </div>

            {/* ROW 3: Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12 }}>

              {/* Pronostici */}
              <StatCard label="Pronostici" icon="🗳️">
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 8 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, fontFamily: QS, color: C.onSurf, lineHeight: 1 }}>{voti}</span>
                  {maxVoti && <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>/{maxVoti}</span>}
                </div>
                <Bar pct={maxVoti ? pctVoti : 100} color={pctVoti >= 90 && maxVoti ? "#ef4444" : C.primary} h={7} />
                {maxVoti
                  ? <p style={{ fontSize: 11, color: pctVoti >= 90 ? "#ef4444" : C.muted, margin: "5px 0 0" }}>{maxVoti - voti} posti rimasti</p>
                  : <p style={{ fontSize: 11, color: C.green, margin: "5px 0 0" }}>✓ Piano illimitato</p>
                }
              </StatCard>

              {/* Peso Medio */}
              <StatCard label="Peso Previsto" icon="⚖️">
                {mediaPeso ? (
                  <>
                    <p style={{ fontSize: 36, fontWeight: 900, fontFamily: QS, color: C.onSurf, lineHeight: 1, margin: "0 0 4px" }}>
                      {(mediaPeso / 1000).toFixed(2).replace(".", ",")}
                      <span style={{ fontSize: 16, fontWeight: 600, color: C.muted }}> kg</span>
                    </p>
                    <Bar pct={Math.round(((mediaPeso - 2500) / 2500) * 100)} color={C.sec} h={6} />
                    <p style={{ fontSize: 11, color: C.muted, margin: "5px 0 0" }}>media di {pesiValidi.length} voti</p>
                  </>
                ) : (
                  <p style={{ fontSize: 14, color: C.muted, margin: "8px 0 0" }}>Nessun voto ancora</p>
                )}
              </StatCard>

              {/* Sesso */}
              <StatCard label="Chi vincerà?" icon="👶">
                {totSesso > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.sec }}>💙 Maschio</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.sec }}>{pctM}%</span>
                      </div>
                      <Bar pct={pctM} color={C.sec} h={7} />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>🩷 Femmina</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.primary }}>{pctF}%</span>
                      </div>
                      <Bar pct={pctF} color={C.primary} h={7} />
                    </div>
                    <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{maschio}M · {femmina}F su {totSesso} voti</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 14, color: C.muted, margin: "8px 0 0" }}>Nessun voto sul sesso</p>
                )}
              </StatCard>

              {/* Visite */}
              <StatCard label="Visite Link" icon="👁️">
                <p style={{ fontSize: 36, fontWeight: 900, fontFamily: QS, color: C.onSurf, lineHeight: 1, margin: "0 0 8px" }}>
                  {eventoAttivo.visualizzazioniLink}
                </p>
                {eventoAttivo.visualizzazioniLink > 0 ? (
                  <>
                    <Bar pct={cvr} color={C.amber} h={6} />
                    <p style={{ fontSize: 11, color: C.muted, margin: "5px 0 0" }}>
                      {cvr}% conversione ({voti} voti)
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: 11, color: C.muted, margin: "5px 0 0" }}>Condividi il link!</p>
                )}
              </StatCard>
            </div>

            {/* ROW 4: Prossimi passi + PRO upsell / altri eventi */}
            <div className={`grid grid-cols-1 gap-4 ${(!isPremium || altriEventi.length > 0) ? "md:grid-cols-2" : ""}`} style={{ gap: 14 }}>

              {/* Prossimi passi */}
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 18, padding: "22px 24px" }}>
                <p style={{ fontSize: 14, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: "0 0 16px" }}>
                  📍 Prossimi passi
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { done: true,       label: "Evento creato",                    href: null },
                    { done: voti > 0,   label: "Primi pronostici ricevuti",        href: `${eventoAttivo.codiceCondivisione}` },
                    { done: voti >= 5,  label: "5+ partecipanti",                  href: `/dashboard/${eventoAttivo.id}` },
                    { done: false,      label: "Rivela il risultato dopo il parto",href: "/dashboard/rivelazione" },
                  ].map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        background: step.done ? C.green : C.borderSoft,
                        border: `2px solid ${step.done ? C.green : C.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: step.done ? "#fff" : C.muted,
                      }}>
                        {step.done ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: 13, color: step.done ? C.onSurfV : C.onSurf, textDecoration: step.done ? "line-through" : "none", flex: 1 }}>
                        {step.label}
                      </span>
                      {!step.done && step.href && (
                        <Link href={step.href} style={{ fontSize: 11, fontWeight: 700, color: C.primary, textDecoration: "none" }}>Vai →</Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* PRO upsell (se free) */}
              {!isPremium && (
                <div style={{
                  borderRadius: 18, padding: "22px 24px",
                  background: "linear-gradient(135deg, #1a1a2e 0%, #2d1a2e 100%)",
                  border: "1px solid rgba(244,172,183,0.15)",
                  display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16,
                }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f4acb7", margin: "0 0 8px" }}>
                      ⭐ PRO PLAN
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 700, fontFamily: QS, color: "#fff", margin: "0 0 10px" }}>
                      Sblocca tutto il potenziale
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[
                        "Partecipanti illimitati (ora max 20)",
                        "Domande personalizzate",
                        "PDF ricordo con grafica premium",
                        "Statistiche avanzate",
                      ].map((f) => (
                        <p key={f} style={{ fontSize: 12, color: "rgba(245,234,237,0.80)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: "#f4acb7" }}>✓</span> {f}
                        </p>
                      ))}
                    </div>
                  </div>
                  <Link
                    href="/dashboard/upgrade"
                    style={{
                      display: "block", textAlign: "center",
                      fontSize: 14, fontWeight: 700, color: "#fff",
                      background: "linear-gradient(135deg, #b5352c, #874e58)",
                      borderRadius: 12, padding: "12px 20px",
                      textDecoration: "none",
                      boxShadow: "0 6px 20px rgba(181,53,44,0.4)",
                    }}
                  >
                    Passa a Premium →
                  </Link>
                </div>
              )}

              {/* Altri eventi (se premium o no pro-banner) */}
              {(isPremium && altriEventi.length > 0) && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 18, padding: "22px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>Altri eventi</p>
                    <Link href="/dashboard/eventi" style={{ fontSize: 12, fontWeight: 600, color: C.primary, textDecoration: "none" }}>Vedi tutti →</Link>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {altriEventi.slice(0, 3).map((ev, i) => {
                      const g    = calcolaGiorni(new Date(ev.dataPresuntaParto));
                      const nome = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a";
                      const pals = [{ bg: C.priXL, color: C.primary }, { bg: C.secLight, color: C.sec }, { bg: C.amberBg, color: C.amberText }];
                      const pal  = pals[i % pals.length];
                      return (
                        <Link key={ev.id} href={`/dashboard/${ev.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: C.bg, textDecoration: "none" }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍼</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: C.onSurf, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nome}</p>
                            <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>{g > 0 ? `${g}g al parto` : "Concluso"}</p>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: pal.color, flexShrink: 0 }}>{ev._count.predictions} voti</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 48, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
            <span style={{ fontWeight: 700, color: C.primary, fontFamily: FR }}>FantaParto</span>
            {" "}· Crafted with care for new families.
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            {[["Privacy Policy", "#"], ["Termini di Servizio", "#"], ["Supporto", "#"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty State Component ──────────────────────────────────────────────────────
function EmptyState({ nomeMamma }: { nomeMamma: string }) {
  const QS = "var(--font-quicksand, sans-serif)";
  const VN = "var(--font-vietnam, sans-serif)";
  const FR = "var(--font-fredoka, sans-serif)";

  const steps = [
    { n: "1", icon: "🎨", title: "Crea il tuo evento", desc: "Scegli le domande per gli invitati: data, sesso, peso, ora e altro." },
    { n: "2", icon: "📲", title: "Condividi il link", desc: "Invia il link su WhatsApp. Gli amici votano dal browser, senza app." },
    { n: "3", icon: "🏆", title: "Rivela il vincitore", desc: "Dopo il parto inserisci i dati reali e il sistema calcola la classifica." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, paddingTop: 8 }}>

      {/* Hero card */}
      <div style={{
        width: "100%", maxWidth: 660,
        background: C.white, borderRadius: 24,
        border: `1px solid ${C.border}`,
        boxShadow: "0 12px 48px -12px rgba(181,53,44,0.12), 0 2px 8px -2px rgba(0,0,0,0.05)",
        padding: "52px 48px 44px",
        textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        {/* Illustration */}
        <div style={{ position: "relative", marginBottom: 24, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg, #fde8e6, #fff0ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, boxShadow: "0 8px 32px rgba(181,53,44,0.14)" }}>
            🍼
          </div>
          <span style={{ position: "absolute", top: -4, right: -8, fontSize: 20 }}>✨</span>
          <span style={{ position: "absolute", bottom: 4, left: -10, fontSize: 14 }}>🌸</span>
        </div>

        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.primary, margin: "0 0 10px" }}>
          Ciao {nomeMamma}!
        </p>
        <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: FR, color: C.onSurf, margin: "0 0 14px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
          Il tuo primo FantaParto<br />ti aspetta!
        </h2>
        <p style={{ fontSize: 14, color: C.onSurfV, lineHeight: 1.7, maxWidth: 400, margin: "0 0 32px" }}>
          Crea il tuo evento personalizzato, invita amici e parenti e scopri chi indovinerà i dettagli del grande giorno.
        </p>

        <Link
          href="/dashboard/nuovo-evento"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 15, fontWeight: 700, color: C.white,
            background: `linear-gradient(135deg, ${C.primary}, #e04a40)`,
            borderRadius: 14, padding: "14px 32px",
            textDecoration: "none",
            boxShadow: "0 8px 28px rgba(181,53,44,0.32)",
            marginBottom: 14,
            fontFamily: FR,
          }}
        >
          <span style={{ fontSize: 18 }}>+</span>
          Crea il tuo FantaParto
        </Link>
        <a href="#come-iniziare" style={{ fontSize: 13, fontWeight: 600, color: C.muted, textDecoration: "none" }}>
          Come funziona? →
        </a>
      </div>

      {/* Steps */}
      <div id="come-iniziare" style={{ width: "100%", maxWidth: 660 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, textAlign: "center", marginBottom: 16 }}>
          Come iniziare in 3 passi
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ background: C.white, borderRadius: 18, padding: "24px 20px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.priXL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Passo {s.n}
                </span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.onSurf, margin: 0, fontFamily: QS }}>{s.title}</p>
              <p style={{ fontSize: 13, color: C.onSurfV, margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ width: "100%", maxWidth: 660, gap: 12 }}>
        {[
          { icon: "🎯", title: "Pronostici social",     desc: "Sesso, peso, data, ora. Chi indovina vince.",     color: C.primary,   bg: C.priXL   },
          { icon: "🏆", title: "Classifica automatica", desc: "I punteggi calcolati alla nascita del bimbo.",    color: C.amberText, bg: C.amberBg },
          { icon: "📄", title: "PDF ricordo",            desc: "Un documento personalizzato da conservare.",      color: C.onSec,     bg: C.secLight },
        ].map((f) => (
          <div key={f.title} style={{ background: f.bg, borderRadius: 16, padding: "22px 20px", border: "1px solid rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 28, margin: "0 0 10px" }}>{f.icon}</p>
            <p style={{ fontSize: 14, fontWeight: 700, fontFamily: QS, color: f.color, margin: "0 0 5px" }}>{f.title}</p>
            <p style={{ fontSize: 12, color: C.onSurfV, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
