import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import CopyLinkButton from "@/components/dashboard/CopyLinkButton";

export const dynamic = "force-dynamic";

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  surface:       "#fbf9f5",
  surfContLow:   "#f5f3ef",
  surfCont:      "#efeeea",
  surfContHigh:  "#eae8e4",
  white:         "#ffffff",
  primary:       "#874e58",
  primaryCont:   "#f4acb7",
  primaryFixed:  "#ffd9de",
  onPriCont:     "#733d47",
  secondary:     "#40627b",
  secCont:       "#bee1ff",
  onSecCont:     "#42647e",
  onSurf:        "#1b1c1a",
  onSurfVar:     "#514345",
  outlineVar:    "#d6c2c3",
  shadow:        "0px 12px 32px rgba(135,78,88,0.08)",
  shadowSec:     "0px 8px 24px rgba(64,98,123,0.07)",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcolaGiorni(dpp: Date) {
  return Math.max(0, Math.round((dpp.getTime() - Date.now()) / 86_400_000));
}
function formatDPP(d: Date) {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

// ── Componenti server-side inline ─────────────────────────────────────────────

function FeatureCard({
  icon, title, desc, accent,
}: { icon: string; title: string; desc: string; accent: string }) {
  return (
    <div
      className="rounded-[2rem] p-6 flex flex-col gap-3"
      style={{ background: accent, boxShadow: C.shadow }}
    >
      <span className="text-3xl leading-none">{icon}</span>
      <h3 className="text-[17px] font-bold leading-snug" style={{ fontFamily: QS, color: C.onSurf }}>
        {title}
      </h3>
      <p className="text-[13px] font-normal leading-relaxed" style={{ color: C.onSurfVar }}>
        {desc}
      </p>
    </div>
  );
}

function StepBadge({ n, label, desc }: { n: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[15px] font-black"
        style={{ background: C.primaryFixed, color: C.primary, fontFamily: QS }}
      >
        {n}
      </div>
      <div className="pt-0.5">
        <p className="text-[15px] font-bold" style={{ color: C.onSurf, fontFamily: QS }}>{label}</p>
        <p className="text-[13px] font-normal mt-0.5" style={{ color: C.onSurfVar }}>{desc}</p>
      </div>
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: C.surfContHigh }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, background: color, transition: "width 600ms ease" }}
      />
    </div>
  );
}

// ── Stato attivo — card evento principale ─────────────────────────────────────

type EventoCard = {
  id: string;
  nomeBimbo: string | null;
  codiceCondivisione: string;
  stato: string;
  dataPresuntaParto: Date;
  isPremium: boolean;
  visualizzazioniLink: number;
  _count: { predictions: number };
};

