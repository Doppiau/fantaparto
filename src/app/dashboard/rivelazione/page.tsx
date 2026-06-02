export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const C = {
  bg:      "#fef5f4",
  white:   "#ffffff",
  border:  "#f0e8e6",
  primary: "#b5352c",
  priXL:   "#fde8e6",
  priL:    "#f4acb7",
  onSurf:  "#1a1a2e",
  onSurfV: "#5a4e50",
  muted:   "#a89a9b",
  green:   "#166534",
  greenBg: "#f0fdf4",
  greenBrd:"#bbf7d0",
  amberBg: "#fef3c7",
  amberBrd:"#fde68a",
  amberTx: "#92400e",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";
const FR = "var(--font-fredoka, sans-serif)";

function formatDPP(d: Date) {
  return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

export default async function RivelazioneHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const eventi = await prisma.event.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, nomeBimbo: true, stato: true,
      dataPresuntaParto: true, isPremium: true,
      _count: { select: { predictions: true } },
    },
  });

  // Se c'è un solo evento attivo, redirect diretto
  const attivi = eventi.filter((e) => e.stato === "IN_CORSO");
  if (attivi.length === 1) {
    redirect(`/dashboard/${attivi[0].id}/grande-giorno`);
  }

  const STATO: Record<string, { label: string; bg: string; brd: string; color: string }> = {
    IN_CORSO:           { label: "In corso",       bg: C.greenBg,  brd: C.greenBrd, color: C.green },
    PRONTO_RIVELAZIONE: { label: "In rivelazione", bg: C.amberBg,  brd: C.amberBrd, color: C.amberTx },
    CONCLUSO:           { label: "Concluso",        bg: C.priXL,    brd: C.priL,     color: C.primary },
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: VN }}>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40, height: 56,
        background: C.white, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", padding: "0 32px",
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>
          🏁 Rivelazione
        </h1>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px 80px" }}>

        {eventi.length === 0 ? (
          /* Empty state */
          <div style={{
            background: C.white, border: `1px solid ${C.border}`, borderRadius: 24,
            padding: "56px 32px", textAlign: "center",
            boxShadow: "0 4px 24px -8px rgba(181,53,44,0.10)",
          }}>
            <p style={{ fontSize: 48, margin: "0 0 16px" }}>🍼</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: FR, color: C.onSurf, margin: "0 0 8px" }}>
              Nessun FantaParto ancora
            </h2>
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 28px", lineHeight: 1.6 }}>
              Crea il tuo primo evento e, quando nasce il bimbo, torna qui per inserire i dati reali e scoprire chi ha vinto!
            </p>
            <Link
              href="/dashboard/nuovo-evento"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 15, fontWeight: 700, color: C.white, fontFamily: FR,
                background: C.primary, borderRadius: 14, padding: "13px 28px",
                textDecoration: "none", boxShadow: "0 6px 20px rgba(181,53,44,0.28)",
              }}
            >
              + Crea FantaParto
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: FR, color: C.onSurf, margin: "0 0 6px" }}>
                Scegli il tuo FantaParto
              </h2>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
                Seleziona l&apos;evento per inserire i dati di nascita e calcolare la classifica finale.
              </p>
            </div>

            {/* Event list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {eventi.map((ev) => {
                const nome    = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a";
                const stato   = STATO[ev.stato] ?? STATO.IN_CORSO;
                const giorni  = Math.max(0, Math.round((new Date(ev.dataPresuntaParto).getTime() - Date.now()) / 86_400_000));
                const isConcluso = ev.stato === "CONCLUSO";

                return (
                  <div
                    key={ev.id}
                    style={{
                      background: C.white,
                      border: `1px solid ${ev.stato === "IN_CORSO" ? C.priL + "80" : C.border}`,
                      borderRadius: 20,
                      padding: "20px 24px",
                      display: "flex", alignItems: "center", gap: 16,
                      boxShadow: ev.stato === "IN_CORSO"
                        ? "0 4px 20px -6px rgba(181,53,44,0.12)"
                        : "none",
                    }}
                  >
                    {/* Emoji */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                      background: isConcluso ? C.priXL : ev.stato === "IN_CORSO" ? "#fde8e6" : C.amberBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 26,
                    }}>
                      {isConcluso ? "🏅" : "🍼"}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <p style={{ fontSize: 16, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>
                          {nome}
                        </p>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: stato.bg, border: `1px solid ${stato.brd}`, color: stato.color }}>
                          {stato.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                        {isConcluso
                          ? `${ev._count.predictions} partecipanti totali`
                          : giorni > 0
                          ? `${giorni} giorni al parto · ${ev._count.predictions} voti`
                          : `${ev._count.predictions} voti`}
                      </p>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/dashboard/${ev.id}/grande-giorno`}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 14, fontWeight: 700, color: C.white, fontFamily: FR,
                        background: isConcluso ? "#166534" : C.primary,
                        borderRadius: 12, padding: "10px 20px",
                        textDecoration: "none", flexShrink: 0,
                        boxShadow: `0 4px 14px ${isConcluso ? "rgba(22,101,52,0.25)" : "rgba(181,53,44,0.25)"}`,
                      }}
                    >
                      {isConcluso ? "🏅 Ricordi" : "🏁 Rivela"}
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
