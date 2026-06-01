export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import ModerateButton from "@/components/dashboard/ModerateButton";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:        "#fbf9f5",
  white:     "#ffffff",
  border:    "#e8e4e1",
  primary:   "#874e58",
  priLight:  "#f4acb7",
  priXLight: "#ffd9de",
  onPri:     "#733d47",
  secondary: "#40627b",
  secLight:  "#bee1ff",
  onSecCont: "#42647e",
  onSurf:    "#1b1c1a",
  onSurfVar: "#6b5b5d",
  muted:     "#b0a0a2",
  green:     "#166534",
  greenBg:   "#f0fdf4",
  greenBrd:  "#bbf7d0",
  amber:     "#92400e",
  amberBg:   "#fffbeb",
  amberBrd:  "#fde68a",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcolaGiorni(dpp: Date) {
  return Math.max(0, Math.round((dpp.getTime() - Date.now()) / 86_400_000));
}
function formatData(d: Date) {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}
function formatDataOra(d: Date) {
  return (
    d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
  );
}
function iniziali(nome: string) {
  return nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 999, background: C.border, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: 999 }} />
    </div>
  );
}

// ── Bubble chart SVG ──────────────────────────────────────────────────────────
type BubbleDatum = { id: string; dataParto: Date; peso: number; sesso: string | null };

function BubbleChart({ predictions, dpp }: { predictions: BubbleDatum[]; dpp: Date }) {
  const W = 560; const H = 220; const PAD = 36; const R = 26;
  const data = predictions.filter((p) => p.dataParto && p.peso);

  const toX = (d: Date) => {
    const diff = (d.getTime() - dpp.getTime()) / 86_400_000;
    return PAD + ((Math.max(-30, Math.min(30, diff)) + 30) / 60) * (W - PAD * 2);
  };
  const toY = (peso: number) =>
    PAD + ((5000 - Math.max(2500, Math.min(5000, peso))) / 2500) * (H - PAD * 2 - 16);

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", background: C.bg, border: `1px solid ${C.border}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
        <line x1={toX(dpp)} y1={PAD - 8} x2={toX(dpp)} y2={H - 24} stroke={C.priLight} strokeWidth="1.5" strokeDasharray="4 4" />
        {data.length === 0 && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fill={C.muted} fontSize="13" fontFamily={VN} fontWeight="500">
            Nessun pronostico con peso e data ancora
          </text>
        )}
        {data.map((p) => {
          const isMasc = p.sesso === "MASCHIO";
          return (
            <g key={p.id}>
              <circle cx={toX(p.dataParto)} cy={toY(p.peso)} r={R}
                fill={isMasc ? `${C.secLight}cc` : `${C.priLight}cc`}
                stroke={isMasc ? C.secondary : C.primary} strokeWidth="1.5"
              />
              <text x={toX(p.dataParto)} y={toY(p.peso) + 4} textAnchor="middle"
                fill={isMasc ? C.onSecCont : C.onPri} fontSize="10" fontWeight="700" fontFamily={VN}
              >
                {(p.peso / 1000).toFixed(1)}
              </text>
            </g>
          );
        })}
        <text x={PAD} y={H - 4} fontSize="10" fill={C.muted} fontFamily={VN}>Prima</text>
        <text x={W / 2} y={H - 4} fontSize="10" fill={C.primary} fontFamily={VN} textAnchor="middle">DPP</text>
        <text x={W - PAD} y={H - 4} fontSize="10" fill={C.muted} fontFamily={VN} textAnchor="end">Dopo</text>
      </svg>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
interface PageProps { params: Promise<{ eventId: string }> }

