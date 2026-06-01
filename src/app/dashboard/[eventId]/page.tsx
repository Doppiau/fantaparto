export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import NestHeader from "./components/NestHeader";
import BottomTabs from "./components/BottomTabs";

interface PageProps { params: Promise<{ eventId: string }> }

// ── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:       "#fbf9f5",
  white:    "#ffffff",
  primary:  "#874e58",
  priCont:  "#f4acb7",
  priFixed: "#ffd9de",
  sec:      "#40627b",
  secCont:  "#bee1ff",
  onSurf:   "#1b1c1a",
  onSurfV:  "#514345",
  outV:     "#d6c2c3",
  surfLow:  "#f5f3ef",
  shadow:   "0px 12px 32px rgba(135,78,88,0.08)",
} as const;

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

  const preds     = event.predictions;
  const totVoti   = preds.length;
  const maxVoti   = event.isPremium ? "∞" : "20";
  const nomeMamma = dbUser?.nome ?? "Mamma";

  // ── Aggregati ──────────────────────────────────────────────────────────────
  const maschio = preds.filter((p) => p.votoSesso === "MASCHIO").length;
  const femmina = preds.filter((p) => p.votoSesso === "FEMMINA").length;
  const maschPct = totVoti > 0 ? Math.round((maschio / totVoti) * 100) : 0;
  const femmPct  = totVoti > 0 ? Math.round((femmina / totVoti) * 100) : 0;

  const pesiValidi = preds.map((p) => p.votoPeso).filter((p): p is number => p !== null);
  const mediaPeso  = pesiValidi.length > 0
    ? Math.round(pesiValidi.reduce((a, b) => a + b, 0) / pesiValidi.length)
    : null;
  const minPeso = pesiValidi.length > 0 ? Math.min(...pesiValidi) : 0;
  const maxPeso = pesiValidi.length > 0 ? Math.max(...pesiValidi) : 0;
  const mediaPesoKg = mediaPeso ? (mediaPeso / 1000).toFixed(1) : null;

  // Ore più votate (fasce da 3h)
  const oreFasce: Record<string, number> = {};
  preds.forEach((p) => {
    if (!p.votoOra) return;
    const h = parseInt(p.votoOra.split(":")[0], 10);
    const fascia = `${String(Math.floor(h / 3) * 3).padStart(2, "0")}:00–${String(Math.floor(h / 3) * 3 + 3).padStart(2, "00")}:00`;
    oreFasce[fascia] = (oreFasce[fascia] ?? 0) + 1;
  });
  const fasciaTop = Object.entries(oreFasce).sort((a, b) => b[1] - a[1])[0];

  // Giorni alla DPP + settimane di gestazione attuali
  const oggi    = new Date();
  const dpp     = new Date(event.dataPresuntaParto);
  const giorni  = Math.max(0, Math.round((dpp.getTime() - oggi.getTime()) / 86_400_000));
  const settLeft = Math.ceil(giorni / 7);
  const settGest = Math.max(0, 40 - settLeft);
  const dayOff   = giorni % 7;

  // Hype Score
  const hypeScore = totVoti === 0 ? 0 : Math.min(99, Math.max(18, Math.round(
    Math.min(1, totVoti / 20) * 55 +
    (event.visualizzazioniLink > 0
      ? Math.min(1, totVoti / Math.max(1, event.visualizzazioniLink)) * 35
      : 12),
  )));
  const hypeLabel = hypeScore >= 80 ? "Molto Alto 🔥"
    : hypeScore >= 60 ? "Alto 🎉"
    : hypeScore >= 40 ? "Medio 😊"
    : "Basso";

  // Stato
  const statoLabel = event.stato === "IN_CORSO" ? "In corso"
    : event.stato === "PRONTO_RIVELAZIONE" ? "In rivelazione"
    : "Concluso";

  const statoStyle = event.stato === "IN_CORSO"
    ? { background: "rgba(52,199,89,0.12)", color: "#15803d", border: "1px solid rgba(52,199,89,0.25)" }
    : event.stato === "PRONTO_RIVELAZIONE"
    ? { background: "rgba(251,191,36,0.12)", color: "#d97706", border: "1px solid rgba(251,191,36,0.25)" }
    : { background: `${C.priFixed}`, color: C.primary, border: `1px solid ${C.outV}` };

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

  // Bubble chart data — predictions with peso+data
  const bubbleData = preds
    .filter((p) => p.votoPeso !== null && p.votoData !== null)
    .slice(0, 10)
    .map((p, i) => {
      const pData = new Date(p.votoData!);
      const diffDays = Math.round((pData.getTime() - dpp.getTime()) / 86_400_000);
      const clampedDiff = Math.max(-30, Math.min(30, diffDays));
      const xPct = ((clampedDiff + 30) / 60) * 80 + 10; // 10–90% range
      const yOptions = [20, 35, 50, 65, 75, 30, 55, 42, 22, 68];
      const yPct = yOptions[i % yOptions.length];
      const isMaschio = p.votoSesso === "MASCHIO";
      const pesoKg = ((p.votoPeso ?? 3000) / 1000).toFixed(1);
      const sizeBase = 48;
      return { xPct, yPct, isMaschio, pesoKg, delay: i * 0.4 };
    });

  // Ultime previsioni per la tabella
  const ultimePrevisioni = preds.slice(0, 8);

  return (
    <div
      className="min-h-screen p-8"
      style={{ background: C.bg, fontFamily: "var(--font-vietnam, sans-serif)" }}
    >

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <p
              className="text-[12px] font-bold uppercase tracking-widest mb-2"
              style={{ color: C.onSurfV }}
            >
              {event.nomeBimbo ? `Baby ${event.nomeBimbo} ·` : ""} FantaParto
            </p>
            <h2
              className="text-[40px] font-bold leading-tight"
              style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.onSurf, letterSpacing: "-0.02em" }}
            >
              Bentornata, {nomeMamma}! 👋
            </h2>
            <p className="text-lg mt-1 font-normal" style={{ color: C.onSurfV }}>
              La piccola sfida procede a gonfie vele. Ecco i dati aggiornati ad oggi.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-2">
            <span
              className="text-[13px] font-bold px-3 py-1.5 rounded-full"
              style={statoStyle}
            >
              {statoLabel}
            </span>
            <a
              href={`/vota/${event.codiceCondivisione}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95"
              style={{ background: C.primary, color: "#fff", boxShadow: "0 8px 20px rgba(135,78,88,0.25)" }}
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              Condividi
            </a>
          </div>
        </div>
      </header>

      {/* ── KPI grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

        {/* 1 — Giorni alla DPP */}
        <div
          className="rounded-[1.5rem] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2"
          style={{ background: C.white, boxShadow: C.shadow }}
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-semibold" style={{ color: C.onSurfV }}>Giorni alla DPP</span>
            <span className="material-symbols-outlined text-[20px]" style={{ color: C.priCont }}>event_note</span>
          </div>
          <div className="mt-6 text-center">
            <span
              className="block text-[64px] font-bold leading-none"
              style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.primary, textShadow: "2px 4px 8px rgba(135,78,88,0.15)" }}
            >
              {giorni}
            </span>
            <p className="text-[12px] font-bold uppercase tracking-wider mt-2" style={{ color: C.onSurfV }}>
              Settimane: {settGest} + {dayOff}
            </p>
          </div>
        </div>

        {/* 2 — Voti Totali */}
        <div
          className="rounded-[1.5rem] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2"
          style={{ background: C.white, boxShadow: C.shadow }}
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-semibold" style={{ color: C.onSurfV }}>Voti Totali</span>
            <span className="material-symbols-outlined text-[20px]" style={{ color: "#a8cbe8" }}>how_to_vote</span>
          </div>
          <div className="mt-5">
            <div className="flex items-end justify-between mb-3">
              <span
                className="text-[32px] font-bold leading-none"
                style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.sec }}
              >
                {totVoti}<span className="text-[18px] font-semibold ml-1" style={{ color: C.onSurfV }}>/{maxVoti}</span>
              </span>
              <span
                className="text-[12px] font-bold px-3 py-1 rounded-full"
                style={{ background: C.priFixed, color: C.primary }}
              >
                {event.isPremium ? "100" : Math.round(Math.min(100, (totVoti / 20) * 100))}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: C.surfLow }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${event.isPremium ? Math.min(100, totVoti * 5) : Math.min(100, (totVoti / 20) * 100)}%`,
                  background: "#a8cbe8",
                }}
              />
            </div>
          </div>
        </div>

        {/* 3 — Team Challenge */}
        <div
          className="rounded-[1.5rem] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2"
          style={{ background: C.white, boxShadow: C.shadow }}
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-semibold" style={{ color: C.onSurfV }}>Team Challenge</span>
            <span className="material-symbols-outlined text-[20px]" style={{ color: "#94c4f0" }}>family_restroom</span>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className="flex-1 text-center">
              <p
                className="text-[28px] font-bold leading-none"
                style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.sec }}
              >
                {maschPct}%
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: C.sec }}>
                Azzurro
              </p>
            </div>
            <div className="w-px h-12" style={{ background: C.outV }} />
            <div className="flex-1 text-center">
              <p
                className="text-[28px] font-bold leading-none"
                style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.primary }}
              >
                {femmPct}%
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: C.primary }}>
                Rosa
              </p>
            </div>
          </div>
        </div>

        {/* 4 — Hype Score */}
        <div
          className="rounded-[1.5rem] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
          style={{ background: C.white, boxShadow: C.shadow }}
        >
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-semibold" style={{ color: C.onSurfV }}>Hype Score</span>
            <span className="material-symbols-outlined text-[20px]" style={{ color: C.priCont }}>favorite</span>
          </div>
          <div className="mt-4 flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={C.surfLow} strokeWidth="3" strokeDasharray="100,100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={C.primary} strokeWidth="3"
                  strokeDasharray={`${hypeScore},100`} strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-[22px] font-bold"
                  style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.primary }}
                >
                  {hypeScore}
                </span>
              </div>
            </div>
            <span
              className="mt-2 text-[12px] font-bold px-3 py-1 rounded-full"
              style={{ background: C.priFixed, color: C.primary }}
            >
              {hypeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Distribuzione Previsioni (bubble chart) ──────────────────────── */}
      <section className="mb-8">
        <div className="rounded-[1.5rem] p-6" style={{ background: C.white, boxShadow: C.shadow }}>
          <div className="flex justify-between items-center mb-5">
            <h3
              className="text-[24px] font-semibold"
              style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.onSurf }}
            >
              Distribuzione Previsioni
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: C.secCont }} />
                <span className="text-[12px] font-medium" style={{ color: C.onSurfV }}>Maschio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: C.priCont }} />
                <span className="text-[12px] font-medium" style={{ color: C.onSurfV }}>Femmina</span>
              </div>
            </div>
          </div>

          <div
            className="relative rounded-[1rem] p-5 overflow-hidden"
            style={{ height: 280, background: C.surfLow, border: `1px solid ${C.outV}40` }}
          >
            {bubbleData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[14px] font-semibold" style={{ color: C.onSurfV }}>
                  Nessun pronostico con peso e data ancora
                </p>
              </div>
            ) : (
              bubbleData.map((b, i) => (
                <div
                  key={i}
                  className="absolute rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                  style={{
                    width: 54,
                    height: 54,
                    left: `${b.xPct}%`,
                    top: `${b.yPct}%`,
                    transform: "translate(-50%, -50%)",
                    background: b.isMaschio ? `${C.secCont}cc` : `${C.priCont}cc`,
                    animation: `float ${3.5 + b.delay}s ease-in-out infinite`,
                    animationDelay: `${b.delay}s`,
                  }}
                >
                  <span className="text-[10px] font-bold" style={{ color: b.isMaschio ? C.sec : C.primary }}>
                    {b.pesoKg}kg
                  </span>
                </div>
              ))
            )}

            {/* DPP gradient heatmap */}
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full opacity-50 blur-sm"
              style={{ width: "60%", height: 24, background: `linear-gradient(to right, ${C.surfLow}, ${C.priFixed}, ${C.surfLow})` }}
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[13px] font-bold" style={{ color: C.primary }}>
              Concentrazione DPP
            </div>
            <div className="absolute bottom-2 left-4 text-[11px] font-medium" style={{ color: C.onSurfV }}>Prima</div>
            <div className="absolute bottom-2 right-4 text-[11px] font-medium" style={{ color: C.onSurfV }}>Dopo</div>
          </div>
        </div>
      </section>

      {/* ── Ultime Previsioni (table) ────────────────────────────────────── */}
      <section className="mb-8">
        <div className="rounded-[1.5rem] overflow-hidden" style={{ background: C.white, boxShadow: C.shadow }}>
          <div className="px-6 py-5" style={{ borderBottom: `1px solid ${C.surfLow}` }}>
            <h3
              className="text-[24px] font-semibold"
              style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.onSurf }}
            >
              Ultime Previsioni
            </h3>
          </div>

          {ultimePrevisioni.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-3">🗳️</p>
              <p className="text-[14px] font-semibold" style={{ color: C.onSurfV }}>
                Nessun pronostico ancora. Condividi il link per iniziare!
              </p>
              <a
                href={`/vota/${event.codiceCondivisione}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 px-5 py-2.5 rounded-full text-[13px] font-bold"
                style={{ background: C.priFixed, color: C.primary }}
              >
                Apri pagina voto
              </a>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: C.surfLow }}>
                      {["Partecipante", "Data Voto", "Predizione", "Peso / Sesso", "Azioni"].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-[12px] font-bold uppercase tracking-widest"
                          style={{ color: C.onSurfV }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ultimePrevisioni.map((p) => {
                      const iniziali = p.nomeInvitato.slice(0, 2).toUpperCase();
                      const isMaschio = p.votoSesso === "MASCHIO";
                      return (
                        <tr
                          key={p.id}
                          className="transition-colors"
                          style={{ borderBottom: `1px solid ${C.surfLow}` }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = C.surfLow)}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                        >
                          {/* Partecipante */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                                style={{ background: C.priFixed, color: C.primary }}
                              >
                                {iniziali}
                              </div>
                              <div>
                                <p className="text-[15px] font-semibold" style={{ color: C.onSurf }}>
                                  {p.nomeInvitato}
                                </p>
                                {p.emailInvitato && (
                                  <p className="text-[11px]" style={{ color: C.onSurfV }}>{p.emailInvitato}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Data Voto */}
                          <td className="px-6 py-4 text-[14px]" style={{ color: C.onSurfV }}>
                            {new Date(p.createdAt).toLocaleDateString("it-IT", {
                              day: "numeric", month: "short", year: "numeric",
                            })},{" "}
                            {new Date(p.createdAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                          </td>

                          {/* Predizione (data prevista) */}
                          <td className="px-6 py-4">
                            <span className="text-[14px] font-semibold" style={{ color: C.primary }}>
                              {p.votoData
                                ? new Date(p.votoData).toLocaleDateString("it-IT", {
                                    day: "numeric", month: "short", year: "numeric",
                                  })
                                : "—"}
                            </span>
                          </td>

                          {/* Peso / Sesso */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {p.votoSesso && (
                                <span
                                  className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                                  style={isMaschio
                                    ? { background: C.secCont, color: C.sec }
                                    : { background: C.priCont, color: C.primary }
                                  }
                                >
                                  {isMaschio ? "M" : "F"}
                                </span>
                              )}
                              <span className="text-[14px]" style={{ color: C.onSurfV }}>
                                {p.votoPeso ? `${(p.votoPeso / 1000).toFixed(3)} kg` : "—"}
                              </span>
                            </div>
                          </td>

                          {/* Azioni */}
                          <td className="px-6 py-4 text-right">
                            <button
                              className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors border-2"
                              style={{ borderColor: C.outV, color: C.onSurfV }}
                            >
                              Modera
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totVoti > 8 && (
                <div className="px-6 py-4 text-center" style={{ borderTop: `1px solid ${C.surfLow}` }}>
                  <button className="text-[14px] font-bold hover:underline" style={{ color: C.primary }}>
                    Vedi tutti i {totVoti} partecipanti
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── NestHeader + BottomTabs (funzionalità esistenti) ─────────────── */}
      <div className="mb-8">
        <NestHeader
          nomeBimbo={event.nomeBimbo}
          dataPresuntaParto={event.dataPresuntaParto}
          codiceCondivisione={event.codiceCondivisione}
          totVoti={totVoti}
          visualizzazioniLink={event.visualizzazioniLink}
          nomeMamma={nomeMamma}
        />
      </div>

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
        className="mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] font-semibold"
        style={{ borderTop: `1px solid ${C.outV}`, color: C.onSurfV }}
      >
        <p>© 2026 FantaParto · La Gioiosa Attesa 🍼</p>
        <div className="flex gap-4">
          <a href="#" className="hover:opacity-70 transition-opacity">Privacy Policy</a>
          <a href="#" className="hover:opacity-70 transition-opacity">Termini di Utilizzo</a>
        </div>
      </footer>

      {/* Float animation for bubbles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50%       { transform: translate(-50%, -50%) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
