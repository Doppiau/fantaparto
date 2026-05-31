"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");
  return user.id;
}

async function verificaProprietario(eventId: string, userId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, userId } });
  if (!event) throw new Error("Evento non trovato o non autorizzato");
  return event;
}

/* ── Toggle categoria ─────────────────────────────────────── */

const TOGGLE_MAP: Record<string, string> = {
  sessoAttivo: "sessoAttivo",
  dataAttiva: "dataAttiva",
  pesoAttivo: "pesoAttivo",
  lunghezzaAttiva: "lunghezzaAttiva",
  oraAttiva: "oraAttiva",
  capelliAttivo: "capelliAttivo",
  occhiAttivo: "occhiAttivo",
};

export async function aggiornaToggleAction(eventId: string, key: string, valore: boolean) {
  const userId = await getAuthUserId();
  await verificaProprietario(eventId, userId);

  if (!TOGGLE_MAP[key]) throw new Error("Campo non valido");

  await prisma.event.update({
    where: { id: eventId },
    data: { [key]: valore },
  });

  revalidatePath(`/dashboard/${eventId}`);
}

/* ── Elimina prediction ───────────────────────────────────── */

export async function eliminaPredictionAction(eventId: string, predictionId: string) {
  const userId = await getAuthUserId();
  await verificaProprietario(eventId, userId);

  await prisma.prediction.deleteMany({
    where: { id: predictionId, eventId },
  });

  revalidatePath(`/dashboard/${eventId}`);
}

/* ── Inserisci risultati (atomico) ───────────────────────── */

const RisultatiSchema = z.object({
  sesso: z.enum(["MASCHIO", "FEMMINA"]).optional(),
  data: z.string().optional(),
  peso: z.string().optional(),
  ora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().or(z.literal("")),
});

export async function inserisciRisultatiAction(
  eventId: string,
  _prev: { error?: string; success: boolean },
  formData: FormData
): Promise<{ error?: string; success: boolean }> {
  try {
    const userId = await getAuthUserId();
    await verificaProprietario(eventId, userId);

    const raw = {
      sesso: formData.get("sesso") as string || undefined,
      data: formData.get("data") as string || undefined,
      peso: formData.get("peso") as string || undefined,
      ora: formData.get("ora") as string || undefined,
    };

    const parsed = RisultatiSchema.safeParse(raw);
    if (!parsed.success) return { error: "Dati non validi", success: false };

    const { sesso, data, peso, ora } = parsed.data;

    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: eventId },
        data: {
          stato: "CONCLUSO",
          realeSesso: sesso ?? null,
          realeData: data ? new Date(data) : null,
          realePeso: peso ? parseInt(peso) : null,
          realeOra: ora || null,
        },
      });
    });

    revalidatePath(`/dashboard/${eventId}`);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    return { error: msg, success: false };
  }
}
