import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-request";
import { createClient } from "@/lib/supabase/server";
import { calcolaPunteggio } from "@/lib/scoring";
import { notificaEnatoAi } from "@/lib/notifications";
import { withCors, optionsResponse } from "@/lib/cors";

async function getAuthUser(req: NextRequest): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const result = await getUserFromRequest(req);
    if (result && !("reason" in result)) return result;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { id: user.id, email: user.email ?? "" };
  return null;
}

const BodySchema = z.object({
  realeSesso:     z.enum(["MASCHIO", "FEMMINA"]),
  realeData:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  realePeso:      z.number().int().min(500).max(6000).nullable().optional(),
  realeLunghezza: z.number().int().min(200).max(800).nullable().optional(),
  realeOra:       z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  realeCapelli:   z.enum(["LISCI", "RICCI", "CALVO"]).nullable().optional(),
  realeOcchi:     z.enum(["CHIARI", "SCURI"]).nullable().optional(),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    return withCors(NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 }));
  }

  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return withCors(NextResponse.json({ success: false, error: "eventId richiesto" }, { status: 400 }));
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return withCors(NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 422 }));
  }

  const { realeSesso, realeData, realePeso, realeLunghezza, realeOra, realeCapelli, realeOcchi } = parsed.data;

  const evento = await prisma.event.findFirst({ where: { id: eventId, userId: user.id } });
  if (!evento) {
    return withCors(NextResponse.json({ success: false, error: "Evento non trovato o non autorizzato" }, { status: 404 }));
  }

  try {
    const classifica = await prisma.$transaction(async (tx) => {
      const lock = await tx.event.updateMany({
        where: { id: eventId, stato: "IN_CORSO" },
        data: {
          stato:          "CONCLUSO",
          realeSesso,
          realeData:      new Date(realeData),
          realePeso:      realePeso ?? null,
          realeLunghezza: realeLunghezza ?? null,
          realeOra:       realeOra ?? null,
          realeCapelli:   realeCapelli ?? null,
          realeOcchi:     realeOcchi ?? null,
        },
      });

      if (lock.count === 0) {
        throw new Error("L'evento è già stato concluso o non esiste.");
      }

      const toggles = await tx.event.findUniqueOrThrow({
        where: { id: eventId },
        select: {
          sessoAttivo: true, dataAttiva: true, oraAttiva: true,
          pesoAttivo: true, lunghezzaAttiva: true, capelliAttivo: true, occhiAttivo: true,
        },
      });

      const predictions = await tx.prediction.findMany({
        where: { eventId },
        select: {
          id: true, nomeInvitato: true,
          votoSesso: true, votoData: true, votoOra: true,
          votoPeso: true, votoLunghezza: true, votoCapelli: true, votoOcchi: true,
        },
      });

      const risultatiReali = {
        realeSesso,
        realeData:      new Date(realeData),
        realeOra:       realeOra ?? null,
        realePeso:      realePeso ?? null,
        realeLunghezza: realeLunghezza ?? null,
        realeCapelli:   realeCapelli ?? null,
        realeOcchi:     realeOcchi ?? null,
      };

      await Promise.all(
        predictions.map((p) => {
          const { total } = calcolaPunteggio(risultatiReali, p, toggles);
          return tx.prediction.update({ where: { id: p.id }, data: { punteggioOttenuto: total } });
        }),
      );

      return predictions
        .map((p, i) => ({
          id:              p.id,
          nomeInvitato:    p.nomeInvitato,
          punteggioOttenuto: calcolaPunteggio(risultatiReali, p, toggles).total,
          votoSesso:       p.votoSesso,
          votoPeso:        p.votoPeso,
          votoData:        p.votoData?.toISOString().split("T")[0] ?? null,
          posizione:       i + 1,
        }))
        .sort((a, b) => b.punteggioOttenuto - a.punteggioOttenuto)
        .map((e, i) => ({ ...e, posizione: i + 1 }));
    });

    // Email "È nato/a!" agli invitati — fire-and-forget
    prisma.prediction.findMany({
      where: { eventId, emailInvitato: { not: null } },
      select: { emailInvitato: true, nomeInvitato: true, punteggioOttenuto: true },
    }).then((preds) => {
      const sorted = [...preds].sort((a, b) => (b.punteggioOttenuto ?? 0) - (a.punteggioOttenuto ?? 0));
      const invitati = sorted
        .filter((p) => p.emailInvitato)
        .map((p, i) => ({
          email:     p.emailInvitato!,
          nome:      p.nomeInvitato,
          posizione: i + 1,
          punteggio: p.punteggioOttenuto ?? 0,
        }));
      if (invitati.length > 0) {
        notificaEnatoAi(invitati, evento.nomeBimbo, realeSesso === "FEMMINA", evento.codiceCondivisione)
          .catch(console.error);
      }
    }).catch(console.error);

    return withCors(NextResponse.json({ success: true, data: classifica }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    return withCors(NextResponse.json({ success: false, error: msg }, { status: 500 }));
  }
}
