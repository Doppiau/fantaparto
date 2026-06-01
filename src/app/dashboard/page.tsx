import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import CopyLinkButton from "@/components/dashboard/CopyLinkButton";

export const dynamic = "force-dynamic";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:        "#fbf9f5",
  white:     "#ffffff",
  border:    "#e8e4e1",
  borderHov: "#d6c2c3",
  primary:   "#874e58",
  priLight:  "#f4acb7",
  priXLight: "#ffd9de",
  onPri:     "#733d47",
  secondary: "#40627b",
  secLight:  "#bee1ff",
  onSec:     "#42647e",
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
function formatDPP(d: Date) {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}
function calcolaSettimana(giorni: number) {
  return Math.max(0, 40 - Math.ceil(giorni / 7));
}

// ── Componenti server ─────────────────────────────────────────────────────────

/** Barra progress thin e pulita */
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      style={{
        height: 6, width: "100%", borderRadius: 999,
        background: C.border, overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%", width: `${Math.min(100, pct)}%`,
          borderRadius: 999, background: color,
        }}
      />
    </div>
  );
}

/** KPI card — stile clean con solo border */
function Kpi({
  label, value, unit, sub, accent,
}: {
  label: string; value: string | number; unit?: string;
  sub?: string; accent?: string;
}) {
  return (
    <div
      style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 4,
        fontFamily: VN,
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted }}>
        {label}
      </p>
      <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, fontFamily: QS, color: accent ?? C.onSurf }}>
        {value}
        {unit && (
          <span style={{ fontSize: 14, fontWeight: 600, color: C.onSurfVar, marginLeft: 4 }}>
            {unit}
          </span>
        )}
      </p>
      {sub && <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

type EventRow = {
  id: string;
  nomeBimbo: string | null;
  codiceCondivisione: string;
  stato: string;
  dataPresuntaParto: Date;
  isPremium: boolean;
  visualizzazioniLink: number;
  _count: { predictions: number };
};

/** Card evento principale — layout professionale a sezioni */
function EventoCard({
  ev, maschio, femmina,
}: {
  ev: EventRow; maschio: number; femmina: number;
}) {
  const dpp      = new Date(ev.dataPresuntaParto);
  const giorni   = calcolaGiorni(dpp);
  const settimana = calcolaSettimana(giorni);
  const voti     = ev._count.predictions;
  const maxVoti  = ev.isPremium ? null : 20;
  const pctVoti  = maxVoti ? Math.round((voti / maxVoti) * 100) : 0;
  const totSesso = maschio + femmina;
  const pctM     = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 0;
  const pctF     = 100 - pctM;
  const nome     = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a in arrivo";

  const statoMap: Record<string, { label: string; bg: string; brd: string; color: string }> = {
    IN_CORSO:           { label: "In corso",       bg: C.greenBg,  brd: C.greenBrd,  color: C.green  },
    PRONTO_RIVELAZIONE: { label: "In rivelazione", bg: C.amberBg,  brd: C.amberBrd,  color: C.amber  },
    CONCLUSO:           { label: "Concluso",        bg: C.priXLight,brd: C.priLight,  color: C.onPri  },
  };
  const stato = statoMap[ev.stato] ?? statoMap.IN_CORSO;

  return (
    <div
      style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: "hidden", fontFamily: VN,
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.primary} 0%, ${C.priLight} 60%, ${C.secLight} 100%)` }} />

      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 28px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap", gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.onSurf, fontFamily: QS, margin: 0 }}>
            {nome}
          </h2>
          <span
            style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px",
              borderRadius: 999, border: `1px solid ${stato.brd}`,
              background: stato.bg, color: stato.color,
            }}
          >
            {stato.label}
          </span>
          {ev.isPremium && (
            <span
              style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px",
                borderRadius: 999, background: C.priXLight, color: C.onPri,
              }}
            >
              ✨ Premium
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CopyLinkButton codice={ev.codiceCondivisione} />
          <Link
            href={`/dashboard/${ev.id}`}
            style={{
              fontSize: 13, fontWeight: 700, color: C.white,
              background: C.primary, borderRadius: 999,
              padding: "8px 20px", textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Apri dashboard →
          </Link>
        </div>
      </div>

      {/* Body — 3 colonne */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          padding: "28px",
          gap: 0,
        }}
        className="max-md:grid-cols-1"
      >
        {/* Col 1 — Countdown */}
        <div style={{ paddingRight: 28, borderRight: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, marginBottom: 16 }}>
            Countdown
          </p>
          <p style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, fontFamily: QS, color: C.primary, marginBottom: 4 }}>
            {giorni}
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.onSurfVar, marginBottom: 12 }}>
            giorni al parto
          </p>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: C.priXLight, borderRadius: 999,
              padding: "4px 12px",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: C.onPri }}>
              Settimana {settimana}
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
            DPP: {formatDPP(dpp)}
          </p>
        </div>

        {/* Col 2 — Voti */}
        <div style={{ padding: "0 28px", borderRight: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, marginBottom: 16 }}>
            Partecipazione
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
            <p style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, fontFamily: QS, color: C.secondary }}>
              {voti}
            </p>
            {maxVoti && (
              <p style={{ fontSize: 18, fontWeight: 600, color: C.muted }}>
                /{maxVoti}
              </p>
            )}
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.onSurfVar, marginBottom: 16 }}>
            {maxVoti ? `${pctVoti}% del limite` : "voti totali"}
          </p>
          {maxVoti && (
            <>
              <Bar pct={pctVoti} color={C.secondary} />
              <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
                {maxVoti - voti} posti rimasti · {ev.visualizzazioniLink} visite
              </p>
            </>
          )}
        </div>

        {/* Col 3 — Team challenge */}
        <div style={{ paddingLeft: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, marginBottom: 16 }}>
            Team challenge
          </p>
          {totSesso > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.secondary }}>
                    🔵 Team Azzurro
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.secondary }}>
                    {pctM}%
                  </span>
                </div>
                <Bar pct={pctM} color={C.secondary} />
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{maschio} voti</p>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>
                    🌸 Team Rosa
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
                    {pctF}%
                  </span>
                </div>
                <Bar pct={pctF} color={C.primary} />
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{femmina} voti</p>
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 8 }}>
              <p style={{ fontSize: 14, color: C.muted }}>
                Nessun voto sul sesso ancora.
              </p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                Condividi il link per iniziare!
              </p>
              <a
                href={`/vota/${ev.codiceCondivisione}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block", marginTop: 12, fontSize: 12,
                  fontWeight: 700, color: C.primary, textDecoration: "none",
                }}
              >
                Vai alla pagina voto →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Card compatta per altri eventi */
