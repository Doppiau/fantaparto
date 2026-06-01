import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import CopyLinkButton from "@/components/dashboard/CopyLinkButton";

export const dynamic = "force-dynamic";

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  surface:       "#fbf9f5",
  white:         "#ffffff",
  primary:       "#874e58",
  primaryCont:   "#f4acb7",
  primaryFixed:  "#ffd9de",
  onPrimaryCont: "#733d47",
  secondary:     "#40627b",
  secondaryCont: "#bee1ff",
  onSecCont:     "#42647e",
  onSurf:        "#1b1c1a",
  onSurfVar:     "#514345",
  outlineVar:    "#d6c2c3",
  surfContLow:   "#f5f3ef",
  surfCont:      "#efeeea",
  shadow:        "0px 12px 32px rgba(135,78,88,0.08)",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

function calcolaGiorni(dpp: Date): number {
  return Math.max(0, Math.round((dpp.getTime() - Date.now()) / 86_400_000));
}

function calcolaSettimane(giorni: number) {
  return { w: Math.floor(giorni / 7), d: giorni % 7 };
}

const STATO_LABEL: Record<string, string> = {
  IN_CORSO:           "In corso 🟢",
  PRONTO_RIVELAZIONE: "In rivelazione 🔮",
  CONCLUSO:           "Concluso ✓",
};

