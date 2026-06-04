export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import HypeSpaceClient from "./HypeSpaceClient";

interface PageProps {
  params: Promise<{ codiceCondivisione: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { codiceCondivisione } = await params;
  const ev = await prisma.event.findUnique({ where: { codiceCondivisione }, select: { nomeBimbo: true } });
  const nome = ev?.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "FantaParto";
  return { title: `Hype Space · ${nome}` };
}

export default async function HypePage({ params }: PageProps) {
  const { codiceCondivisione } = await params;

  const event = await prisma.event.findUnique({
    where: { codiceCondivisione },
    select: {
      id: true, nomeBimbo: true, dataPresuntaParto: true, stato: true,
      isPremium: true, hypeSpaceAnonimo: true, temaColore: true, codiceCondivisione: true,
      sessoAttivo: true, pesoAttivo: true, dataAttiva: true,
      lunghezzaAttiva: true, capelliAttivo: true, occhiAttivo: true, oraAttiva: true,
    },
  });

  if (!event) notFound();

  // Fetch tutti i voti in parallelo
  const [totaleVoti, sesso, pesoAgg, predizioni] = await Promise.all([
    prisma.prediction.count({ where: { eventId: event.id } }),
    prisma.prediction.groupBy({
      by:    ["votoSesso"],
      where: { eventId: event.id, votoSesso: { not: null } },
      _count: { votoSesso: true },
    }),
    prisma.prediction.aggregate({
      where: { eventId: event.id, votoPeso: { not: null } },
      _avg:   { votoPeso: true },
      _min:   { votoPeso: true },
      _max:   { votoPeso: true },
      _count: { votoPeso: true },
    }),
    prisma.prediction.findMany({
      where:  { eventId: event.id },
      select: { votoData: true, votoLunghezza: true, votoCapelli: true, votoOcchi: true, votoOra: true },
    }),
  ]);

  // ── Sesso ─────────────────────────────────────────────────────────────────
  const maschio = sesso.find((r) => r.votoSesso === "MASCHIO")?._count.votoSesso ?? 0;
  const femmina = sesso.find((r) => r.votoSesso === "FEMMINA")?._count.votoSesso ?? 0;

  // ── Peso ──────────────────────────────────────────────────────────────────
  const mediaPeso   = pesoAgg._avg.votoPeso   ?? null;
  const minPeso     = pesoAgg._min.votoPeso   ?? 3000;
  const maxPeso     = pesoAgg._max.votoPeso   ?? 3500;
  const totVotiPeso = pesoAgg._count.votoPeso ?? 0;

  // ── Data heatmap ──────────────────────────────────────────────────────────
  const votiPerGiorno: Record<string, number> = {};
  predizioni.forEach(({ votoData }) => {
    if (!votoData) return;
    const key = new Date(votoData).toISOString().split("T")[0];
    votiPerGiorno[key] = (votiPerGiorno[key] ?? 0) + 1;
  });

  // ── Lunghezza ─────────────────────────────────────────────────────────────
  const lunghezzeValide = predizioni.map((p) => p.votoLunghezza).filter((v): v is number => v !== null);
  const mediaLunghezza  = lunghezzeValide.length > 0
    ? Math.round(lunghezzeValide.reduce((a, b) => a + b, 0) / lunghezzeValide.length)
    : null;

  // ── Capelli ───────────────────────────────────────────────────────────────
  const capelliDist = { LISCI: 0, RICCI: 0, CALVO: 0 };
  predizioni.forEach(({ votoCapelli }) => {
    if (votoCapelli === "LISCI" || votoCapelli === "RICCI" || votoCapelli === "CALVO") {
      capelliDist[votoCapelli]++;
    }
  });

  // ── Occhi ─────────────────────────────────────────────────────────────────
  const occhiDist = { CHIARI: 0, SCURI: 0 };
  predizioni.forEach(({ votoOcchi }) => {
    if (votoOcchi === "CHIARI" || votoOcchi === "SCURI") {
      occhiDist[votoOcchi]++;
    }
  });

  // ── Ora distribuzione (fascia) ────────────────────────────────────────────
  const oreDist: Record<string, number> = {};
  predizioni.forEach(({ votoOra }) => {
    if (!votoOra) return;
    const ora = parseInt(votoOra.split(":")[0], 10);
    const fascia = ora < 6 ? "Notte" : ora < 12 ? "Mattina" : ora < 18 ? "Pomeriggio" : "Sera";
    oreDist[fascia] = (oreDist[fascia] ?? 0) + 1;
  });

  return (
    <HypeSpaceClient
      event={{
        nomeBimbo:          event.nomeBimbo,
        dataPresuntaParto:  event.dataPresuntaParto.toISOString(),
        stato:              event.stato,
        isPremium:          event.isPremium,
        hypeSpaceAnonimo:   event.hypeSpaceAnonimo,
        temaColore:         event.temaColore,
        codiceCondivisione: event.codiceCondivisione,
        sessoAttivo:        event.sessoAttivo,
        pesoAttivo:         event.pesoAttivo,
        dataAttiva:         event.dataAttiva,
        lunghezzaAttiva:    event.lunghezzaAttiva && event.isPremium,
        capelliAttivo:      event.capelliAttivo   && event.isPremium,
        occhiAttivo:        event.occhiAttivo     && event.isPremium,
        oraAttiva:          event.oraAttiva       && event.isPremium,
      }}
      stats={{
        totaleVoti,
        maschio, femmina,
        mediaPeso,
        minPeso, maxPeso, totVotiPeso,
        votiPerGiorno,
        mediaLunghezza,
        totVotiLunghezza: lunghezzeValide.length,
        capelliDist,
        occhiDist,
        oreDist,
      }}
    />
  );
}
