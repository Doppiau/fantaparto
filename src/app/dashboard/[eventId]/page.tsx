export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import ModerateButton from "@/components/dashboard/ModerateButton";

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
  surfContHigh:  "#eae8e4",
  shadow:        "0px 12px 32px rgba(135,78,88,0.08)",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcolaGiorni(dpp: Date): number {
  return Math.max(0, Math.round((dpp.getTime() - Date.now()) / 86_400_000));
}

function formatData(d: Date): string {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

function formatDataOra(d: Date): string {
  return (
    d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
  );
}

function iniziali(nome: string): string {
  return nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

// ── BubbleChart (SVG puro, no browser API — compatibile con Server Component) ─

type BubbleDatum = {
  id:      string;
  dataParto: Date;
  peso:    number;
  sesso:   string | null;
};

function BubbleChart({ predictions, dpp }: { predictions: BubbleDatum[]; dpp: Date }) {
  const W   = 600;
  const H   = 260;
  const PAD = 40;
  const R   = 28;

  const toX = (data: Date): number => {
    const diff = (data.getTime() - dpp.getTime()) / 86_400_000;
    return PAD + ((Math.max(-30, Math.min(30, diff)) + 30) / 60) * (W - PAD * 2);
  };

  const toY = (peso: number): number =>
    PAD + ((5000 - Math.max(2500, Math.min(5000, peso))) / 2500) * (H - PAD * 2 - 20);

  const data = predictions.filter((p) => p.dataParto && p.peso);

  return (
    <div
      className="relative w-full overflow-hidden rounded-[1rem]"
      style={{ background: C.surfContLow, border: `1px solid ${C.outlineVar}40` }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {/* Linea DPP tratteggiata */}
        <line
          x1={toX(dpp)} y1={PAD - 12}
          x2={toX(dpp)} y2={H - 28}
          stroke={C.primaryCont}
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {data.length === 0 && (
          <text
            x={W / 2} y={H / 2}
            textAnchor="middle"
            fill={C.onSurfVar}
            fontSize="13"
            fontFamily={VN}
            fontWeight="600"
          >
            Nessun pronostico con peso e data ancora
          </text>
        )}

        {data.map((p) => {
          const cx      = toX(p.dataParto);
          const cy      = toY(p.peso);
          const isMasc  = p.sesso === "MASCHIO";
          const fill    = isMasc ? `${C.secondaryCont}cc` : `${C.primaryCont}cc`;
          const stroke  = isMasc ? C.secondary : C.primary;
          const tColor  = isMasc ? C.onSecCont  : C.onPrimaryCont;
          const kg      = (p.peso / 1000).toFixed(1);
          return (
            <g key={p.id}>
              <circle cx={cx} cy={cy} r={R} fill={fill} stroke={stroke} strokeWidth="2" />
              <text
                x={cx} y={cy + 4}
                textAnchor="middle"
                fill={tColor}
                fontSize="11"
                fontWeight="700"
                fontFamily={VN}
              >
                {kg}kg
              </text>
            </g>
          );
        })}

        <text x={PAD}     y={H - 6} fontSize="11" fill={C.onSurfVar} fontFamily={VN} fontWeight="600">Prima</text>
        <text x={W / 2}   y={H - 6} fontSize="11" fill={C.primary}   fontFamily={VN} fontWeight="600" textAnchor="middle">Concentrazione DPP</text>
        <text x={W - PAD} y={H - 6} fontSize="11" fill={C.onSurfVar} fontFamily={VN} fontWeight="600" textAnchor="end">Dopo</text>
      </svg>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDashboardPage({ params }: PageProps) {
  const { eventId } = await params;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Query DB ─────────────────────────────────────────────────────────────
  const [evento, dbUser] = await Promise.all([
    prisma.event.findFirst({
      where: { id: eventId, userId: user.id },
      include: {
        predictions: {
          orderBy: { createdAt: "desc" },
          select: {
            id:               true,
            nomeInvitato:     true,
            emailInvitato:    true,
            votoSesso:        true,
            votoPeso:         true,
            votoData:         true,
            punteggioOttenuto:true,
            messaggioAugurio: true,
            createdAt:        true,
          },
        },
      },
    }),
    prisma.user.findUnique({
      where:  { id: user.id },
      select: { nome: true },
    }),
  ]);

  if (!evento) notFound();

  // ── Aggregati ──────────────────────────────────────────────────────────────
  const preds    = evento.predictions;
  const totVoti  = preds.length;
  const maxVoti  = evento.isPremium ? null : 20;
  const pctVoti  = maxVoti ? Math.min(100, Math.round((totVoti / maxVoti) * 100)) : 0;

  const maschio  = preds.filter((p) => p.votoSesso === "MASCHIO").length;
  const femmina  = preds.filter((p) => p.votoSesso === "FEMMINA").length;
  const totSesso = maschio + femmina;
  const pctM     = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 0;
  const pctF     = totSesso > 0 ? Math.round((femmina / totSesso) * 100) : 0;

  const pesiValidi = preds.map((p) => p.votoPeso).filter((p): p is number => p !== null);
  const mediaPeso  = pesiValidi.length > 0
    ? pesiValidi.reduce((a, b) => a + b, 0) / pesiValidi.length
    : null;

  const dpp    = new Date(evento.dataPresuntaParto);
  const giorni = calcolaGiorni(dpp);
  const w      = Math.floor(giorni / 7);
  const d      = giorni % 7;

  const nomeMamma  = dbUser?.nome ?? "Mamma";
  const nomeEvento = evento.nomeBimbo ? `Baby ${evento.nomeBimbo}` : "Bimbo/a in arrivo";

  const STATO: Record<string, { text: string; bg: string; color: string }> = {
    IN_CORSO:           { text: "In corso",      bg: "rgba(52,199,89,0.12)",  color: "#15803d" },
    PRONTO_RIVELAZIONE: { text: "In rivelazione", bg: "rgba(251,191,36,0.12)", color: "#d97706" },
    CONCLUSO:           { text: "Concluso",        bg: C.primaryFixed,          color: C.primary },
  };
  const stato = STATO[evento.stato] ?? STATO.IN_CORSO;

  // Dati per il bubble chart
  const bubbleData: BubbleDatum[] = preds
    .filter((p) => p.votoData !== null && p.votoPeso !== null)
    .map((p) => ({
      id:        p.id,
      dataParto: new Date(p.votoData!),
      peso:      p.votoPeso!,
      sesso:     p.votoSesso,
    }));

  // KPI card wrapper
  const KpiCard = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
    <div
      className="rounded-[2rem] p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1"
      style={{ background: C.white, boxShadow: C.shadow }}
    >
      <div
        className="w-10 h-10 rounded-[0.75rem] flex items-center justify-center text-[20px] flex-shrink-0"
        style={{ background: C.primaryFixed }}
      >
        {icon}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: C.surface, fontFamily: VN }}>
      <div className="px-10 py-8 max-w-[1200px]">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold mb-4 transition-opacity hover:opacity-70"
            style={{ color: C.onSurfVar }}
          >
            ← Dashboard
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              className="text-[28px] font-semibold leading-tight"
              style={{ fontFamily: QS, color: C.onSurf }}
            >
              FantaParto di {nomeEvento}
            </h1>
            <span
              className="rounded-full px-3 py-1 text-[12px] font-bold"
              style={{ background: stato.bg, color: stato.color }}
            >
              {stato.text}
            </span>
          </div>
          <p className="text-[14px] mt-1" style={{ color: C.onSurfVar }}>
            Ciao {nomeMamma} — ecco i dati aggiornati ad oggi.
          </p>
        </header>

        {/* ── KPI strip (2×2 mobile / 4×1 desktop) ────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">

          {/* Widget 1 — Giorni alla DPP */}
          <KpiCard icon="📅">
            <div>
              <p className="text-[40px] font-bold leading-none" style={{ fontFamily: QS, color: C.primary }}>
                {giorni}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: C.onSurfVar }}>
                giorni alla DPP
              </p>
              <p className="text-[12px] font-medium mt-1" style={{ color: C.onSurfVar }}>
                SETTIMANE: {w} + {d}g
              </p>
            </div>
          </KpiCard>

          {/* Widget 2 — Voti Totali */}
          <KpiCard icon="👥">
            <div>
              <p className="text-[36px] font-bold leading-none" style={{ fontFamily: QS, color: C.secondary }}>
                {totVoti}
                {maxVoti !== null && (
                  <span className="text-[18px] font-semibold ml-1" style={{ color: C.onSurfVar }}>
                    /{maxVoti}
                  </span>
                )}
              </p>
              {maxVoti !== null && (
                <div className="mt-2 h-2 w-full rounded-full overflow-hidden" style={{ background: C.outlineVar }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width:      `${pctVoti}%`,
                      background: `linear-gradient(to right, ${C.primary}, ${C.primaryCont})`,
                    }}
                  />
                </div>
              )}
              <p className="text-[11px] font-bold uppercase tracking-widest mt-2" style={{ color: C.onSurfVar }}>
                voti ricevuti
              </p>
            </div>
          </KpiCard>

          {/* Widget 3 — Team Challenge */}
          <KpiCard icon="👫">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[22px] font-bold leading-none" style={{ fontFamily: QS, color: C.secondary }}>
                  {pctM}%
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: C.secondary }}>
                  Azzurro
                </p>
              </div>
              <div className="w-px h-10" style={{ background: C.outlineVar }} />
              <div className="flex-1">
                <p className="text-[22px] font-bold leading-none" style={{ fontFamily: QS, color: C.primary }}>
                  {pctF}%
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: C.primary }}>
                  Rosa
                </p>
              </div>
            </div>
          </KpiCard>

          {/* Widget 4 — Peso Medio */}
          <KpiCard icon="⚖️">
            <div>
              <p className="text-[28px] font-bold leading-none" style={{ fontFamily: QS, color: C.onSurf }}>
                {mediaPeso
                  ? (mediaPeso / 1000).toLocaleString("it-IT", {
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    }) + " kg"
                  : "—"}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: C.onSurfVar }}>
                peso medio previsto
              </p>
            </div>
          </KpiCard>
        </section>

        {/* ── Grafico Distribuzione ──────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="rounded-[2rem] p-6" style={{ background: C.white, boxShadow: C.shadow }}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <h2 className="text-[20px] font-semibold" style={{ fontFamily: QS, color: C.onSurf }}>
                Distribuzione Previsioni
              </h2>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: C.onSurfVar }}>
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: C.secondaryCont }} />
                  Maschio
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: C.onSurfVar }}>
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: C.primaryCont }} />
                  Femmina
                </span>
              </div>
            </div>
            <BubbleChart predictions={bubbleData} dpp={dpp} />
          </div>
        </section>

        {/* ── Tabella Ultime Previsioni ──────────────────────────────────────── */}
        <section className="mb-16">
          <div
            className="rounded-[2rem] overflow-hidden"
            style={{ background: C.white, boxShadow: C.shadow }}
          >
            <div className="px-6 py-5" style={{ borderBottom: `1px solid ${C.surfContLow}` }}>
              <h2 className="text-[20px] font-semibold" style={{ fontFamily: QS, color: C.onSurf }}>
                Ultime Previsioni
              </h2>
            </div>

            {preds.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-3xl mb-3">🗳️</p>
                <p className="text-[14px] font-semibold" style={{ color: C.onSurfVar }}>
                  Nessun pronostico ancora. Condividi il link per iniziare!
                </p>
                <a
                  href={`/vota/${evento.codiceCondivisione}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-5 py-2.5 rounded-full text-[13px] font-bold"
                  style={{ background: C.primaryFixed, color: C.primary }}
                >
                  Apri pagina voto
                </a>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ background: C.surfContLow }}>
                        {["Partecipante", "Data Voto", "Predizione", "Peso / Sesso", "Azioni"].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest"
                            style={{ color: C.onSurfVar }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preds.map((p) => {
                        const isMaschio = p.votoSesso === "MASCHIO";
                        return (
                          <tr
                            key={p.id}
                            className="transition-colors hover:bg-[#f5f3ef]"
                            style={{ borderBottom: `1px solid ${C.surfContLow}` }}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                                  style={{ background: C.surfContHigh, color: C.onSurf }}
                                >
                                  {iniziali(p.nomeInvitato)}
                                </div>
                                <div>
                                  <p className="text-[15px] font-semibold" style={{ color: C.onSurf }}>
                                    {p.nomeInvitato}
                                  </p>
                                  {p.emailInvitato && (
                                    <p className="text-[11px]" style={{ color: C.onSurfVar }}>
                                      {p.emailInvitato}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-[14px]" style={{ color: C.onSurfVar }}>
                              {formatDataOra(new Date(p.createdAt))}
                            </td>

                            <td className="px-6 py-4">
                              <span className="text-[14px] font-semibold" style={{ color: C.secondary }}>
                                {p.votoData ? formatData(new Date(p.votoData)) : "—"}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {p.votoSesso && (
                                  <span
                                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                                    style={
                                      isMaschio
                                        ? { background: C.secondaryCont, color: C.onSecCont }
                                        : { background: C.primaryCont,   color: C.onPrimaryCont }
                                    }
                                  >
                                    {isMaschio ? "M" : "F"}
                                  </span>
                                )}
                                <span className="text-[14px]" style={{ color: C.onSurfVar }}>
                                  {p.votoPeso ? `${(p.votoPeso / 1000).toFixed(3)} kg` : "—"}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <ModerateButton predictionId={p.id} eventId={evento.id} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card stack */}
                <div className="md:hidden space-y-3 p-4">
                  {preds.map((p) => {
                    const isMaschio = p.votoSesso === "MASCHIO";
                    return (
                      <div
                        key={p.id}
                        className="rounded-[1.5rem] p-4"
                        style={{ background: C.surfContLow }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                              style={{ background: C.surfContHigh, color: C.onSurf }}
                            >
                              {iniziali(p.nomeInvitato)}
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold" style={{ color: C.onSurf }}>
                                {p.nomeInvitato}
                              </p>
                              {p.emailInvitato && (
                                <p className="text-[11px]" style={{ color: C.onSurfVar }}>
                                  {p.emailInvitato}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.votoSesso && (
                              <span
                                className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                                style={
                                  isMaschio
                                    ? { background: C.secondaryCont, color: C.onSecCont }
                                    : { background: C.primaryCont,   color: C.onPrimaryCont }
                                }
                              >
                                {isMaschio ? "M" : "F"}
                              </span>
                            )}
                            <span className="text-[13px] font-medium" style={{ color: C.onSurfVar }}>
                              {p.votoPeso ? `${(p.votoPeso / 1000).toFixed(3)} kg` : "—"}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between mb-3">
                          <p className="text-[11px]" style={{ color: C.onSurfVar }}>
                            Voto: {formatDataOra(new Date(p.createdAt))}
                          </p>
                          {p.votoData && (
                            <p className="text-[11px] font-semibold" style={{ color: C.secondary }}>
                              Prev: {formatData(new Date(p.votoData))}
                            </p>
                          )}
                        </div>
                        <ModerateButton predictionId={p.id} eventId={evento.id} />
                      </div>
                    );
                  })}
                </div>

                {/* Footer tabella */}
                <div
                  className="px-6 py-4 text-center"
                  style={{ borderTop: `1px solid ${C.surfContLow}` }}
                >
                  <p className="text-[14px] font-bold" style={{ color: C.primary }}>
                    {totVoti} partecipant{totVoti === 1 ? "e" : "i"} totali
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer
          className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] font-semibold"
          style={{ borderTop: `1px solid ${C.outlineVar}`, color: C.onSurfVar }}
        >
          <p>© 2026 FantaParto · La Gioiosa Attesa 🍼</p>
          <div className="flex gap-4">
            <a href="#" className="hover:opacity-70 transition-opacity">Privacy Policy</a>
            <a href="#" className="hover:opacity-70 transition-opacity">Termini di Utilizzo</a>
          </div>
        </footer>

      </div>
    </div>
  );
}
