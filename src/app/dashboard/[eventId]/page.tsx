export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import ModerateButton from "@/components/dashboard/ModerateButton";
import CopyLinkButton from "@/components/dashboard/CopyLinkButton";
import EliminaEventoButton from "@/components/dashboard/EliminaEventoButton";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:       "#f8f4f5",
  white:    "#ffffff",
  border:   "#e8e4e1",
  primary:  "#874e58",
  priLight: "#f4acb7",
  priXL:    "#ffd9de",
  onPri:    "#733d47",
  sec:      "#40627b",
  secLight: "#bee1ff",
  onSec:    "#42647e",
  onSurf:   "#1b1c1a",
  onSurfV:  "#6b5b5d",
  muted:    "#b0a0a2",
  blueCard: "#dbeafe",
  blueMid:  "#93c5fd",
  blueText: "#1e40af",
  amberCard:"#fef3c7",
  amberText:"#92400e",
  amberAcc: "#f59e0b",
  green:    "#166534",
  greenBg:  "#f0fdf4",
  greenBrd: "#bbf7d0",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcolaGiorni(d: Date) {
  return Math.max(0, Math.round((d.getTime() - Date.now()) / 86_400_000));
}
function formatData(d: Date) {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}
function formatDataOra(d: Date) {
  return formatData(d) + " · " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
function iniziali(n: string) {
  return n.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function Bar({ pct, color, h = 6 }: { pct: number; color: string; h?: number }) {
  return (
    <div style={{ height: h, borderRadius: 999, background: C.border, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: 999 }} />
    </div>
  );
}

// ── Donut SVG ─────────────────────────────────────────────────────────────────
function Donut({ pct, label, sub, color }: { pct: number; label: string; sub: string; color: string }) {
  const r = 28; const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(1, pct / 100);
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke={C.border} strokeWidth="8" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text x="36" y="34" textAnchor="middle" fontSize="12" fontWeight="800" fill={C.onSurf} fontFamily={QS}>{label}</text>
      <text x="36" y="47" textAnchor="middle" fontSize="7" fill={C.muted} fontFamily={VN}>{sub}</text>
    </svg>
  );
}

// ── Bubble Chart ──────────────────────────────────────────────────────────────
type Bubble = { id: string; dataParto: Date; peso: number; sesso: string | null };

function BubbleChart({ predictions, dpp }: { predictions: Bubble[]; dpp: Date }) {
  const W = 560; const H = 200; const PAD = 36; const R = 24;
  const data = predictions.filter((p) => p.dataParto && p.peso);
  const toX = (d: Date) => {
    const diff = (d.getTime() - dpp.getTime()) / 86_400_000;
    return PAD + ((Math.max(-30, Math.min(30, diff)) + 30) / 60) * (W - PAD * 2);
  };
  const toY = (peso: number) =>
    PAD + ((5000 - Math.max(2500, Math.min(5000, peso))) / 2500) * (H - PAD * 2 - 14);

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", background: C.bg, border: `1px solid ${C.border}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
        <line x1={toX(dpp)} y1={PAD - 6} x2={toX(dpp)} y2={H - 22}
          stroke={C.priLight} strokeWidth="1.5" strokeDasharray="4 3" />
        {data.length === 0 && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fill={C.muted} fontSize="13" fontFamily={VN}>
            Nessun pronostico con peso e data ancora
          </text>
        )}
        {data.map((p) => {
          const isMasc = p.sesso === "MASCHIO";
          return (
            <g key={p.id}>
              <circle cx={toX(p.dataParto)} cy={toY(p.peso)} r={R}
                fill={isMasc ? `${C.secLight}cc` : `${C.priLight}cc`}
                stroke={isMasc ? C.sec : C.primary} strokeWidth="1.5"
              />
              <text x={toX(p.dataParto)} y={toY(p.peso) + 4} textAnchor="middle"
                fill={isMasc ? C.onSec : C.onPri} fontSize="9" fontWeight="700" fontFamily={VN}
              >
                {(p.peso / 1000).toFixed(1)}
              </text>
            </g>
          );
        })}
        <text x={PAD} y={H - 4} fontSize="9" fill={C.muted} fontFamily={VN}>Prima</text>
        <text x={W / 2} y={H - 4} fontSize="9" fill={C.primary} fontFamily={VN} textAnchor="middle">← DPP →</text>
        <text x={W - PAD} y={H - 4} fontSize="9" fill={C.muted} fontFamily={VN} textAnchor="end">Dopo</text>
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

  const preds      = evento.predictions;
  const totVoti    = preds.length;
  const maxVoti    = evento.isPremium ? null : 20;
  const pctVoti    = maxVoti ? Math.min(100, Math.round((totVoti / maxVoti) * 100)) : 0;
  const maschio    = preds.filter((p) => p.votoSesso === "MASCHIO").length;
  const femmina    = preds.filter((p) => p.votoSesso === "FEMMINA").length;
  const totSesso   = maschio + femmina;
  const pctM       = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 0;
  const pctF       = 100 - pctM;
  const pesiV      = preds.map((p) => p.votoPeso).filter((p): p is number => p !== null);
  const mediaPeso  = pesiV.length > 0 ? pesiV.reduce((a, b) => a + b, 0) / pesiV.length : null;
  const pesoPct    = mediaPeso ? Math.round(((mediaPeso - 2500) / 2500) * 100) : 0;
  const dpp        = new Date(evento.dataPresuntaParto);
  const giorni     = calcolaGiorni(dpp);
  const sett       = Math.max(0, 40 - Math.ceil(giorni / 7));
  const urgente    = giorni <= 14 && giorni > 0 && evento.stato === "IN_CORSO";
  const nomeMamma  = dbUser?.nome ?? "Mamma";
  const nomeEvento = evento.nomeBimbo ? `Baby ${evento.nomeBimbo}` : "Bimbo/a in arrivo";

  const STATO: Record<string, { label: string; bg: string; brd: string; color: string }> = {
    IN_CORSO:           { label: "In corso",       bg: C.greenBg,  brd: C.greenBrd, color: C.green },
    PRONTO_RIVELAZIONE: { label: "In rivelazione", bg: C.amberCard,brd: C.amberAcc, color: C.amberText },
    CONCLUSO:           { label: "Concluso",        bg: C.priXL,    brd: C.priLight, color: C.onPri  },
  };
  const stato = STATO[evento.stato] ?? STATO.IN_CORSO;

  const bubbleData: Bubble[] = preds
    .filter((p) => p.votoData && p.votoPeso)
    .map((p) => ({ id: p.id, dataParto: new Date(p.votoData!), peso: p.votoPeso!, sesso: p.votoSesso }));

  // Leader (top scorer)
  const leader = preds
    .filter((p) => p.punteggioOttenuto !== null)
    .sort((a, b) => (b.punteggioOttenuto ?? 0) - (a.punteggioOttenuto ?? 0))[0];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: VN }}>

      {/* ── Sticky top bar ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 40,
          height: 52, background: C.white, borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", padding: "0 32px", gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, overflow: "hidden" }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>Dashboard</Link>
          <span style={{ fontSize: 13, color: C.border }}>›</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.onSurf, fontFamily: QS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {nomeEvento}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: stato.bg, border: `1px solid ${stato.brd}`, color: stato.color, flexShrink: 0 }}>
            {stato.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Link
            href="/dashboard/nuovo-evento"
            style={{ fontSize: 13, fontWeight: 700, color: C.onSurfV, border: `1px solid ${C.border}`, borderRadius: 999, padding: "6px 14px", textDecoration: "none", background: C.white }}
          >
            + Nuovo evento
          </Link>
          <CopyLinkButton codice={evento.codiceCondivisione} />
          <EliminaEventoButton
            eventId={evento.id}
            nomeEvento={nomeEvento}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 32px 64px" }}>

        {/* ── ROW 1: Hero + Countdown ────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14, marginBottom: 14 }} className="max-md:grid-cols-1">

          {/* Hero */}
          <div
            style={{
              borderRadius: 20, padding: "32px 36px",
              background: `linear-gradient(135deg, ${C.blueCard} 0%, #eff6ff 55%, ${C.bg} 100%)`,
              border: `1px solid ${C.blueMid}50`,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}
          >
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: QS, color: C.blueText, margin: "0 0 10px", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                {nomeEvento} · Ciao, {nomeMamma}! 👋
              </h1>
              <p style={{ fontSize: 14, color: "#1e3a5f", lineHeight: 1.65, maxWidth: 440, margin: 0 }}>
                {totVoti} pronostic{totVoti === 1 ? "o" : "i"} ricevuti{maxVoti ? ` su ${maxVoti} disponibili` : ""}.
                {" "}La DPP è il {dpp.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <a
                href={`/vota/${evento.codiceCondivisione}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, fontWeight: 700, color: C.white, background: C.primary, borderRadius: 999, padding: "10px 20px", textDecoration: "none", boxShadow: "0 4px 14px rgba(135,78,88,0.30)" }}
              >
                🔗 Pagina voto
              </a>
              <CopyLinkButton codice={evento.codiceCondivisione} />
            </div>
          </div>

          {/* Countdown / status card */}
          <div
            style={{
              borderRadius: 20, padding: "28px 24px",
              background: urgente
                ? "linear-gradient(135deg, #fecaca 0%, #fee2e2 100%)"
                : evento.stato === "CONCLUSO"
                ? `linear-gradient(135deg, ${C.priXL} 0%, ${C.priLight}40 100%)`
                : `linear-gradient(135deg, ${C.amberCard} 0%, #fffbeb 100%)`,
              border: `1px solid ${urgente ? "#fca5a5" : evento.stato === "CONCLUSO" ? C.priLight : "#fde68a"}`,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}
          >
            {evento.stato === "CONCLUSO" ? (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.onPri, margin: 0 }}>
                  🎉 Evento concluso
                </p>
                <div style={{ margin: "16px 0" }}>
                  <p style={{ fontSize: 48, margin: 0, lineHeight: 1 }}>👶</p>
                  {leader && (
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.onPri, margin: "12px 0 4px" }}>
                      🏆 {leader.nomeInvitato}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: C.onPri, margin: 0 }}>
                    {leader ? `${leader.punteggioOttenuto} punti — vincitore!` : "Calcola i punteggi"}
                  </p>
                </div>
                <span style={{ fontSize: 11, color: C.onPri }}>
                  {totVoti} partecipanti totali
                </span>
              </>
            ) : (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: urgente ? "#991b1b" : C.amberText, margin: 0 }}>
                  {urgente ? "⚡ Parto imminente!" : "Giorni al parto"}
                </p>
                <div style={{ margin: "12px 0" }}>
                  <p style={{ fontSize: 60, fontWeight: 900, lineHeight: 1, fontFamily: QS, color: urgente ? "#b91c1c" : C.amberText, margin: 0 }}>
                    {giorni}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: urgente ? "#b91c1c" : C.amberText, margin: "6px 0 0" }}>
                    giorni rimasti
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ display: "inline-block", width: "fit-content", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: urgente ? "#b91c1c" : C.amberAcc, color: C.white }}>
                    Settimana {sett}
                  </span>
                  <p style={{ fontSize: 11, color: urgente ? "#b91c1c80" : C.amberText + "80", margin: 0 }}>
                    {evento.visualizzazioniLink} visite al link
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── ROW 2: 4 stat card ──────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }} className="max-md:grid-cols-2">

          {/* Voti */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: "0 0 10px" }}>
              Total Votes
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 8 }}>
              <span style={{ fontSize: 34, fontWeight: 900, fontFamily: QS, color: C.onSurf, lineHeight: 1 }}>{totVoti}</span>
              {maxVoti && <span style={{ fontSize: 16, fontWeight: 600, color: C.muted }}>/{maxVoti}</span>}
            </div>
            <Bar pct={pctVoti} color={C.primary} h={7} />
            {maxVoti && (
              <p style={{ fontSize: 11, color: C.muted, margin: "6px 0 0" }}>
                ⏰ {maxVoti - totVoti} posti rimasti
              </p>
            )}
          </div>

          {/* Avg Weight */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: "0 0 8px" }}>
              Avg Weight
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
              {mediaPeso ? (
                <Donut pct={pesoPct} label={(mediaPeso / 1000).toFixed(1)} sub="kg" color={C.primary} />
              ) : (
                <p style={{ fontSize: 13, color: C.muted }}>—</p>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 4 }}>
              <span>2 kg</span><span>5 kg</span>
            </div>
          </div>

          {/* Team Challenge */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: "0 0 12px" }}>
              Team Challenge
            </p>
            {totSesso > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.sec }}>💙 Maschio</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: C.sec }}>{pctM}%</span>
                  </div>
                  <Bar pct={pctM} color={C.sec} h={8} />
                  <p style={{ fontSize: 10, color: C.muted, margin: "3px 0 0" }}>{maschio} voti</p>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>🩷 Femmina</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: C.primary }}>{pctF}%</span>
                  </div>
                  <Bar pct={pctF} color={C.primary} h={8} />
                  <p style={{ fontSize: 10, color: C.muted, margin: "3px 0 0" }}>{femmina} voti</p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: C.muted }}>Nessun voto sul sesso</p>
            )}
          </div>

          {/* Visite */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: "0 0 10px" }}>
              Visite Link
            </p>
            <p style={{ fontSize: 40, fontWeight: 900, fontFamily: QS, color: C.onSurf, lineHeight: 1, margin: "0 0 8px" }}>
              {evento.visualizzazioniLink}
            </p>
            <p style={{ fontSize: 11, color: C.muted, margin: "0 0 10px" }}>aperture del link condiviso</p>
            {evento.visualizzazioniLink > 0 && totVoti > 0 && (
              <>
                <Bar pct={Math.round((totVoti / evento.visualizzazioniLink) * 100)} color={C.amberAcc} h={6} />
                <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                  {Math.round((totVoti / evento.visualizzazioniLink) * 100)}% conversione
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── ROW 3: Bubble chart ─────────────────────────────────────────────── */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 28px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: "0 0 2px" }}>
                Distribuzione Previsioni
              </p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                Peso previsto vs giorni dalla DPP · {bubbleData.length} voti con entrambi i dati
              </p>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
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

        {/* ── ROW 4: Predictions table ─────────────────────────────────────────── */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>

          {/* Table header */}
          <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: "0 0 2px" }}>
                Previsioni
              </p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                {totVoti} partecipant{totVoti === 1 ? "e" : "i"} totali
              </p>
            </div>
            {preds.length === 0 && (
              <a
                href={`/vota/${evento.codiceCondivisione}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, fontWeight: 700, color: C.white, background: C.primary, borderRadius: 999, padding: "8px 18px", textDecoration: "none" }}
              >
                Apri pagina voto →
              </a>
            )}
          </div>

          {preds.length === 0 ? (
            <div style={{ padding: "48px 28px", textAlign: "center" }}>
              <p style={{ fontSize: 36, margin: "0 0 12px" }}>🗳️</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.onSurfV, margin: "0 0 4px" }}>
                Nessun pronostico ancora
              </p>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                Condividi il link per iniziare a raccogliere i voti!
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C.bg }}>
                      {["Partecipante", "Votato il", "Data prevista", "Peso / Sesso", "Punti", ""].map((h) => (
                        <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preds.map((p, idx) => {
                      const isMasc = p.votoSesso === "MASCHIO";
                      const isLeader = p.punteggioOttenuto !== null && p === leader;
                      return (
                        <tr
                          key={p.id}
                          style={{
                            borderTop: `1px solid ${C.border}`,
                            background: isLeader ? `${C.amberCard}60` : "transparent",
                          }}
                        >
                          {/* Partecipante */}
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {idx < 3 && evento.stato === "CONCLUSO" ? (
                                <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                                </div>
                              ) : (
                                <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: C.priXL, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                                  {iniziali(p.nomeInvitato)}
                                </div>
                              )}
                              <div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: C.onSurf, margin: 0 }}>{p.nomeInvitato}</p>
                                {p.emailInvitato && <p style={{ fontSize: 10, color: C.muted, margin: "1px 0 0" }}>{p.emailInvitato}</p>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 18px", fontSize: 12, color: C.onSurfV }}>{formatDataOra(new Date(p.createdAt))}</td>
                          <td style={{ padding: "14px 18px" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.sec }}>
                              {p.votoData ? formatData(new Date(p.votoData)) : "—"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              {p.votoSesso && (
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: isMasc ? C.secLight : C.priXL, color: isMasc ? C.onSec : C.onPri }}>
                                  {isMasc ? "M" : "F"}
                                </span>
                              )}
                              <span style={{ fontSize: 13, color: C.onSurfV }}>
                                {p.votoPeso ? `${(p.votoPeso / 1000).toFixed(3)} kg` : "—"}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            {p.punteggioOttenuto !== null ? (
                              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: QS, color: isLeader ? C.amberText : C.primary }}>
                                {p.punteggioOttenuto} pt
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, color: C.muted }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <ModerateButton predictionId={p.id} eventId={evento.id} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden" style={{ display: "flex", flexDirection: "column" }}>
                {preds.map((p, idx) => {
                  const isMasc = p.votoSesso === "MASCHIO";
                  const isLeader = p.punteggioOttenuto !== null && p === leader;
                  return (
                    <div key={p.id} style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, background: isLeader ? `${C.amberCard}60` : "transparent" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.priXL, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                            {idx < 3 && evento.stato === "CONCLUSO"
                              ? (idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉")
                              : iniziali(p.nomeInvitato)}
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: C.onSurf, margin: 0 }}>{p.nomeInvitato}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {p.punteggioOttenuto !== null && (
                            <span style={{ fontSize: 13, fontWeight: 800, color: isLeader ? C.amberText : C.primary }}>{p.punteggioOttenuto}pt</span>
                          )}
                          {p.votoSesso && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: isMasc ? C.secLight : C.priXL, color: isMasc ? C.onSec : C.onPri }}>
                              {isMasc ? "M" : "F"}
                            </span>
                          )}
                          {p.votoPeso && <span style={{ fontSize: 12, color: C.onSurfV }}>{(p.votoPeso / 1000).toFixed(2)} kg</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>
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
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12, color: C.muted }}>© 2026 FantaParto · La Gioiosa Attesa</p>
        </div>
      </div>
    </div>
  );
}
