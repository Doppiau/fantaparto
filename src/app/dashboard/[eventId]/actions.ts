"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { calcolaPunteggio } from "@/lib/scoring";

// ── Auth helpers ─────────────────────────────────────────────────────────────

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

// ── Toggle categoria ─────────────────────────────────────────────────────────

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
  await prisma.event.update({ where: { id: eventId }, data: { [key]: valore } });
  revalidatePath(`/dashboard/${eventId}`);
  revalidatePath("/dashboard/settings");
}

// ── Elimina evento ────────────────────────────────────────────────────────────

export async function eliminaEventoAction(eventId: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const userId = await getAuthUserId();
    await verificaProprietario(eventId, userId);
    // Elimina prediction e poi evento in transazione
    await prisma.$transaction([
      prisma.prediction.deleteMany({ where: { eventId } }),
      prisma.event.delete({ where: { id: eventId } }),
    ]);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── Elimina prediction ────────────────────────────────────────────────────────
// Transazione atomica: rimuove il voto e — poiché il deviceFingerprint è
// salvato nel record Prediction stesso — azzera automaticamente il blocco
// re-voto per quell'ospite. Il sistema "dimentica" che quell'invitato ha
// già partecipato; al suo prossimo accesso al link troverà il form attivo.

export async function eliminaPredictionAction(
  eventId: string,
  predictionId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const userId = await getAuthUserId();
    await verificaProprietario(eventId, userId);

    await prisma.$transaction([
      prisma.prediction.deleteMany({ where: { id: predictionId, eventId } }),
    ]);

    revalidatePath(`/dashboard/${eventId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── Aggiungi voto manuale ─────────────────────────────────────────────────────

const VotoManualeSchema = z.object({
  nomeInvitato:   z.string().trim().min(2).max(80),
  emailInvitato:  z.string().trim().email().optional().or(z.literal("")),
  votoSesso:      z.enum(["MASCHIO", "FEMMINA"]).optional(),
  votoData:       z.coerce.date().optional(),
  votoPeso:       z.number().int().min(1000).max(6000).optional(),
  votoLunghezza:  z.number().int().min(300).max(700).optional(),
  votoOra:        z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().or(z.literal("")),
  votoCapelli:    z.enum(["LISCI", "RICCI", "CALVO"]).optional(),
  votoOcchi:      z.enum(["CHIARI", "SCURI"]).optional(),
});

export async function aggiungiVotoManualeAction(
  eventId: string,
  raw: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const userId = await getAuthUserId();
    const evento = await verificaProprietario(eventId, userId);

    if (evento.stato !== "IN_CORSO") {
      return { success: false, error: "L'evento non è in corso." };
    }
    if (evento.votiBloccati) {
      return { success: false, error: "Le votazioni sono bloccate." };
    }

    // Rispetta il limite Free (20 voti)
    if (!evento.isPremium) {
      const totale = await prisma.prediction.count({ where: { eventId } });
      if (totale >= 20) {
        return { success: false, error: "Limite di 20 partecipanti del piano Free raggiunto." };
      }
    }

    const parsed = VotoManualeSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
    }

    const { nomeInvitato, emailInvitato, votoSesso, votoData, votoPeso, votoLunghezza, votoOra, votoCapelli, votoOcchi } = parsed.data;

    // Fingerprint univoco per i voti manuali — non entra in conflitto con dispositivi reali
    const fingerprint = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await prisma.prediction.create({
      data: {
        eventId,
        nomeInvitato,
        emailInvitato:    emailInvitato || undefined,
        deviceFingerprint: fingerprint,
        votoSesso:         votoSesso ?? undefined,
        votoData:          votoData  ?? undefined,
        votoPeso:          votoPeso  ?? undefined,
        votoLunghezza:     votoLunghezza ?? undefined,
        votoOra:           votoOra   || undefined,
        votoCapelli:       votoCapelli ?? undefined,
        votoOcchi:         votoOcchi ?? undefined,
      },
    });

    revalidatePath(`/dashboard/${eventId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── Inserisci risultati reali + calcolo classifica (atomico) ──────────────────

const RisultatiSchema = z.object({
  sesso:     z.enum(["MASCHIO", "FEMMINA"]).optional(),
  data:      z.string().min(1).optional(),
  peso:      z.string().optional(),
  ora:       z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().or(z.literal("")),
  lunghezza: z.string().optional(),
  capelli:   z.enum(["LISCI", "RICCI", "CALVO"]).optional(),
  occhi:     z.enum(["CHIARI", "SCURI"]).optional(),
});

export type ClassificaEntry = {
  id:           string;
  nomeInvitato: string;
  punteggio:    number;
};

type InserisciRisultatiResult =
  | { success: true;  classifica: ClassificaEntry[] }
  | { success: false; error: string };

export async function inserisciRisultatiAction(
  eventId: string,
  _prev: { success: boolean; error?: string },
  formData: FormData,
): Promise<InserisciRisultatiResult> {
  try {
    const userId = await getAuthUserId();
    await verificaProprietario(eventId, userId);

    // ── 1. Valida input ───────────────────────────────────────────────────────
    const raw = {
      sesso:     formData.get("sesso")     as string | null || undefined,
      data:      formData.get("data")      as string | null || undefined,
      peso:      formData.get("peso")      as string | null || undefined,
      ora:       formData.get("ora")       as string | null || undefined,
      lunghezza: formData.get("lunghezza") as string | null || undefined,
      capelli:   formData.get("capelli")   as string | null || undefined,
      occhi:     formData.get("occhi")     as string | null || undefined,
    };

    const parsed = RisultatiSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: "Dati non validi" };
    }

    const { sesso, data, peso, ora, lunghezza, capelli, occhi } = parsed.data;

    if (!sesso || !data) {
      return { success: false, error: "Sesso e data di nascita sono obbligatori." };
    }

    const realeData      = new Date(data);
    const realePeso      = peso      ? parseInt(peso, 10)      : null;
    const realeLunghezza = lunghezza ? parseInt(lunghezza, 10) : null;

    // ── 2. Transazione atomica ────────────────────────────────────────────────
    // updateMany con WHERE stato='IN_CORSO' funge da lock ottimistico:
    // se count=0 l'evento è già stato concluso da un'altra richiesta concorrente.
    const classifica = await prisma.$transaction(async (tx) => {
      const lock = await tx.event.updateMany({
        where: { id: eventId, stato: "IN_CORSO" },
        data: {
          stato:          "CONCLUSO",
          realeSesso:     sesso         ?? null,
          realeData:      realeData,
          realePeso:      realePeso,
          realeOra:       ora  || null,
          realeLunghezza: realeLunghezza,
          realeCapelli:   capelli       ?? null,
          realeOcchi:     occhi         ?? null,
        },
      });

      if (lock.count === 0) {
        throw new Error("L'evento è già stato concluso o non esiste.");
      }

      // Legge i toggle dell'evento per applicare le stesse regole di scoring
      const evento = await tx.event.findUniqueOrThrow({
        where: { id: eventId },
        select: {
          sessoAttivo:     true,
          dataAttiva:      true,
          oraAttiva:       true,
          pesoAttivo:      true,
          lunghezzaAttiva: true,
          capelliAttivo:   true,
          occhiAttivo:     true,
        },
      });

      // Legge tutti i voti
      const predictions = await tx.prediction.findMany({
        where: { eventId },
        select: {
          id:           true,
          nomeInvitato: true,
          votoSesso:    true,
          votoData:     true,
          votoOra:      true,
          votoPeso:     true,
          votoLunghezza:true,
          votoCapelli:  true,
          votoOcchi:    true,
        },
      });

      const risultatiReali = {
        realeSesso:     sesso         ?? null,
        realeData:      realeData,
        realeOra:       ora  || null,
        realePeso:      realePeso,
        realeLunghezza: realeLunghezza,
        realeCapelli:   capelli       ?? null,
        realeOcchi:     occhi         ?? null,
      };

      // Calcola e persiste i punteggi in parallelo
      await Promise.all(
        predictions.map((p) => {
          const { total } = calcolaPunteggio(risultatiReali, p, evento);
          return tx.prediction.update({
            where: { id: p.id },
            data:  { punteggioOttenuto: total },
          });
        }),
      );

      // Ritorna la classifica ordinata per il podio
      return predictions
        .map((p) => ({
          id:           p.id,
          nomeInvitato: p.nomeInvitato,
          punteggio:    calcolaPunteggio(risultatiReali, p, evento).total,
        }))
        .sort((a, b) => b.punteggio - a.punteggio);
    });

    revalidatePath(`/dashboard/${eventId}`);
    return { success: true, classifica };

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    return { success: false, error: msg };
  }
}
