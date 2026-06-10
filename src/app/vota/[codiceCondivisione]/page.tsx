export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VotaClient from "./VotaClient";
import ClassificaView from "./ClassificaView";

interface PageProps {
  params: Promise<{ codiceCondivisione: string }>;
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
        codiceCondivisione={codiceCondivisione}
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

  // ── Evento in corso → form di voto ────────────────────────────────────────
  return (
    <VotaClient
      eventId={event.id}
      codiceCondivisione={codiceCondivisione}
      nomeBimbo={event.nomeBimbo}
      dataPresuntaParto={event.dataPresuntaParto.toISOString()}
      isPremium={true}
      temaColore={event.temaColore}
      sessoAttivo={event.sessoAttivo}
      dataAttiva={event.dataAttiva}
      pesoAttivo={event.pesoAttivo}
      lunghezzaAttiva={event.lunghezzaAttiva}
      oraAttiva={event.oraAttiva}
      capelliAttivo={event.capelliAttivo}
      occhiAttivo={event.occhiAttivo}
    />
  );
}
