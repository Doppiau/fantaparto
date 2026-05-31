export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/auth/actions";
import NestHeader from "./components/NestHeader";
import SessoWidget from "./components/SessoWidget";
import CalendarioWidget from "./components/CalendarioWidget";
import BilanciaPesoWidget from "./components/BilanciaPesoWidget";
import BottomTabs from "./components/BottomTabs";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDashboardPage({ params }: PageProps) {
  const { eventId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: user.id },
    include: {
      predictions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nomeInvitato: true,
          emailInvitato: true,
          votoSesso: true,
          votoPeso: true,
          votoData: true,
          votoOra: true,
          messaggioAugurio: true,
          createdAt: true,
        },
      },
    },
  });

  if (!event) notFound();

  /* ── Aggregati ──────────────────────────────────────────── */
  const preds = event.predictions;
  const totVoti = preds.length;

  const maschio = preds.filter((p) => p.votoSesso === "MASCHIO").length;
  const femmina = preds.filter((p) => p.votoSesso === "FEMMINA").length;

  const pesiValidi = preds.map((p) => p.votoPeso).filter((p): p is number => p !== null);
  const mediaPeso = pesiValidi.length > 0 ? Math.round(pesiValidi.reduce((a, b) => a + b, 0) / pesiValidi.length) : null;
  const minPeso = pesiValidi.length > 0 ? Math.min(...pesiValidi) : 0;
  const maxPeso = pesiValidi.length > 0 ? Math.max(...pesiValidi) : 0;

  // Heatmap: conta voti per giorno
  const votiPerGiorno: Record<string, number> = {};
  preds.forEach((p) => {
    if (!p.votoData) return;
    const key = new Date(p.votoData).toISOString().split("T")[0];
    votiPerGiorno[key] = (votiPerGiorno[key] ?? 0) + 1;
  });

  /* ── Toggle list ────────────────────────────────────────── */
  const toggles = [
    { key: "sessoAttivo",     label: "Sesso",     emoji: "💫", attivo: event.sessoAttivo },
    { key: "dataAttiva",      label: "Data",      emoji: "📅", attivo: event.dataAttiva },
    { key: "pesoAttivo",      label: "Peso",      emoji: "⚖️", attivo: event.pesoAttivo },
    { key: "lunghezzaAttiva", label: "Lunghezza", emoji: "📏", attivo: event.lunghezzaAttiva },
    { key: "oraAttiva",       label: "Ora",       emoji: "🕐", attivo: event.oraAttiva },
    { key: "capelliAttivo",   label: "Capelli",   emoji: "✂️", attivo: event.capelliAttivo },
    { key: "occhiAttivo",     label: "Occhi",     emoji: "👁️", attivo: event.occhiAttivo },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span className="text-sm font-semibold text-[var(--ink)]">Dashboard</span>
          </Link>
          <span className="text-sm font-bold" style={{ color: "var(--salmon)", fontFamily: "var(--font-fredoka, sans-serif)" }}>
            FantaParto
          </span>
          <form action={logoutAction}>
            <button type="submit" className="text-xs text-[var(--ink-45)] font-semibold hover:text-[var(--ink)] transition-colors">
              Esci
            </button>
          </form>
        </div>
      </header>

      {/* Bento grid */}
      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Header card */}
        <NestHeader
          nomeBimbo={event.nomeBimbo}
          dataPresuntaParto={event.dataPresuntaParto}
          codiceCondivisione={event.codiceCondivisione}
          totVoti={totVoti}
          visualizzazioniLink={event.visualizzazioniLink}
        />

        {/* Widget row */}
        <div className="grid grid-cols-2 gap-4">
          <SessoWidget maschio={maschio} femmina={femmina} totale={maschio + femmina} />
          <BilanciaPesoWidget
            mediaPeso={mediaPeso}
            minPeso={minPeso}
            maxPeso={maxPeso}
            totVotiPeso={pesiValidi.length}
          />
        </div>

        {/* Calendar full width */}
        <CalendarioWidget
          dataPresuntaParto={event.dataPresuntaParto}
          votiPerGiorno={votiPerGiorno}
        />

        {/* Bottom tabs */}
        <BottomTabs
          eventId={event.id}
          isPremium={event.isPremium}
          stato={event.stato}
          toggles={toggles}
          partecipanti={preds}
          risultatiEsistenti={{
            realeSesso: event.realeSesso,
            realeData: event.realeData,
            realePeso: event.realePeso,
            realeOra: event.realeOra,
          }}
        />
      </main>
    </div>
  );
}
