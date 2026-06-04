export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VotaClient from "./VotaClient";
import ClassificaView from "./ClassificaView";

const FREE_LIMIT = 20;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

interface PageProps {
  params: Promise<{ codiceCondivisione: string }>;
}

// ── Schermata "evento pieno" per gli invitati Free ────────────────────────────
function EventoPienoView({ nomeBimbo }: { nomeBimbo: string | null }) {
  const nome = nomeBimbo ? `Baby ${nomeBimbo}` : "questo FantaParto";
  return (
    <div style={{ minHeight: "100vh", background: "#fbf9f5", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: VN }}>
      <div style={{ background: "#fff", border: "1px solid #e8e4e1", borderRadius: 24, padding: "48px 36px", maxWidth: 400, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fde8e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
          🏆
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: QS, color: "#1b1c1a", margin: 0 }}>
          Evento al completo!
        </h1>
        <p style={{ fontSize: 14, color: "#6b5b5d", lineHeight: 1.65, margin: 0 }}>
          <strong>{nome}</strong> ha raggiunto il limite di <strong>{FREE_LIMIT} partecipanti</strong>
          {" "}del piano gratuito. Non è più possibile inviare pronostici.
        </p>
        <p style={{ fontSize: 13, color: "#b0a0a2", margin: 0 }}>
          I genitori riceveranno una notifica per sbloccare l&apos;evento con il piano Premium.
        </p>
        <Link
          href="/"
          style={{ fontSize: 13, fontWeight: 700, color: "#874e58", textDecoration: "none", marginTop: 8 }}
        >
          Scopri FantaParto →
        </Link>
      </div>
    </div>
  );
}

export default async function VotaPage({ params }: PageProps) {
  const { codiceCondivisione } = await params;

  const event = await prisma.event.findUnique({
    where: { codiceCondivisione },
    select: {
      id:              true,
      nomeBimbo:       true,
      dataPresuntaParto: true,
      stato:           true,
      isPremium:       true,
      temaColore:      true,
      // Toggle campi attivi
      sessoAttivo:     true,
      dataAttiva:      true,
      pesoAttivo:      true,
      lunghezzaAttiva: true,
      oraAttiva:       true,
      capelliAttivo:   true,
      occhiAttivo:     true,
      // Risultati reali (usati nella classifica)
      realeSesso:      true,
      realeData:       true,
      realeOra:        true,
      realePeso:       true,
      realeLunghezza:  true,
      realeCapelli:    true,
      realeOcchi:      true,
      // Predictions (solo quando CONCLUSO)
      predictions: {
        where:   { punteggioOttenuto: { not: null } },
        orderBy: { punteggioOttenuto: "desc" },
        select: {
          id: true, nomeInvitato: true, punteggioOttenuto: true,
          messaggioAugurio: true, votoSesso: true, votoData: true,
          votoOra: true, votoPeso: true, votoLunghezza: true,
          votoCapelli: true, votoOcchi: true,
        },
      },
    },
  });

  if (!event) notFound();

  // ── Evento concluso → classifica pubblica ─────────────────────────────────
  if (event.stato === "CONCLUSO") {
    return (
      <ClassificaView
        evento={{
          nomeBimbo:       event.nomeBimbo,
          sessoAttivo:     event.sessoAttivo,
          dataAttiva:      event.dataAttiva,
          pesoAttivo:      event.pesoAttivo,
          lunghezzaAttiva: event.lunghezzaAttiva,
          oraAttiva:       event.oraAttiva,
          capelliAttivo:   event.capelliAttivo,
          occhiAttivo:     event.occhiAttivo,
          realeSesso:      event.realeSesso,
          realeData:       event.realeData,
          realeOra:        event.realeOra,
          realePeso:       event.realePeso,
          realeLunghezza:  event.realeLunghezza,
          realeCapelli:    event.realeCapelli,
          realeOcchi:      event.realeOcchi,
        }}
        predictions={event.predictions}
      />
    );
  }

  // ── Votazione chiusa ma risultati non ancora rivelati ─────────────────────
  if (event.stato === "PRONTO_RIVELAZIONE") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--cream)" }}>
        <div className="fp-card p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
          <span className="text-5xl">🔒</span>
          <h1 className="text-xl font-black text-[var(--ink)]" style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}>
            Votazione chiusa!
          </h1>
          <p className="text-sm text-[var(--ink-60)]">
            La mamma ha chiuso le votazioni. I risultati saranno rivelati presto!
          </p>
        </div>
      </div>
    );
  }

  // ── Pre-check: evento Free al limite ─────────────────────────────────────
  if (!event.isPremium) {
    const totaleVoti = await prisma.prediction.count({ where: { eventId: event.id } });
    if (totaleVoti >= FREE_LIMIT) {
      return <EventoPienoView nomeBimbo={event.nomeBimbo} />;
    }
  }

  // ── Enforce metriche base per piano Free ─────────────────────────────────
  // Anche se il DB avesse metric flags = true su un account Free
  // (es. downgrade da Premium), li forziamo a false qui.
  const metriche = event.isPremium
    ? {
        sessoAttivo:     event.sessoAttivo,
        dataAttiva:      event.dataAttiva,
        pesoAttivo:      event.pesoAttivo,
        lunghezzaAttiva: event.lunghezzaAttiva,
        oraAttiva:       event.oraAttiva,
        capelliAttivo:   event.capelliAttivo,
        occhiAttivo:     event.occhiAttivo,
      }
    : {
        sessoAttivo:     event.sessoAttivo,
        dataAttiva:      event.dataAttiva,
        pesoAttivo:      event.pesoAttivo,
        lunghezzaAttiva: false,
        oraAttiva:       false,
        capelliAttivo:   false,
        occhiAttivo:     false,
      };

  // ── Evento in corso → form di voto ────────────────────────────────────────
  return (
    <VotaClient
      eventId={event.id}
      codiceCondivisione={codiceCondivisione}
      nomeBimbo={event.nomeBimbo}
      dataPresuntaParto={event.dataPresuntaParto.toISOString()}
      isPremium={event.isPremium}
      temaColore={event.temaColore}
      {...metriche}
    />
  );
}
