export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/v1/predict/status?eventId=X&fingerprint=Y
// Usato dal client di voto per sapere se il voto è ancora valido dopo
// che il genitore lo ha eliminato (senza resettare il localStorage).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const eventId     = searchParams.get("eventId");
  const fingerprint = searchParams.get("fingerprint");

  if (!eventId || !fingerprint) {
    return Response.json({ hasVoted: false });
  }

  try {
    const voto = await prisma.prediction.findFirst({
      where:  { eventId, deviceFingerprint: fingerprint },
      select: { id: true },
    });
    return Response.json({ hasVoted: !!voto });
  } catch {
    // In caso di errore DB, restituiamo false: il DB rimane il guard
    // definitivo in /api/v1/predict (constraint unique fingerprint+eventId).
    return Response.json({ hasVoted: false });
  }
}