function EventoFeatured({
  ev, maschio, femmina,
}: { ev: EventoCard; maschio: number; femmina: number }) {
  const dpp      = new Date(ev.dataPresuntaParto);
  const giorni   = calcolaGiorni(dpp);
  const voti     = ev._count.predictions;
  const maxVoti  = ev.isPremium ? null : 20;
  const pctVoti  = maxVoti ? Math.min(100, Math.round((voti / maxVoti) * 100)) : 0;
  const totSesso = maschio + femmina;
  const pctM     = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 0;
  const pctF     = totSesso > 0 ? Math.round((femmina / totSesso) * 100) : 0;
  const nomeEvento = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a in arrivo";

  const statoStyle =
    ev.stato === "IN_CORSO"
      ? { bg: "rgba(52,199,89,0.1)", color: "#15803d", dot: "#15803d" }
      : ev.stato === "PRONTO_RIVELAZIONE"
      ? { bg: "rgba(251,191,36,0.12)", color: "#d97706", dot: "#d97706" }
      : { bg: C.primaryFixed, color: C.primary, dot: C.primary };

  const statoLabel =
    ev.stato === "IN_CORSO" ? "In corso" : ev.stato === "PRONTO_RIVELAZIONE" ? "In rivelazione" : "Concluso";

  return (
    <div
      className="rounded-[2rem] overflow-hidden"
      style={{ background: C.white, boxShadow: C.shadow }}
    >
      {/* Top accent bar */}
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(to right, ${C.primary}, ${C.primaryCont}, ${C.secCont})` }}
      />

      <div className="p-8 flex flex-col xl:flex-row gap-8">

        {/* ── Colonna sinistra — identità evento ── */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
              style={{ background: statoStyle.bg, color: statoStyle.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: statoStyle.dot }}
              />
              {statoLabel}
            </span>
            {ev.isPremium && (
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{ background: "#ffd9de", color: "#6b3741" }}
              >
                ✨ Premium
              </span>
            )}
          </div>

          <div>
            <h2
              className="text-[26px] font-bold leading-tight"
              style={{ fontFamily: QS, color: C.onSurf }}
            >
              {nomeEvento}
            </h2>
            <p className="text-[13px] font-medium mt-1" style={{ color: C.onSurfVar }}>
              DPP: {formatDPP(dpp)}
            </p>
          </div>

          {/* Countdown */}
          <div
            className="flex items-center gap-5 rounded-[1.5rem] p-5"
            style={{ background: C.primaryFixed }}
          >
            <div className="text-center">
              <p
                className="text-[56px] font-black leading-none"
                style={{ fontFamily: QS, color: C.primary }}
              >
                {giorni}
              </p>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mt-1"
                style={{ color: C.onPriCont }}
              >
                giorni al parto
              </p>
            </div>
            <div className="w-px h-16 flex-shrink-0" style={{ background: C.primaryCont }} />
            <div className="text-center">
              <p
                className="text-[32px] font-bold leading-none"
                style={{ fontFamily: QS, color: C.secondary }}
              >
                {Math.round(40 - Math.ceil(giorni / 7))}
              </p>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mt-1"
                style={{ color: C.onPriCont }}
              >
                settimana
              </p>
            </div>
            <div className="w-px h-16 flex-shrink-0" style={{ background: C.primaryCont }} />
            <div className="text-center">
              <p
                className="text-[32px] font-bold leading-none"
                style={{ fontFamily: QS, color: C.onSurf }}
              >
                {ev.visualizzazioniLink}
              </p>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mt-1"
                style={{ color: C.onPriCont }}
              >
                visite link
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/dashboard/${ev.id}`}
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-semibold text-white transition-all active:scale-95 hover:opacity-90"
              style={{ background: C.primary, boxShadow: "0 8px 24px rgba(135,78,88,0.22)", fontFamily: VN }}
            >
              Apri dashboard →
            </Link>
            <CopyLinkButton codice={ev.codiceCondivisione} />
          </div>
        </div>

        {/* ── Colonna destra — dati & stats ── */}
        <div
          className="xl:w-72 flex flex-col gap-5 rounded-[1.5rem] p-6"
          style={{ background: C.surfContLow }}
        >
          {/* Voti */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: C.onSurfVar }}>
                Voti ricevuti
              </p>
              {maxVoti && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: C.primaryFixed, color: C.primary }}
                >
                  {pctVoti}%
                </span>
              )}
            </div>
            <p className="text-[28px] font-bold mb-2" style={{ fontFamily: QS, color: C.secondary }}>
              {voti}
              {maxVoti && (
                <span className="text-[16px] font-semibold ml-1" style={{ color: C.onSurfVar }}>
                  /{maxVoti}
                </span>
              )}
            </p>
            {maxVoti && (
              <ProgressBar
                pct={pctVoti}
                color={`linear-gradient(to right, ${C.primary}, ${C.primaryCont})`}
              />
            )}
          </div>

          <div className="h-px" style={{ background: C.outlineVar }} />

          {/* Team challenge */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: C.onSurfVar }}>
              Team Challenge
            </p>
            <div className="flex flex-col gap-2.5">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[13px] font-semibold" style={{ color: C.secondary }}>
                    🔵 Team Azzurro
                  </span>
                  <span className="text-[13px] font-bold" style={{ color: C.secondary }}>
                    {pctM}%
                  </span>
                </div>
                <ProgressBar pct={pctM} color={C.secondary} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[13px] font-semibold" style={{ color: C.primary }}>
                    🌸 Team Rosa
                  </span>
                  <span className="text-[13px] font-bold" style={{ color: C.primary }}>
                    {pctF}%
                  </span>
                </div>
                <ProgressBar pct={pctF} color={C.primary} />
              </div>
            </div>
            {totSesso === 0 && (
              <p className="text-[12px] mt-2" style={{ color: C.outlineVar }}>
                Nessun voto sul sesso ancora
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Evento secondario (card compatta) ─────────────────────────────────────────

function EventoSmall({ ev }: { ev: EventoCard }) {
  const giorni     = calcolaGiorni(new Date(ev.dataPresuntaParto));
  const isConcluso = ev.stato === "CONCLUSO";
  const nome       = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a in arrivo";
  return (
    <Link
      href={`/dashboard/${ev.id}`}
      className="block rounded-[1.5rem] p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1"
      style={{ background: C.white, boxShadow: C.shadow, textDecoration: "none" }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[16px] font-bold" style={{ fontFamily: QS, color: C.onSurf }}>
          {nome}
        </p>
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={
            isConcluso
              ? { background: C.surfContHigh, color: C.onSurfVar }
              : { background: "rgba(52,199,89,0.1)", color: "#15803d" }
          }
        >
          {isConcluso ? "Concluso" : "● Attivo"}
        </span>
      </div>
      <div className="flex gap-4" style={{ color: C.onSurfVar }}>
        <div className="text-center">
          <p className="text-[20px] font-bold" style={{ fontFamily: QS, color: isConcluso ? C.onSurfVar : C.primary }}>
            {isConcluso ? "✓" : giorni}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wide">{isConcluso ? "Chiuso" : "Giorni"}</p>
        </div>
        <div className="w-px self-stretch" style={{ background: C.outlineVar }} />
        <div className="text-center">
          <p className="text-[20px] font-bold" style={{ fontFamily: QS, color: C.secondary }}>
            {ev._count.predictions}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wide">Voti</p>
        </div>
      </div>
      <p className="text-[11px] font-medium" style={{ color: C.outlineVar }}>
        #{ev.codiceCondivisione}
      </p>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [dbUser, eventi] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { nome: true } }),
    prisma.event.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, nomeBimbo: true, codiceCondivisione: true,
        stato: true, dataPresuntaParto: true, isPremium: true,
        visualizzazioniLink: true,
        _count: { select: { predictions: true } },
      },
    }),
  ]);

  const nomeMamma   = dbUser?.nome ?? "Mamma";
  const eventoAttivo = eventi.find((e) => e.stato === "IN_CORSO") ?? eventi[0] ?? null;
  const altriEventi  = eventoAttivo ? eventi.filter((e) => e.id !== eventoAttivo.id) : [];
  const totVoti      = eventi.reduce((a, e) => a + e._count.predictions, 0);

  const [maschio, femmina] = eventoAttivo
    ? await Promise.all([
        prisma.prediction.count({ where: { eventId: eventoAttivo.id, votoSesso: "MASCHIO" } }),
        prisma.prediction.count({ where: { eventId: eventoAttivo.id, votoSesso: "FEMMINA" } }),
      ])
    : [0, 0];

  const ora = new Date().getHours();
  const saluto = ora < 12 ? "Buongiorno" : ora < 18 ? "Buon pomeriggio" : "Buonasera";

  return (
    <div className="min-h-screen" style={{ background: C.surface, fontFamily: VN }}>
      <div className="px-8 py-8 max-w-[1200px]">

        {/* ── Hero header ──────────────────────────────────────────────────── */}
        <header
          className="relative rounded-[2rem] overflow-hidden mb-8 p-8"
          style={{
            background: `linear-gradient(135deg, ${C.primaryFixed} 0%, ${C.white} 50%, ${C.secCont}55 100%)`,
            border: `1px solid ${C.outlineVar}40`,
          }}
        >
          {/* Decorative blobs */}
          <div
            className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-20 pointer-events-none"
            style={{ background: C.primaryCont }}
          />
          <div
            className="absolute -bottom-10 right-24 w-32 h-32 rounded-full opacity-10 pointer-events-none"
            style={{ background: C.secCont }}
          />

          <div className="relative flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: C.onSurfVar }}
              >
                Il tuo portale
              </p>
              <h1
                className="text-[34px] font-bold leading-tight"
                style={{ fontFamily: QS, color: C.onSurf, letterSpacing: "-0.02em" }}
              >
                {saluto}, {nomeMamma}! 👋
              </h1>
              <p className="text-[15px] font-normal mt-1 max-w-sm" style={{ color: C.onSurfVar }}>
                {eventoAttivo
                  ? "Tutto sotto controllo. Ecco i dati aggiornati del tuo evento."
                  : "Crea il tuo primo FantaParto e inizia il conto alla rovescia."}
              </p>
            </div>

            {/* Stat pills */}
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="text-center rounded-[1.25rem] px-5 py-3"
                style={{ background: C.white, boxShadow: C.shadow }}
              >
                <p className="text-[26px] font-bold leading-none" style={{ fontFamily: QS, color: C.primary }}>
                  {eventi.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: C.onSurfVar }}>
                  Event{eventi.length === 1 ? "o" : "i"}
                </p>
              </div>
              <div
                className="text-center rounded-[1.25rem] px-5 py-3"
                style={{ background: C.white, boxShadow: C.shadow }}
              >
                <p className="text-[26px] font-bold leading-none" style={{ fontFamily: QS, color: C.secondary }}>
                  {totVoti}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: C.onSurfVar }}>
                  Voti totali
                </p>
              </div>

              {!eventoAttivo && (
                <Link
                  href="/dashboard/nuovo-evento"
                  className="flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-all active:scale-95 hover:opacity-90"
                  style={{ background: C.primary, boxShadow: "0 12px 32px rgba(135,78,88,0.22)", fontFamily: VN }}
                >
                  ✨ Crea evento
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* ── Contenuto principale ─────────────────────────────────────────── */}
        {eventoAttivo === null ? (

          /* ─── EMPTY STATE ─── */
          <div className="flex flex-col gap-8">

            {/* Features grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FeatureCard
                icon="🎯"
                title="Pronostici social"
                desc="I tuoi cari votano sesso, peso, data e ora del parto. Chi si avvicina di più vince!"
                accent={C.primaryFixed}
              />
              <FeatureCard
                icon="🏆"
                title="Classifica automatica"
                desc="Al momento della nascita il sistema calcola i punteggi e genera la classifica finale."
                accent={C.secCont}
              />
              <FeatureCard
                icon="📄"
                title="PDF ricordo"
                desc="Un PDF personalizzato con la classifica e i momenti più belli dell'attesa."
                accent={C.surfContHigh}
              />
            </div>

            {/* Come funziona */}
            <div
              className="rounded-[2rem] p-8"
              style={{ background: C.white, boxShadow: C.shadow }}
            >
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-6"
                style={{ color: C.onSurfVar }}
              >
                Come funziona
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <StepBadge
                  n="1"
                  label="Crea il tuo FantaParto"
                  desc="Configura i pronostici e personalizza il messaggio di benvenuto."
                />
                <StepBadge
                  n="2"
                  label="Condividi il link"
                  desc="Invia il link su WhatsApp ai tuoi cari — nessuna registrazione richiesta."
                />
                <StepBadge
                  n="3"
                  label="Scopri chi ha vinto!"
                  desc="Inserisci i dati reali del bambino e il sistema calcola tutto automaticamente."
                />
              </div>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/dashboard/nuovo-evento"
                  className="flex items-center gap-2 rounded-full px-10 py-3.5 text-[15px] font-bold text-white transition-all active:scale-95 hover:opacity-90"
                  style={{
                    background: C.primary,
                    boxShadow: "0 12px 32px rgba(135,78,88,0.25)",
                    fontFamily: VN,
                  }}
                >
                  ✨ Crea il tuo primo FantaParto
                </Link>
              </div>
            </div>
          </div>

        ) : (

          /* ─── ACTIVE STATE ─── */
          <div className="flex flex-col gap-6">

            {/* Card evento principale */}
            <EventoFeatured
              ev={eventoAttivo}
              maschio={maschio}
              femmina={femmina}
            />

            {/* Altri eventi */}
            {altriEventi.length > 0 && (
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-widest mb-4"
                  style={{ color: C.onSurfVar }}
                >
                  Altri eventi ({altriEventi.length})
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {altriEventi.map((ev) => (
                    <EventoSmall key={ev.id} ev={ev} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick action — nuovo evento */}
            <div
              className="rounded-[2rem] p-6 flex items-center gap-5"
              style={{ background: C.surfContLow, border: `1.5px dashed ${C.outlineVar}` }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-[20px]"
                style={{ background: C.primaryFixed }}
              >
                ➕
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold" style={{ color: C.onSurf, fontFamily: QS }}>
                  Crea un nuovo FantaParto
                </p>
                <p className="text-[13px] font-normal" style={{ color: C.onSurfVar }}>
                  Hai un&apos;altra gravidanza da festeggiare? Puoi gestire più eventi.
                </p>
              </div>
              <Link
                href="/dashboard/nuovo-evento"
                className="flex-shrink-0 rounded-full px-5 py-2 text-[13px] font-semibold transition-all hover:opacity-80"
                style={{
                  background: C.white,
                  color: C.primary,
                  boxShadow: C.shadow,
                  fontFamily: VN,
                  textDecoration: "none",
                }}
              >
                Crea →
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer
          className="mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] font-semibold"
          style={{ borderTop: `1px solid ${C.outlineVar}`, color: C.outlineVar }}
        >
          <p>© 2026 FantaParto · La Gioiosa Attesa 🍼</p>
          <div className="flex gap-5">
            <a href="#" className="hover:opacity-70 transition-opacity" style={{ color: C.outlineVar }}>Privacy Policy</a>
            <a href="#" className="hover:opacity-70 transition-opacity" style={{ color: C.outlineVar }}>Termini di Utilizzo</a>
          </div>
        </footer>

      </div>
    </div>
  );
}
