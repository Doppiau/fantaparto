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

  const [event, dbUser] = await Promise.all([
    prisma.event.findFirst({
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
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { nome: true } }),
  ]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span className="text-sm font-semibold text-[var(--ink)]">I miei eventi</span>
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #FF6B6B, #FF8787)",
                boxShadow: "0 4px 12px rgba(255,107,107,0.25)",
              }}
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M10 5V3a1 1 0 011-1h2a1 1 0 011 1v2M8 8a2 2 0 012-2h4a2 2 0 012 2v11a3 3 0 01-3 3h-2a3 3 0 01-3-3V8z" />
              </svg>
            </div>
            <span className="text-base font-bold" style={{ color: "var(--ink)", fontFamily: "var(--font-fredoka, sans-serif)" }}>
              Fanta<span style={{ color: "var(--salmon)" }}>Parto</span>
            </span>
          </div>

          <form action={logoutAction}>
            <button type="submit" className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors" style={{ color: "var(--ink-45)", background: "rgba(44,44,46,0.06)" }}>
              Esci
            </button>
          </form>
        </div>
      </header>

      {/* Main bento grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Bento: Left (NestHeader + Stats) + Right (Calendario) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* Left column: 7/12 */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <NestHeader
              nomeBimbo={event.nomeBimbo}
              dataPresuntaParto={event.dataPresuntaParto}
              codiceCondivisione={event.codiceCondivisione}
              totVoti={totVoti}
              visualizzazioniLink={event.visualizzazioniLink}
              nomeMamma={dbUser?.nome ?? "Mamma"}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SessoWidget maschio={maschio} femmina={femmina} totale={maschio + femmina} />
              <BilanciaPesoWidget
                mediaPeso={mediaPeso}
                minPeso={minPeso}
                maxPeso={maxPeso}
                totVotiPeso={pesiValidi.length}
              />
            </div>
          </div>

          {/* Right column: 5/12 */}
          <div className="lg:col-span-5">
            <CalendarioWidget
              dataPresuntaParto={event.dataPresuntaParto}
              votiPerGiorno={votiPerGiorno}
            />
          </div>

        </div>

        {/* Tabs card (full width) */}
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

        {/* Footer */}
        <footer className="border-t-2 border-[#F1ECE4] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-bold" style={{ color: "rgba(44,44,46,0.35)" }}>
          <p>© 2026 FantaParto · Il fanta-gioco preferito delle mamme 🍼</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[var(--ink)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--ink)] transition-colors">Termini di Utilizzo</a>
          </div>
        </footer>

      </main>
    </div>
  );
}