export default async function DashboardPage() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Query DB ─────────────────────────────────────────────────────────────────
  const [dbUser, eventi] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: user.id },
      select: { nome: true },
    }),
    prisma.event.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id:                 true,
        nomeBimbo:          true,
        codiceCondivisione: true,
        stato:              true,
        dataPresuntaParto:  true,
        isPremium:          true,
        _count: { select: { predictions: true } },
      },
    }),
  ]);

  // Primo evento attivo, oppure il più recente in assoluto
  const eventoAttivo = eventi.find((e) => e.stato === "IN_CORSO") ?? eventi[0] ?? null;

  // Team challenge: contiamo M/F solo se c'è un evento attivo
  const [maschio, femmina] = eventoAttivo
    ? await Promise.all([
        prisma.prediction.count({ where: { eventId: eventoAttivo.id, votoSesso: "MASCHIO" } }),
        prisma.prediction.count({ where: { eventId: eventoAttivo.id, votoSesso: "FEMMINA" } }),
      ])
    : [0, 0];

  // ── Aggregati ─────────────────────────────────────────────────────────────────
  const nomeMamma = dbUser?.nome ?? "Mamma";
  const totEventi = eventi.length;
  const totVoti   = eventi.reduce((acc, e) => acc + e._count.predictions, 0);

  const giorni         = eventoAttivo ? calcolaGiorni(new Date(eventoAttivo.dataPresuntaParto)) : 0;
  const { w, d }       = calcolaSettimane(giorni);
  const settGest       = Math.max(0, 40 - Math.ceil(giorni / 7));
  const votiEvento     = eventoAttivo?._count.predictions ?? 0;
  const maxVoti        = eventoAttivo?.isPremium ? null : 20;
  const pctVoti        = maxVoti ? Math.min(100, Math.round((votiEvento / maxVoti) * 100)) : 0;

  const totSesso = maschio + femmina;
  const pctM     = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 0;
  const pctF     = totSesso > 0 ? Math.round((femmina / totSesso) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: C.surface, fontFamily: VN }}>
      <div className="px-10 py-8 max-w-[1200px]">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="flex items-start justify-between gap-6 mb-16">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-2"
              style={{ color: C.onSurfVar }}
            >
              Il tuo portale
            </p>
            <h1
              className="text-[32px] font-semibold leading-tight mb-2"
              style={{ fontFamily: QS, color: C.onSurf, letterSpacing: "-0.01em" }}
            >
              Bentornata, {nomeMamma}! 👋
            </h1>
            <p className="text-[16px] font-normal max-w-md" style={{ color: C.onSurfVar }}>
              Gestisci i tuoi eventi FantaParto e monitora i pronostici dei tuoi cari.
            </p>
          </div>

          {/* Pill statistiche — solo desktop */}
          <div
            className="hidden md:flex items-center rounded-full flex-shrink-0"
            style={{ background: C.surfCont, border: `1px solid ${C.outlineVar}` }}
          >
            <div className="text-center px-6 py-3">
              <p
                className="text-[28px] font-bold leading-none"
                style={{ fontFamily: QS, color: C.primary }}
              >
                {totEventi}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: C.onSurfVar }}>
                Event{totEventi === 1 ? "o" : "i"}
              </p>
            </div>
            <div className="w-px h-10" style={{ background: C.outlineVar }} />
            <div className="text-center px-6 py-3">
              <p
                className="text-[28px] font-bold leading-none"
                style={{ fontFamily: QS, color: C.primary }}
              >
                {totVoti}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: C.onSurfVar }}>
                Voti totali
              </p>
            </div>
          </div>
        </header>

        {/* ── Card evento / Empty state ───────────────────────────────────────── */}
        {eventoAttivo === null ? (
          /* Empty state */
          <div
            className="flex flex-col items-center gap-6 text-center px-10 py-16 mx-auto max-w-lg"
            style={{ background: C.white, borderRadius: "3rem", boxShadow: C.shadow }}
          >
            <span className="text-7xl select-none" aria-hidden>🍼</span>
            <div className="space-y-2">
              <h2 className="text-[24px] font-semibold" style={{ fontFamily: QS, color: C.onSurf }}>
                Nessun evento ancora
              </h2>
              <p className="text-[16px] font-normal max-w-xs mx-auto" style={{ color: C.onSurfVar }}>
                Crea il tuo primo FantaParto e inizia a raccogliere i pronostici dei tuoi cari!
              </p>
            </div>
            <Link
              href="/dashboard/nuovo-evento"
              className="rounded-full px-8 py-3 text-[14px] font-semibold text-white transition-all active:scale-95 hover:opacity-90"
              style={{
                background:     C.primary,
                boxShadow:      "0 12px 32px rgba(135,78,88,0.22)",
                fontFamily:     VN,
                textDecoration: "none",
              }}
            >
              ✨ Crea il tuo FantaParto
            </Link>
          </div>
        ) : (
          /* Card evento attivo */
          <div
            style={{ background: C.white, borderRadius: "3rem", boxShadow: C.shadow, padding: "32px" }}
          >
            <div className="flex flex-col lg:flex-row gap-8">

              {/* ── Colonna sinistra ──────────────────────────────────────── */}
              <div className="flex-1 flex flex-col gap-5">
                <span
                  className="self-start rounded-full px-4 py-1.5 text-[13px] font-semibold"
                  style={{ background: C.primaryFixed, color: C.onPrimaryCont, fontFamily: VN }}
                >
                  {STATO_LABEL[eventoAttivo.stato]}
                </span>

                <h2
                  className="text-[24px] font-semibold leading-tight"
                  style={{ fontFamily: QS, color: C.onSurf }}
                >
                  FantaParto di {eventoAttivo.nomeBimbo ? `Baby ${eventoAttivo.nomeBimbo}` : "Bimbo/a in arrivo"}
                </h2>

                <div>
                  <p
                    className="text-[72px] font-bold leading-none"
                    style={{ fontFamily: QS, color: C.primary, textShadow: "2px 4px 12px rgba(135,78,88,0.12)" }}
                  >
                    {giorni}
                  </p>
                  <p className="text-[12px] font-bold uppercase tracking-widest mt-1" style={{ color: C.onSurfVar }}>
                    giorni alla DPP
                  </p>
                  <p className="text-[13px] font-medium mt-2" style={{ color: C.onSurfVar }}>
                    Settimana {settGest} · ancora {w}w {d}g
                  </p>
                </div>
              </div>

              {/* ── Colonna destra ────────────────────────────────────────── */}
              <div className="flex-1 flex flex-col gap-5">

                {/* Widget voti */}
                <div className="rounded-[1.5rem] p-5" style={{ background: C.surfContLow }}>
                  <div className="flex items-end justify-between mb-2">
                    <p
                      className="text-[32px] font-bold leading-none"
                      style={{ fontFamily: QS, color: C.secondary }}
                    >
                      {votiEvento}
                      {maxVoti !== null && (
                        <span className="text-[18px] font-semibold ml-1" style={{ color: C.onSurfVar }}>
                          /{maxVoti}
                        </span>
                      )}
                    </p>
                    {maxVoti !== null && (
                      <span
                        className="text-[12px] font-bold px-3 py-1 rounded-full mb-1"
                        style={{ background: C.primaryFixed, color: C.primary }}
                      >
                        {pctVoti}%
                      </span>
                    )}
                  </div>

                  {maxVoti !== null && (
                    <div className="h-2 w-full rounded-full overflow-hidden mb-2" style={{ background: C.outlineVar }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width:      `${pctVoti}%`,
                          background: `linear-gradient(to right, ${C.primary}, ${C.primaryCont})`,
                        }}
                      />
                    </div>
                  )}

                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.onSurfVar }}>
                    voti ricevuti
                  </p>
                </div>

                {/* Widget Team Challenge */}
                <div className="rounded-[1.5rem] p-5" style={{ background: C.surfContLow }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: C.onSurfVar }}>
                    Team Challenge
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex-1 text-center rounded-full py-2 text-[13px] font-bold"
                      style={{ background: C.secondaryCont, color: C.onSecCont }}
                    >
                      Team Azzurro {pctM}%
                    </span>
                    <span
                      className="flex-1 text-center rounded-full py-2 text-[13px] font-bold"
                      style={{ background: C.primaryCont, color: C.onPrimaryCont }}
                    >
                      Team Rosa {pctF}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer card */}
            <div
              className="flex flex-col sm:flex-row items-center gap-4 mt-8 pt-6"
              style={{ borderTop: `1px solid ${C.surfContLow}` }}
            >
              <Link
                href={`/dashboard/${eventoAttivo.id}`}
                className="rounded-full px-8 py-3 text-[14px] font-semibold text-white transition-all active:scale-95 hover:opacity-90"
                style={{
                  background: C.primary,
                  boxShadow:  "0 12px 32px rgba(135,78,88,0.22)",
                  fontFamily: VN,
                }}
              >
                Entra nella dashboard →
              </Link>
              <CopyLinkButton codice={eventoAttivo.codiceCondivisione} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