export default async function EventDashboardPage({ params }: PageProps) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [evento, dbUser] = await Promise.all([
    prisma.event.findFirst({
      where: { id: eventId, userId: user.id },
      include: {
        predictions: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, nomeInvitato: true, emailInvitato: true,
            votoSesso: true, votoPeso: true, votoData: true,
            punteggioOttenuto: true, messaggioAugurio: true, createdAt: true,
          },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { nome: true } }),
  ]);

  if (!evento) notFound();

  const preds    = evento.predictions;
  const totVoti  = preds.length;
  const maxVoti  = evento.isPremium ? null : 20;
  const pctVoti  = maxVoti ? Math.min(100, Math.round((totVoti / maxVoti) * 100)) : 0;
  const maschio  = preds.filter((p) => p.votoSesso === "MASCHIO").length;
  const femmina  = preds.filter((p) => p.votoSesso === "FEMMINA").length;
  const totSesso = maschio + femmina;
  const pctM     = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 0;
  const pctF     = 100 - pctM;
  const pesiValidi = preds.map((p) => p.votoPeso).filter((p): p is number => p !== null);
  const mediaPeso  = pesiValidi.length > 0 ? pesiValidi.reduce((a, b) => a + b, 0) / pesiValidi.length : null;
  const dpp        = new Date(evento.dataPresuntaParto);
  const giorni     = calcolaGiorni(dpp);
  const settimana  = Math.max(0, 40 - Math.ceil(giorni / 7));
  const nomeMamma  = dbUser?.nome ?? "Mamma";
  const nomeEvento = evento.nomeBimbo ? `Baby ${evento.nomeBimbo}` : "Bimbo/a in arrivo";

  const STATO = {
    IN_CORSO:           { label: "In corso",       bg: C.greenBg,  brd: C.greenBrd,  color: C.green  },
    PRONTO_RIVELAZIONE: { label: "In rivelazione", bg: C.amberBg,  brd: C.amberBrd,  color: C.amber  },
    CONCLUSO:           { label: "Concluso",        bg: C.priXLight,brd: C.priLight,  color: C.onPri  },
  };
  const stato = STATO[evento.stato as keyof typeof STATO] ?? STATO.IN_CORSO;

  const bubbleData: BubbleDatum[] = preds
    .filter((p) => p.votoData && p.votoPeso)
    .map((p) => ({ id: p.id, dataParto: new Date(p.votoData!), peso: p.votoPeso!, sesso: p.votoSesso }));

  const cell = (content: React.ReactNode) => (
    <div style={{ fontFamily: VN }}>{content}</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: VN }}>
      <div style={{ maxWidth: 1160, padding: "40px 40px 64px", margin: "0 auto" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <Link
            href="/dashboard"
            style={{ fontSize: 13, fontWeight: 600, color: C.muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}
          >
            ← Dashboard
          </Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: C.onSurf, fontFamily: QS, margin: 0 }}>
                {nomeEvento}
              </h1>
              <span
                style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px",
                  borderRadius: 999, border: `1px solid ${stato.brd}`,
                  background: stato.bg, color: stato.color,
                }}
              >
                {stato.label}
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.muted }}>
              Ciao {nomeMamma} · DPP: {dpp.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* ── KPI strip ──────────────────────────────────────────────────── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}
          className="max-md:grid-cols-2"
        >
          {[
            { label: "Giorni al parto",   value: giorni,     unit: "",    sub: `Settimana ${settimana}`, accent: C.primary   },
            { label: "Voti ricevuti",     value: totVoti,    unit: maxVoti ? `/${maxVoti}` : "", sub: maxVoti ? `${pctVoti}% del limite` : "voti totali", accent: C.secondary },
            { label: "Peso medio prev.",  value: mediaPeso ? `${(mediaPeso/1000).toFixed(2)} kg` : "—", unit: "", sub: `${pesiValidi.length} voti con peso`, accent: C.onSurf },
            { label: "Team Azzurro",      value: `${pctM}%`, unit: "",    sub: `vs ${pctF}% Team Rosa`, accent: C.secondary },
          ].map((k) => (
            <div
              key={k.label}
              style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, marginBottom: 6 }}>
                {k.label}
              </p>
              <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, fontFamily: QS, color: k.accent, marginBottom: 4 }}>
                {k.value}<span style={{ fontSize: 14, fontWeight: 500, color: C.muted }}>{k.unit}</span>
              </p>
              <p style={{ fontSize: 12, color: C.muted }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Progresso voti + Team challenge ────────────────────────────── */}
        {maxVoti && (
          <div
            style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 28px", marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted }}>
                Partecipazione
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{pctVoti}%</span>
            </div>
            <Bar pct={pctVoti} color={C.primary} />
          </div>
        )}

        {/* ── Bubble chart ───────────────────────────────────────────────── */}
        <div
          style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 28px", marginBottom: 24 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 700, fontFamily: QS, color: C.onSurf }}>
              Distribuzione Previsioni
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ color: C.secLight, label: "Maschio" }, { color: C.priLight, label: "Femmina" }].map((l) => (
                <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, display: "inline-block" }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <BubbleChart predictions={bubbleData} dpp={dpp} />
        </div>

        {/* ── Tabella previsioni ──────────────────────────────────────────── */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 15, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>
              Previsioni · {totVoti} partecipant{totVoti === 1 ? "e" : "i"}
            </p>
          </div>

          {preds.length === 0 ? (
            <div style={{ padding: "48px 28px", textAlign: "center" }}>
              <p style={{ fontSize: 28, marginBottom: 12 }}>🗳️</p>
              <p style={{ fontSize: 14, color: C.muted }}>Nessun pronostico ancora.</p>
              <a
                href={`/vota/${evento.codiceCondivisione}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block", marginTop: 16, fontSize: 13,
                  fontWeight: 700, color: C.white, background: C.primary,
                  borderRadius: 999, padding: "8px 20px", textDecoration: "none",
                }}
              >
                Apri pagina voto
              </a>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C.bg }}>
                      {["Partecipante", "Votato il", "Predizione data", "Peso / Sesso", ""].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 20px", textAlign: "left",
                            fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: "0.06em", color: C.muted,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preds.map((p) => {
                      const isMasc = p.votoSesso === "MASCHIO";
                      return (
                        <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div
                                style={{
                                  width: 36, height: 36, borderRadius: "50%",
                                  background: C.priXLight, color: C.primary,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                                }}
                              >
                                {iniziali(p.nomeInvitato)}
                              </div>
                              <div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: C.onSurf, margin: 0 }}>
                                  {p.nomeInvitato}
                                </p>
                                {p.emailInvitato && (
                                  <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{p.emailInvitato}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          {cell(<span style={{ fontSize: 13, color: C.onSurfVar }}>{formatDataOra(new Date(p.createdAt))}</span>)}
                          {cell(
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.secondary }}>
                              {p.votoData ? formatData(new Date(p.votoData)) : "—"}
                            </span>
                          )}
                          {cell(
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {p.votoSesso && (
                                <span
                                  style={{
                                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                                    background: isMasc ? C.secLight : C.priXLight,
                                    color: isMasc ? C.onSecCont : C.onPri,
                                  }}
                                >
                                  {isMasc ? "M" : "F"}
                                </span>
                              )}
                              <span style={{ fontSize: 13, color: C.onSurfVar }}>
                                {p.votoPeso ? `${(p.votoPeso / 1000).toFixed(3)} kg` : "—"}
                              </span>
                            </div>
                          )}
                          <td style={{ padding: "14px 20px" }}>
                            <ModerateButton predictionId={p.id} eventId={evento.id} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {preds.map((p) => {
                  const isMasc = p.votoSesso === "MASCHIO";
                  return (
                    <div key={p.id} style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34, height: 34, borderRadius: "50%",
                              background: C.priXLight, color: C.primary,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 800, flexShrink: 0,
                            }}
                          >
                            {iniziali(p.nomeInvitato)}
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: C.onSurf, margin: 0 }}>
                            {p.nomeInvitato}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {p.votoSesso && (
                            <span
                              style={{
                                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                                background: isMasc ? C.secLight : C.priXLight,
                                color: isMasc ? C.onSecCont : C.onPri,
                              }}
                            >
                              {isMasc ? "M" : "F"}
                            </span>
                          )}
                          <span style={{ fontSize: 13, color: C.onSurfVar }}>
                            {p.votoPeso ? `${(p.votoPeso / 1000).toFixed(2)} kg` : "—"}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                          {formatDataOra(new Date(p.createdAt))}
                          {p.votoData ? ` · Prev: ${formatData(new Date(p.votoData))}` : ""}
                        </p>
                        <ModerateButton predictionId={p.id} eventId={evento.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 48, paddingTop: 24, borderTop: `1px solid ${C.border}`,
            display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
          }}
        >
          <p style={{ fontSize: 12, color: C.muted }}>© 2026 FantaParto · La Gioiosa Attesa</p>
        </div>
      </div>
    </div>
  );
}
