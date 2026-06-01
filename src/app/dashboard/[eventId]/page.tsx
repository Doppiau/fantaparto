export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/auth/actions";
import NestHeader from "./components/NestHeader";
import BottomTabs from "./components/BottomTabs";
import CountdownCard from "./components/CountdownCard";

interface PageProps { params: Promise<{ eventId: string }> }

export default async function EventDashboardPage({ params }: PageProps) {
  const { eventId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [event, dbUser] = await Promise.all([
    prisma.event.findFirst({
      where: { id: eventId, userId: user.id },
      include: {
        predictions: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, nomeInvitato: true, emailInvitato: true,
            votoSesso: true, votoPeso: true, votoData: true, votoOra: true,
            votoLunghezza: true, votoCapelli: true, votoOcchi: true,
            punteggioOttenuto: true, messaggioAugurio: true, createdAt: true,
          },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { nome: true, avatarUrl: true } }),
  ]);

  if (!event) notFound();

  const preds      = event.predictions;
  const totVoti    = preds.length;
  const maxVoti    = event.isPremium ? "∞" : "20";
  const nomeMamma  = dbUser?.nome ?? "Mamma";

  // ── Aggregati ────────────────────────────────────────────────────────────
  const maschio = preds.filter((p) => p.votoSesso === "MASCHIO").length;
  const femmina = preds.filter((p) => p.votoSesso === "FEMMINA").length;

  const pesiValidi = preds.map((p) => p.votoPeso).filter((p): p is number => p !== null);
  const mediaPeso  = pesiValidi.length > 0
    ? Math.round(pesiValidi.reduce((a, b) => a + b, 0) / pesiValidi.length)
    : null;
  const minPeso  = pesiValidi.length > 0 ? Math.min(...pesiValidi) : 0;
  const maxPeso  = pesiValidi.length > 0 ? Math.max(...pesiValidi) : 0;
  const mediaPesoKg = mediaPeso ? (mediaPeso / 1000).toFixed(1) : null;

  // Ore più votate (fasce da 3h)
  const oreFasce: Record<string, number> = {};
  preds.forEach((p) => {
    if (!p.votoOra) return;
    const h = parseInt(p.votoOra.split(":")[0], 10);
    const fascia = `${String(Math.floor(h / 3) * 3).padStart(2,"0")}:00 - ${String(Math.floor(h / 3) * 3 + 3).padStart(2,"0")}:00`;
    oreFasce[fascia] = (oreFasce[fascia] ?? 0) + 1;
  });
  const fasciaTop = Object.entries(oreFasce).sort((a, b) => b[1] - a[1])[0];

  // Calendario
  const votiPerGiorno: Record<string, number> = {};
  preds.forEach((p) => {
    if (!p.votoData) return;
    const key = new Date(p.votoData).toISOString().split("T")[0];
    votiPerGiorno[key] = (votiPerGiorno[key] ?? 0) + 1;
  });

  // Toggle
  const toggles = [
    { key: "sessoAttivo",     label: "Sesso",     emoji: "💫", attivo: event.sessoAttivo },
    { key: "dataAttiva",      label: "Data",      emoji: "📅", attivo: event.dataAttiva },
    { key: "pesoAttivo",      label: "Peso",      emoji: "⚖️", attivo: event.pesoAttivo },
    { key: "lunghezzaAttiva", label: "Lunghezza", emoji: "📏", attivo: event.lunghezzaAttiva },
    { key: "oraAttiva",       label: "Ora",       emoji: "🕐", attivo: event.oraAttiva },
    { key: "capelliAttivo",   label: "Capelli",   emoji: "✂️", attivo: event.capelliAttivo },
    { key: "occhiAttivo",     label: "Occhi",     emoji: "👁️", attivo: event.occhiAttivo },
  ];

  const statoLabel = event.stato === "IN_CORSO" ? "In corso"
    : event.stato === "PRONTO_RIVELAZIONE" ? "In rivelazione"
    : "Concluso";

  const statoColor = event.stato === "IN_CORSO"
    ? { bg: "rgba(34,197,94,0.12)", color: "#16a34a", border: "rgba(34,197,94,0.25)" }
    : event.stato === "PRONTO_RIVELAZIONE"
    ? { bg: "rgba(251,191,36,0.12)", color: "#d97706", border: "rgba(251,191,36,0.25)" }
    : { bg: "rgba(99,102,241,0.12)", color: "#4f46e5", border: "rgba(99,102,241,0.25)" };

  return (
    <div className="min-h-screen" style={{ background: "#FDFBF7" }}>

      {/* ── Top bar (fixed) ──────────────────────────────────────────────── */}
      <header
        className="fixed top-0 right-0 h-20 flex items-center justify-between px-8 z-40"
        style={{
          left: 256,
          background: "rgba(253,251,247,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #F1ECE4",
        }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="font-semibold" style={{ color: "rgba(44,44,46,0.55)" }}>
            Dashboard
          </Link>
          <span className="material-symbols-outlined text-base" style={{ color: "rgba(44,44,46,0.30)" }}>
            chevron_right
          </span>
          <span className="font-bold" style={{ color: "#2C2C2E" }}>
            {event.nomeBimbo ? `Baby ${event.nomeBimbo}` : "Bimbo/a in arrivo"}
          </span>
          <span
            className="ml-2 px-2.5 py-0.5 rounded-md text-xs font-bold border"
            style={{ background: statoColor.bg, color: statoColor.color, borderColor: statoColor.border }}
          >
            {statoLabel}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            style={{ color: "rgba(44,44,46,0.55)", background: "rgba(44,44,46,0.06)" }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuovo evento
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: "#FF6B6B", boxShadow: "0 4px 0 rgba(174,47,52,0.35)" }}
            onClick={undefined}
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            Condividi link
          </button>
          <form action={logoutAction}>
            <button
              type="submit"
              className="p-2 rounded-full transition-colors"
              style={{ color: "rgba(44,44,46,0.45)", background: "rgba(44,44,46,0.06)" }}
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </form>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="pt-20 p-8 space-y-6">

        {/* Hero + NestHeader */}
        <div className="grid grid-cols-12 gap-6">
          {/* Welcome card (8/12) */}
          <div
            className="col-span-12 lg:col-span-8 rounded-[2rem] p-8 relative overflow-hidden"
            style={{ background: "white", border: "1px solid #F1ECE4", boxShadow: "0 4px 20px -8px rgba(44,44,46,0.10)" }}
          >
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,107,107,0.10) 0%, transparent 70%)" }} />
            <div className="relative max-w-md space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(44,44,46,0.38)" }}>
                Bentornata nel tuo FantaParto
              </p>
              <h2
                className="text-3xl font-black leading-tight"
                style={{ color: "#2C2C2E", fontFamily: "var(--font-fredoka)" }}
              >
                Ciao, {nomeMamma}! 🍼
              </h2>
              <p className="text-sm font-semibold" style={{ color: "rgba(44,44,46,0.55)" }}>
                {totVoti > 0
                  ? `Hai ricevuto ${totVoti} pronostici per ${event.nomeBimbo ? `Baby ${event.nomeBimbo}` : "il tuo bimbo/a"}. ${event.stato === "IN_CORSO" ? "La data del parto si avvicina!" : ""}`
                  : "Condividi il link per raccogliere i pronostici dei tuoi cari!"}
              </p>
              <div className="flex gap-3 pt-2">
                <a
                  href={`/vota/${event.codiceCondivisione}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-white active:scale-95 transition-all"
                  style={{ background: "#FF6B6B", boxShadow: "0 4px 12px rgba(255,107,107,0.35)" }}
                >
                  Vedi pagina voto
                </a>
                <button
                  className="px-6 py-2.5 rounded-full text-sm font-bold transition-colors"
                  style={{ background: "rgba(44,44,46,0.06)", color: "rgba(44,44,46,0.65)" }}
                >
                  Storico
                </button>
              </div>
            </div>
          </div>

          {/* Views + code (4/12) */}
          <div
            className="col-span-12 lg:col-span-4 rounded-[2rem] p-6 flex flex-col justify-between"
            style={{ background: "#FFD166", boxShadow: "0 4px 20px -8px rgba(255,209,102,0.50)" }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(44,44,46,0.55)" }}>
                Visite al link
              </p>
              <h3
                className="text-4xl font-black leading-none"
                style={{ color: "#2C2C2E", fontFamily: "var(--font-fredoka)" }}
              >
                {event.visualizzazioniLink}
                <span className="text-2xl ml-1 font-bold" style={{ color: "rgba(44,44,46,0.55)" }}>visite</span>
              </h3>
            </div>
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "rgba(44,44,46,0.55)" }}>Codice condivisione</p>
              <code
                className="text-lg font-black tracking-widest px-3 py-1.5 rounded-xl inline-block"
                style={{ background: "rgba(44,44,46,0.10)", color: "#2C2C2E", fontFamily: "var(--font-mono)" }}
              >
                {event.codiceCondivisione}
              </code>
            </div>
            <div className="flex items-center gap-2 mt-2" style={{ color: "rgba(44,44,46,0.70)" }}>
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="text-xs font-semibold">
                {totVoti > 0
                  ? `${((totVoti / Math.max(event.visualizzazioniLink, 1)) * 100).toFixed(0)}% conversion rate`
                  : "Nessun voto ancora"}
              </span>
            </div>
          </div>
        </div>

        {/* ── 4 metric cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* 1. Total Votes */}
          <div className="bg-white rounded-3xl p-6 flex flex-col h-full" style={{ border: "1px solid #F1ECE4", boxShadow: "0 4px 20px -8px rgba(44,44,46,0.08)" }}>
            <h6 className="font-black text-base mb-4" style={{ color: "#2C2C2E", fontFamily: "var(--font-fredoka)" }}>
              Voti Ricevuti
            </h6>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-black" style={{ color: "#FF6B6B", fontFamily: "var(--font-fredoka)" }}>{totVoti}</span>
              <span className="font-semibold text-base" style={{ color: "rgba(44,44,46,0.50)" }}>/ {maxVoti}</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden mb-3" style={{ background: "#F1ECE4" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, (totVoti / 20) * 100)}%`, background: "#FF6B6B" }}
              />
            </div>
            <div className="mt-auto">
              {!event.isPremium && (
                <div className="flex items-center gap-1.5 text-xs font-bold mb-3" style={{ color: "#FF6B6B" }}>
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{Math.max(0, 20 - totVoti)} posti rimasti</span>
                </div>
              )}
              <button
                className="w-full py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
                style={{ background: "rgba(255,209,102,0.20)", color: "#b45309" }}
              >
                ⭐ Upgrade Premium
              </button>
            </div>
          </div>

          {/* 2. Average Weight gauge */}
          <div className="bg-white rounded-3xl p-6 flex flex-col items-center" style={{ border: "1px solid #F1ECE4", boxShadow: "0 4px 20px -8px rgba(44,44,46,0.08)" }}>
            <h6 className="font-black text-base mb-4 self-start" style={{ color: "#2C2C2E", fontFamily: "var(--font-fredoka)" }}>
              Peso Medio Votato
            </h6>
            <div className="relative w-32 h-32 mb-3">
              {/* SVG gauge */}
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F1ECE4" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="#ae2f34" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset={mediaPeso
                    ? 251.2 - ((mediaPeso - 2000) / 3000) * 251.2
                    : 251.2}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="font-black text-xl" style={{ color: "#ae2f34", fontFamily: "var(--font-fredoka)" }}>
                  {mediaPesoKg ?? "—"}
                </span>
                <span className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.45)" }}>kg</span>
              </div>
            </div>
            <div className="flex justify-between w-full text-xs font-bold" style={{ color: "rgba(44,44,46,0.35)" }}>
              <span>2 kg</span>
              <span>5 kg</span>
            </div>
            {minPeso > 0 && (
              <p className="text-[10px] font-semibold mt-2 text-center" style={{ color: "rgba(44,44,46,0.45)" }}>
                Range: {(minPeso/1000).toFixed(1)}–{(maxPeso/1000).toFixed(1)} kg
              </p>
            )}
          </div>

          {/* 3. Sesso split */}
          <div className="bg-white rounded-3xl p-6" style={{ border: "1px solid #F1ECE4", boxShadow: "0 4px 20px -8px rgba(44,44,46,0.08)" }}>
            <h6 className="font-black text-base mb-4" style={{ color: "#2C2C2E", fontFamily: "var(--font-fredoka)" }}>
              Sesso più Votato
            </h6>
            {totVoti === 0 ? (
              <p className="text-sm text-center pt-6" style={{ color: "rgba(44,44,46,0.35)" }}>Nessun voto</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span style={{ color: "#D63384" }}>🩷 Femmina</span>
                    <span style={{ color: "#D63384" }}>{femmina}</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: "#F1ECE4" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${totVoti > 0 ? (femmina / totVoti) * 100 : 0}%`, background: "#F296C2" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span style={{ color: "#1A56DB" }}>💙 Maschio</span>
                    <span style={{ color: "#1A56DB" }}>{maschio}</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: "#F1ECE4" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${totVoti > 0 ? (maschio / totVoti) * 100 : 0}%`, background: "#6FA8DC" }}
                    />
                  </div>
                </div>
                <p className="text-xs font-bold text-center pt-2" style={{ color: "rgba(44,44,46,0.45)" }}>
                  {femmina > maschio ? "🩷 Femmina in vantaggio" : maschio > femmina ? "💙 Maschio in vantaggio" : "Parità!"}
                </p>
              </div>
            )}
          </div>

          {/* 4. Countdown */}
          <CountdownCard dataPresuntaParto={event.dataPresuntaParto.toISOString()} />
        </div>

        {/* ── Bento: Most Popular Bets + NestHeader ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* NestHeader (1/3) */}
          <div>
            <NestHeader
              nomeBimbo={event.nomeBimbo}
              dataPresuntaParto={event.dataPresuntaParto}
              codiceCondivisione={event.codiceCondivisione}
              totVoti={totVoti}
              visualizzazioniLink={event.visualizzazioniLink}
              nomeMamma={nomeMamma}
            />
          </div>

          {/* Most Popular Bets (2/3) */}
          <div
            className="lg:col-span-2 rounded-[2rem] p-6"
            style={{ background: "white", border: "1px solid #F1ECE4", boxShadow: "0 4px 20px -8px rgba(44,44,46,0.08)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h5 className="font-black text-base" style={{ color: "#2C2C2E", fontFamily: "var(--font-fredoka)" }}>
                Pronostici più Popolari
              </h5>
              {event.stato === "IN_CORSO" && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(34,197,94,0.10)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.20)" }}
                >
                  ● Live
                </span>
              )}
            </div>

            {totVoti === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">🗳️</p>
                <p className="text-sm font-semibold" style={{ color: "rgba(44,44,46,0.45)" }}>
                  Nessun pronostico ancora. Condividi il link!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Peso */}
                {event.pesoAttivo && mediaPesoKg && (
                  <BetCard
                    label="Peso Previsto"
                    value={`${(minPeso/1000).toFixed(1)}–${(maxPeso/1000).toFixed(1)} kg`}
                    sub={`Media: ${mediaPesoKg} kg`}
                    color="#ae2f34"
                    bars={[0.5, 0.75, 1, 0.8, 0.6]}
                  />
                )}
                {/* Ora */}
                {event.oraAttiva && fasciaTop && (
                  <BetCard
                    label="Fascia Oraria"
                    value={fasciaTop[0]}
                    sub={`${fasciaTop[1]} voti su quest'orario`}
                    color="#006590"
                    bars={[0.4, 0.6, 1, 0.7, 0.5]}
                  />
                )}
                {/* Sesso */}
                {event.sessoAttivo && totVoti > 0 && (
                  <BetCard
                    label="Sesso"
                    value={femmina >= maschio ? "🩷 Femmina" : "💙 Maschio"}
                    sub={`${Math.round(Math.max(femmina, maschio) / totVoti * 100)}% delle preferenze`}
                    color={femmina >= maschio ? "#D63384" : "#1A56DB"}
                    bars={[0.6, 0.8, 1, 0.9, 0.7]}
                  />
                )}
                {/* Voti totali */}
                <BetCard
                  label="Partecipazione"
                  value={`${totVoti} voti`}
                  sub={event.isPremium ? "Piano Premium" : `${Math.max(0, 20 - totVoti)} posti rimasti`}
                  color="#FF6B6B"
                  bars={[0.3, 0.5, 0.7, 0.85, 1]}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs (Regole, Giuria, Grand Giorno) ─────────────────────── */}
        <BottomTabs
          eventId={event.id}
          isPremium={event.isPremium}
          stato={event.stato}
          toggles={toggles}
          partecipanti={preds}
          risultatiEsistenti={{
            realeSesso:     event.realeSesso,
            realeData:      event.realeData,
            realePeso:      event.realePeso,
            realeOra:       event.realeOra,
            realeLunghezza: event.realeLunghezza,
            realeCapelli:   event.realeCapelli,
            realeOcchi:     event.realeOcchi,
          }}
        />

        {/* Footer */}
        <footer
          className="border-t-2 border-[#F1ECE4] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-bold"
          style={{ color: "rgba(44,44,46,0.35)" }}
        >
          <p>© 2026 FantaParto · Sculpted with care.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:opacity-70 transition-opacity">Privacy Policy</a>
            <a href="#" className="hover:opacity-70 transition-opacity">Termini di Utilizzo</a>
          </div>
          <span className="font-mono font-bold" style={{ color: "#FF6B6B" }}>v3.0.0</span>
        </footer>

      </main>
    </div>
  );
}

// ── Mini-componente BetCard ───────────────────────────────────────────────────

function BetCard({
  label, value, sub, color, bars,
}: { label: string; value: string; sub: string; color: string; bars: number[] }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#F9F5EF", border: "1px solid #F1ECE4" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(44,44,46,0.55)" }}>
        {label}
      </p>
      <div className="flex justify-between items-end">
        <div>
          <p className="font-black text-base leading-tight" style={{ color, fontFamily: "var(--font-fredoka)" }}>
            {value}
          </p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: "rgba(44,44,46,0.50)" }}>{sub}</p>
        </div>
        <div className="flex items-end gap-0.5 h-10">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-2.5 rounded-t-sm"
              style={{ height: `${h * 100}%`, background: i === bars.length - 1 ? color : `${color}40` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
