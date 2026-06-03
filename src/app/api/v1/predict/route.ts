import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PredictionInputSchema } from "@/lib/validations";
import { isPrismaError } from "@/lib/prisma-errors";
import { rateLimitVoto, getIpFromRequest, isIpBanned } from "@/lib/ratelimit";

// Schema wrapper: aggiunge eventId al PredictionInputSchema
const PostBodySchema = PredictionInputSchema.extend({
  eventId: z.string().uuid("eventId deve essere un UUID valido"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 0. Controllo blacklist IP e rate limiting ─────────────────────────────
  const ip = getIpFromRequest(req);

  const [banned, { success: withinLimit, limit, remaining, reset }] =
    await Promise.all([isIpBanned(ip), rateLimitVoto.limit(ip)]);

  if (banned) {
    return NextResponse.json(
      { success: false, error: "Not Found" },
      { status: 404 }
    );
  }

  if (!withinLimit) {
    return NextResponse.json(
      { success: false, error: "Troppe richieste! Riprova tra poco." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  // ── 1. Parse e validazione input ────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Corpo della richiesta non valido (JSON malformato)" },
      { status: 400 }
    );
  }

  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Dati non validi", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const {
    eventId,
    nomeInvitato,
    emailInvitato,
    messaggioAugurio,
    deviceFingerprint,
    votoSesso,
    votoData,
    votoPeso,
    votoLunghezza,
    votoOra,
    votoCapelli,
    votoOcchi,
    votoCustomAnswers,
  } = parsed.data;

  try {
    // ── 2. Verifica esistenza evento e stato ──────────────────────────────────
    const evento = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, stato: true, isPremium: true, votiBloccati: true },
    });

    if (!evento) {
      return NextResponse.json(
        { success: false, error: "Evento non trovato" },
        { status: 404 }
      );
    }

    if (evento.stato !== "IN_CORSO") {
      const msg =
        evento.stato === "CONCLUSO"
          ? "Questo FantaParto è chiuso, il bambino è già nato!"
          : "La votazione è chiusa. I risultati saranno rivelati presto!";
      return NextResponse.json(
        { success: false, error: msg },
        { status: 400 }
      );
    }

    if (evento.votiBloccati) {
      return NextResponse.json(
        { success: false, error: "Le votazioni sono state temporaneamente chiuse dalla mamma. Torna presto! 🍼" },
        { status: 403 }
      );
    }

    // ── 3. Verifica voto duplicato (stesso dispositivo + stesso evento) ────────
    const votoDuplicato = await prisma.prediction.findFirst({
      where: { eventId, deviceFingerprint },
      select: { id: true },
    });

    if (votoDuplicato) {
      return NextResponse.json(
        { success: false, error: "Hai già espresso il tuo pronostico per questo evento!" },
        { status: 400 }
      );
    }

    // ── 4. Limite partecipanti piano gratuito (max 20) ────────────────────────
    if (!evento.isPremium) {
      const totaleVoti = await prisma.prediction.count({ where: { eventId } });
      if (totaleVoti >= 20) {
        return NextResponse.json(
          { success: false, error: "L'evento ha raggiunto il limite massimo di partecipanti gratis" },
          { status: 403 }
        );
      }
    }

    // ── 5. Salvataggio voto ───────────────────────────────────────────────────
    const prediction = await prisma.prediction.create({
      data: {
        eventId,
        nomeInvitato,
        emailInvitato: emailInvitato || undefined,
        messaggioAugurio: messaggioAugurio || undefined,
        deviceFingerprint,
        votoSesso: votoSesso ?? undefined,
        votoData: votoData ?? undefined,
        votoPeso: votoPeso ?? undefined,
        votoLunghezza: votoLunghezza ?? undefined,
        votoOra: votoOra ?? undefined,
        votoCapelli: votoCapelli ?? undefined,
        votoOcchi: votoOcchi ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        votoCustomAnswers: (votoCustomAnswers as any) ?? undefined,
      },
      select: {
        id: true,
        nomeInvitato: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pronostico salvato! In bocca al lupo alla mamma 🍀",
        data: prediction,
      },
      { status: 201 }
    );
  } catch (err) {
    // Race condition: dispositivo ha votato due volte in parallelo
    if (isPrismaError(err, "P2002")) {
      return NextResponse.json(
        { success: false, error: "Hai già espresso il tuo pronostico per questo evento!" },
        { status: 400 }
      );
    }

    console.error("[POST /api/v1/predict]", err);
    return NextResponse.json(
      { success: false, error: "Errore interno del server. Riprova tra qualche istante." },
      { status: 500 }
    );
  }
}
