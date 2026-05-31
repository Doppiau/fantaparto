import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/auth/actions";
import { prisma } from "@/lib/prisma";

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

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #FF6B6B, #FF8787)",
                boxShadow: "0 4px 12px rgba(255,107,107,0.25)",
              }}
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M10 5V3a1 1 0 011-1h2a1 1 0 011 1v2M8 8a2 2 0 012-2h4a2 2 0 012 2v11a3 3 0 01-3 3h-2a3 3 0 01-3-3V8z" />
              </svg>
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: "var(--font-fredoka, sans-serif)", color: "var(--ink)" }}>
              Fanta<span style={{ color: "var(--salmon)" }}>Parto</span>
            </span>
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold hidden sm:block" style={{ color: "rgba(44,44,46,0.55)" }}>
              Ciao, <strong style={{ color: "var(--ink)" }}>{nomeMamma}</strong> 👋
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                style={{ color: "rgba(44,44,46,0.45)", background: "rgba(44,44,46,0.06)" }}
              >
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Hero greeting */}
        <div className="clay-card p-8 relative overflow-hidden">
          {/* Ambient glows */}
          <div
            className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,107,107,0.12) 0%, transparent 68%)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-12 w-48 h-48 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,209,102,0.10) 0%, transparent 68%)" }}
          />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <p
                className="text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: "rgba(44,44,46,0.38)" }}
              >
                Il tuo portale
              </p>
              <h1
                className="text-4xl font-extrabold text-[#2C2C2E]"
                style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
              >
                Benvenuta, {nomeMamma} 🍼
              </h1>
              <p className="text-sm font-semibold" style={{ color: "rgba(44,44,46,0.55)" }}>
                Gestisci i tuoi eventi FantaParto e monitora i pronostici dei tuoi cari.
              </p>
            </div>

            {/* Stats pill */}
            <div
              className="flex items-center gap-4 px-5 py-3 rounded-2xl flex-shrink-0"
              style={{
                background: "rgba(255,107,107,0.08)",
                border: "1.5px solid rgba(255,107,107,0.18)",
              }}
            >
              <div className="text-center">
                <p
                  className="text-3xl font-black leading-none"
                  style={{ color: "#FF6B6B", fontFamily: "var(--font-fredoka, sans-serif)" }}
                >
                  {eventi.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "rgba(44,44,46,0.40)" }}>
                  Event{eventi.length === 1 ? "o" : "i"}
                </p>
              </div>
              <div className="w-px h-10" style={{ background: "rgba(255,107,107,0.20)" }} />
              <div className="text-center">
                <p
                  className="text-3xl font-black leading-none"
                  style={{ color: "#FF6B6B", fontFamily: "var(--font-mono, monospace)" }}
                >
                  {eventi.reduce((a, e) => a + e._count.predictions, 0)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "rgba(44,44,46,0.40)" }}>
                  Voti totali
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Events section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2
              className="text-lg font-extrabold text-[#2C2C2E]"
              style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
            >
              I tuoi FantaParto
            </h2>
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ background: "rgba(44,44,46,0.06)", color: "rgba(44,44,46,0.45)" }}
            >
              Creazione dall&apos;app mobile
            </span>
          </div>

          {eventi.length === 0 ? (
            /* Empty state */
            <div className="clay-card p-12 flex flex-col items-center gap-5 text-center">
              <div className="text-6xl select-none animate-bounce">🍼</div>
              <div className="space-y-2">
                <h3
                  className="text-xl font-extrabold text-[#2C2C2E]"
                  style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
                >
                  Nessun evento ancora
                </h3>
                <p className="text-sm font-semibold max-w-xs" style={{ color: "rgba(44,44,46,0.55)" }}>
                  Crea il tuo primo FantaParto dall&apos;app mobile e inizia a raccogliere i pronostici dei tuoi cari!
                </p>
              </div>
              <div
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold"
                style={{
                  background: "rgba(255,107,107,0.08)",
                  border: "1.5px solid rgba(255,107,107,0.18)",
                  color: "#FF6B6B",
                }}
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
                const today = new Date();
                const remaining = Math.max(0, Math.round((dpp.getTime() - today.getTime()) / 86_400_000));
                const isConcluso = ev.stato === "CONCLUSO";

                return (
                  <Link
                    key={ev.id}
                    href={`/dashboard/${ev.id}`}
                    className="clay-card p-6 flex flex-col gap-4 cursor-pointer block"
                    style={{ textDecoration: "none" }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3
                          className="text-xl font-extrabold text-[#2C2C2E]"
                          style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
                        >
                          {ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a in arrivo"}
                        </h3>
                        <p
                          className="text-xs font-bold mt-0.5 tracking-widest"
                          style={{ fontFamily: "var(--font-mono, monospace)", color: "rgba(44,44,46,0.45)" }}
                        >
                          #{ev.codiceCondivisione}
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0"
                        style={
                          isConcluso
                            ? { background: "rgba(78,168,222,0.14)", color: "#3A7EAF" }
                            : { background: "rgba(52,199,89,0.12)", color: "#1A8C3A" }
                        }
                      >
                        {isConcluso ? "Concluso" : "● Attivo"}
                      </span>
                    </div>

                    {/* Stats inset */}
                    <div className="clay-inset-panel p-3 flex justify-between items-center">
                      <div className="text-center flex-1">
                        <p
                          className="text-2xl font-black leading-none"
                          style={{ color: "#FF6B6B", fontFamily: "var(--font-fredoka, sans-serif)" }}
                        >
                          {ev._count.predictions}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "rgba(44,44,46,0.38)" }}>
                          Voti
                        </p>
                      </div>
                      <div className="w-px h-8" style={{ background: "rgba(44,44,46,0.08)" }} />
                      <div className="text-center flex-1">
                        <p
                          className="text-2xl font-black leading-none"
                          style={{ color: "rgba(44,44,46,0.70)", fontFamily: "var(--font-mono, monospace)" }}
                        >
                          {ev.visualizzazioniLink}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "rgba(44,44,46,0.38)" }}>
                          Visite
                        </p>
                      </div>
                      <div className="w-px h-8" style={{ background: "rgba(44,44,46,0.08)" }} />
                      <div className="text-center flex-1">
                        <p
                          className="text-2xl font-black leading-none"
                          style={{
                            color: remaining === 0 ? "#FF6B6B" : "rgba(44,44,46,0.70)",
                            fontFamily: "var(--font-mono, monospace)",
                          }}
                        >
                          {isConcluso ? "✓" : remaining}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "rgba(44,44,46,0.38)" }}>
                          {isConcluso ? "Chiuso" : "Giorni"}
                        </p>
                      </div>
                    </div>

                    {/* DPP */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.50)" }}>
                        DPP:{" "}
                        <span className="font-bold text-[#2C2C2E]">
                          {dpp.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </p>
                      <div
                        className="flex items-center gap-1 text-xs font-bold"
                        style={{ color: "#FF6B6B" }}
                      >
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
          className="border-t-2 border-[#F1ECE4] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-bold"
          style={{ color: "rgba(44,44,46,0.35)" }}
        >
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