function EventoCompact({ ev }: { ev: EventRow }) {
  const giorni     = calcolaGiorni(new Date(ev.dataPresuntaParto));
  const isConcluso = ev.stato === "CONCLUSO";
  const nome       = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a in arrivo";

  return (
    <Link
      href={`/dashboard/${ev.id}`}
      style={{
        display: "block", background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: "16px 20px", textDecoration: "none",
        transition: "border-color 150ms",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.onSurf, fontFamily: QS }}>{nome}</p>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>#{ev.codiceCondivisione}</p>
        </div>
        <span
          style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            background: isConcluso ? "#f0f0ef" : C.greenBg,
            color: isConcluso ? C.muted : C.green,
            flexShrink: 0,
          }}
        >
          {isConcluso ? "Concluso" : "Attivo"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, fontFamily: QS, color: isConcluso ? C.muted : C.primary, lineHeight: 1 }}>
            {isConcluso ? "—" : giorni}
          </p>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: C.muted, marginTop: 2 }}>
            {isConcluso ? "Chiuso" : "Giorni"}
          </p>
        </div>
        <div style={{ width: 1, background: C.border }} />
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, fontFamily: QS, color: C.secondary, lineHeight: 1 }}>
            {ev._count.predictions}
          </p>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: C.muted, marginTop: 2 }}>
            Voti
          </p>
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
        id: true, nomeBimbo: true, codiceCondivisione: true,
        stato: true, dataPresuntaParto: true, isPremium: true,
        visualizzazioniLink: true,
        _count: { select: { predictions: true } },
      },
    }),
  ]);

  const nomeMamma    = dbUser?.nome ?? "Mamma";
  const eventoAttivo = eventi.find((e) => e.stato === "IN_CORSO") ?? eventi[0] ?? null;
  const altriEventi  = eventoAttivo ? eventi.filter((e) => e.id !== eventoAttivo.id) : [];
  const totVoti      = eventi.reduce((a, e) => a + e._count.predictions, 0);

  const [maschio, femmina] = eventoAttivo
    ? await Promise.all([
        prisma.prediction.count({ where: { eventId: eventoAttivo.id, votoSesso: "MASCHIO" } }),
        prisma.prediction.count({ where: { eventId: eventoAttivo.id, votoSesso: "FEMMINA" } }),
      ])
    : [0, 0];

  const giorni    = eventoAttivo ? calcolaGiorni(new Date(eventoAttivo.dataPresuntaParto)) : 0;
  const settimana = calcolaSettimana(giorni);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: VN }}>
      <div style={{ maxWidth: 1160, padding: "40px 40px 64px", margin: "0 auto" }}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", gap: 24, marginBottom: 36, flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", color: C.muted, marginBottom: 6,
              }}
            >
              Panoramica
            </p>
            <h1
              style={{
                fontSize: 28, fontWeight: 700, color: C.onSurf,
                fontFamily: QS, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2,
              }}
            >
              Bentornata, {nomeMamma}
            </h1>
            <p style={{ fontSize: 14, color: C.onSurfVar, marginTop: 6 }}>
              {eventoAttivo
                ? "Ecco i dati aggiornati del tuo FantaParto."
                : "Crea il tuo primo FantaParto per iniziare."}
            </p>
          </div>

          <Link
            href="/dashboard/nuovo-evento"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 14, fontWeight: 700, color: C.white,
              background: C.primary, borderRadius: 999,
              padding: "10px 24px", textDecoration: "none",
              flexShrink: 0, marginTop: 4,
              boxShadow: "0 4px 14px rgba(135,78,88,0.20)",
            }}
          >
            <span>+</span> Nuovo evento
          </Link>
        </div>

        {/* ── KPI strip ───────────────────────────────────────────────────── */}
        {eventoAttivo && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12, marginBottom: 28,
            }}
            className="max-md:grid-cols-2"
          >
            <Kpi label="Giorni al parto" value={giorni} accent={C.primary} sub={`Settimana ${settimana}`} />
            <Kpi label="Voti ricevuti"   value={eventoAttivo._count.predictions} unit={eventoAttivo.isPremium ? undefined : `/ 20`} accent={C.secondary} />
            <Kpi label="Visite link"     value={eventoAttivo.visualizzazioniLink} sub="link aperto dagli invitati" />
            <Kpi label="Voti totali"     value={totVoti} sub={`${eventi.length} event${eventi.length === 1 ? "o" : "i"} totali`} />
          </div>
        )}

        {eventoAttivo === null ? (

          /* ─── EMPTY STATE ─── */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Hero card */}
            <div
              style={{
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "48px 40px", textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: C.priXLight, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 32, margin: "0 auto 24px",
                }}
              >
                🍼
              </div>
              <h2
                style={{
                  fontSize: 24, fontWeight: 700, color: C.onSurf,
                  fontFamily: QS, margin: "0 0 12px",
                }}
              >
                Nessun FantaParto ancora
              </h2>
              <p
                style={{
                  fontSize: 15, color: C.onSurfVar,
                  maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.6,
                }}
              >
                Crea il tuo primo evento, condividi il link su WhatsApp e inizia a raccogliere i pronostici dei tuoi cari.
              </p>
              <Link
                href="/dashboard/nuovo-evento"
                style={{
                  display: "inline-block", fontSize: 14, fontWeight: 700,
                  color: C.white, background: C.primary, borderRadius: 999,
                  padding: "12px 32px", textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(135,78,88,0.22)",
                }}
              >
                ✨ Crea il tuo primo FantaParto
              </Link>
            </div>

            {/* Feature list */}
            <div
              style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
              className="max-md:grid-cols-1"
            >
              {[
                { icon: "🎯", title: "Pronostici social", desc: "Sesso, peso, data e ora del parto. Chi indovina di più vince." },
                { icon: "🏆", title: "Classifica automatica", desc: "Al momento della nascita il sistema calcola i punteggi in automatico." },
                { icon: "📄", title: "PDF ricordo", desc: "Un documento personalizzato da conservare per sempre." },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{
                    background: C.white, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: "20px 24px",
                  }}
                >
                  <p style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.onSurf, marginBottom: 6, fontFamily: QS }}>{f.title}</p>
                  <p style={{ fontSize: 13, color: C.onSurfVar, lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

        ) : (

          /* ─── ACTIVE STATE ─── */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <EventoCard ev={eventoAttivo} maschio={maschio} femmina={femmina} />

            {/* Altri eventi */}
            {altriEventi.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.07em", color: C.muted, marginBottom: 10,
                  }}
                >
                  Altri eventi · {altriEventi.length}
                </p>
                <div
                  style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}
                  className="max-md:grid-cols-2"
                >
                  {altriEventi.map((ev) => (
                    <EventoCompact key={ev.id} ev={ev} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 56, paddingTop: 24,
            borderTop: `1px solid ${C.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 12,
          }}
        >
          <p style={{ fontSize: 12, color: C.muted }}>© 2026 FantaParto · La Gioiosa Attesa</p>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy Policy", "Termini di Utilizzo"].map((l) => (
              <a key={l} href="#" style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
