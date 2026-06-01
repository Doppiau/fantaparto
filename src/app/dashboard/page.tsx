import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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
  surfCont: "#efeeea",
  shadow:   "0px 12px 32px rgba(135,78,88,0.08)",
} as const;

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
        id: true,
        nomeBimbo: true,
        codiceCondivisione: true,
        stato: true,
        dataPresuntaParto: true,
        visualizzazioniLink: true,
        _count: { select: { predictions: true } },
      },
    }),
  ]);

  const nomeMamma = dbUser?.nome ?? "Mamma";
  const totVoti   = eventi.reduce((a, e) => a + e._count.predictions, 0);

  return (
    <div
      className="min-h-screen p-8"
      style={{ background: C.bg, fontFamily: "var(--font-vietnam, sans-serif)" }}
    >

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="mb-8">
        <p
          className="text-[12px] font-bold uppercase tracking-widest mb-2"
          style={{ color: C.onSurfV }}
        >
          Il tuo portale
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-[40px] font-bold leading-tight"
              style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.onSurf, letterSpacing: "-0.02em" }}
            >
              Bentornata, {nomeMamma}! 👋
            </h2>
            <p className="text-lg mt-1 font-normal" style={{ color: C.onSurfV }}>
              Gestisci i tuoi eventi FantaParto e monitora i pronostici dei tuoi cari.
            </p>
          </div>

          {/* Stats pill */}
          <div
            className="flex items-center gap-6 px-6 py-3 rounded-full flex-shrink-0 mt-2"
            style={{ background: C.priFixed, border: `1px solid ${C.priCont}` }}
          >
            <div className="text-center">
              <p
                className="text-[28px] font-bold leading-none"
                style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.primary }}
              >
                {eventi.length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: C.onSurfV }}>
                Event{eventi.length === 1 ? "o" : "i"}
              </p>
            </div>
            <div className="w-px h-10" style={{ background: C.priCont }} />
            <div className="text-center">
              <p
                className="text-[28px] font-bold leading-none"
                style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.primary }}
              >
                {totVoti}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: C.onSurfV }}>
                Voti totali
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Events section ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3
            className="text-[22px] font-semibold"
            style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.onSurf }}
          >
            I tuoi FantaParto
          </h3>
          <span
            className="text-[11px] font-semibold px-3 py-1 rounded-full"
            style={{ background: C.surfCont, color: C.onSurfV }}
          >
            Creazione dall&apos;app mobile
          </span>
        </div>

        {eventi.length === 0 ? (
          /* Empty state */
          <div
            className="rounded-[1.5rem] p-14 flex flex-col items-center gap-5 text-center"
            style={{ background: C.white, boxShadow: C.shadow }}
          >
            <div className="text-6xl select-none animate-bounce">🍼</div>
            <div className="space-y-2">
              <h3
                className="text-[22px] font-semibold"
                style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.onSurf }}
              >
                Nessun evento ancora
              </h3>
              <p className="text-[15px] font-normal max-w-xs" style={{ color: C.onSurfV }}>
                Crea il tuo primo FantaParto dall&apos;app mobile e inizia a raccogliere i pronostici dei tuoi cari!
              </p>
            </div>
            <div
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold"
              style={{ background: C.priFixed, color: C.primary }}
            >
              <span>📱</span>
              <span>Scarica l&apos;app FantaParto</span>
            </div>
          </div>
        ) : (
          /* Events grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {eventi.map((ev) => {
              const dpp = new Date(ev.dataPresuntaParto);
              const oggi = new Date();
              const giorni = Math.max(0, Math.round((dpp.getTime() - oggi.getTime()) / 86_400_000));
              const isConcluso = ev.stato === "CONCLUSO";

              return (
                <Link
                  key={ev.id}
                  href={`/dashboard/${ev.id}`}
                  className="block rounded-[1.5rem] p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-2"
                  style={{
                    background: C.white,
                    boxShadow: C.shadow,
                    textDecoration: "none",
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4
                        className="text-[20px] font-semibold leading-tight"
                        style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.onSurf }}
                      >
                        {ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a in arrivo"}
                      </h4>
                      <p
                        className="text-[11px] font-bold mt-0.5 tracking-widest"
                        style={{ color: C.onSurfV }}
                      >
                        #{ev.codiceCondivisione}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-bold px-3 py-1 rounded-full flex-shrink-0"
                      style={isConcluso
                        ? { background: C.surfCont, color: C.onSurfV }
                        : { background: "rgba(52,199,89,0.12)", color: "#15803d" }
                      }
                    >
                      {isConcluso ? "Concluso" : "● Attivo"}
                    </span>
                  </div>

                  {/* Stats */}
                  <div
                    className="flex justify-between items-center p-3 rounded-[1rem]"
                    style={{ background: C.surfLow }}
                  >
                    <div className="text-center flex-1">
                      <p
                        className="text-[22px] font-bold leading-none"
                        style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.primary }}
                      >
                        {ev._count.predictions}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: C.onSurfV }}>
                        Voti
                      </p>
                    </div>
                    <div className="w-px h-8" style={{ background: C.outV }} />
                    <div className="text-center flex-1">
                      <p
                        className="text-[22px] font-bold leading-none"
                        style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: C.onSurf }}
                      >
                        {ev.visualizzazioniLink}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: C.onSurfV }}>
                        Visite
                      </p>
                    </div>
                    <div className="w-px h-8" style={{ background: C.outV }} />
                    <div className="text-center flex-1">
                      <p
                        className="text-[22px] font-bold leading-none"
                        style={{
                          fontFamily: "var(--font-quicksand, sans-serif)",
                          color: giorni === 0 && !isConcluso ? C.primary : C.onSurf,
                        }}
                      >
                        {isConcluso ? "✓" : giorni}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: C.onSurfV }}>
                        {isConcluso ? "Chiuso" : "Giorni"}
                      </p>
                    </div>
                  </div>

                  {/* DPP row */}
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-medium" style={{ color: C.onSurfV }}>
                      DPP:{" "}
                      <span className="font-bold" style={{ color: C.onSurf }}>
                        {dpp.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </p>
                    <div className="flex items-center gap-1 text-[12px] font-bold" style={{ color: C.primary }}>
                      <span>Apri</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] font-semibold"
        style={{ borderTop: `1px solid ${C.outV}`, color: C.onSurfV }}
      >
        <p>© 2026 FantaParto · Il fanta-gioco preferito delle mamme 🍼</p>
        <div className="flex gap-4">
          <a href="#" className="hover:opacity-70 transition-opacity">Privacy Policy</a>
          <a href="#" className="hover:opacity-70 transition-opacity">Termini di Utilizzo</a>
        </div>
      </footer>
    </div>
  );
}
