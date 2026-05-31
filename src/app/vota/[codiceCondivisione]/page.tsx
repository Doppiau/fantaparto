export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VotaClient from "./VotaClient";

interface PageProps {
  params: Promise<{ codiceCondivisione: string }>;
}

export default async function VotaPage({ params }: PageProps) {
  const { codiceCondivisione } = await params;

  const event = await prisma.event.findUnique({
    where: { codiceCondivisione },
    select: {
      id: true,
      nomeBimbo: true,
      dataPresuntaParto: true,
      stato: true,
      sessoAttivo: true,
      dataAttiva: true,
      pesoAttivo: true,
      lunghezzaAttiva: true,
      oraAttiva: true,
      capelliAttivo: true,
      occhiAttivo: true,
    },
  });

  if (!event) notFound();

  if (event.stato === "CONCLUSO") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--cream)" }}
      >
        <div className="fp-card p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
          <span className="text-5xl">🍼</span>
          <h1
            className="text-xl font-black text-[var(--ink)]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            Il bambino è già nato!
          </h1>
          <p className="text-sm text-[var(--ink-60)]">
            Questo FantaParto è concluso. Aspetta la classifica!
          </p>
        </div>
      </div>
    );
  }

  return (
    <VotaClient
      eventId={event.id}
      nomeBimbo={event.nomeBimbo}
      dataPresuntaParto={event.dataPresuntaParto.toISOString()}
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
