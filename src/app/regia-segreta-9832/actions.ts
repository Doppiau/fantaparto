"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { assertAdmin } from "@/lib/admin";
import { redis, banIp } from "@/lib/ratelimit";

const BAN_PREFIX = "fp:ban:";

// ── Chiudi evento ─────────────────────────────────────────────────────────────

export async function closeEventAction(
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await assertAdmin();

    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: eventId },
        data: { stato: "CONCLUSO" },
      });

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          azione:  "CHIUDI_EVENTO",
          dettagli: `Evento ${eventId} forzato a CONCLUSO dalla Regia (${admin.email}).`,
        },
      });
    });

    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (err) {
    if (isPrismaError(err, "P2025")) {
      return { success: false, error: "Evento non trovato." };
    }
    const msg = err instanceof Error ? err.message : "Errore interno.";
    return { success: false, error: msg };
  }
}

// ── Toggle Premium Utente ─────────────────────────────────────────────────────
// Eleva o revoca il Premium a livello account + aggiorna tutti gli eventi

export async function toggleUserPremiumAction(
  userId: string,
  isPremium: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await assertAdmin();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { isPremium } });
      await tx.event.updateMany({ where: { userId }, data: { isPremium } });
      await tx.auditLog.create({
        data: {
          adminId:  admin.id,
          azione:   isPremium ? "UPGRADE_PREMIUM" : "REVOCA_PREMIUM",
          dettagli: `Utente ${userId} ${isPremium ? "elevato a" : "retrocesso da"} Premium dalla Regia (${admin.email}).`,
        },
      });
    });

    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Errore interno." };
  }
}

// ── Gift Premium su singolo evento ────────────────────────────────────────────

export async function giftEventPremiumAction(
  eventId: string,
  note: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await assertAdmin();

    await prisma.$transaction(async (tx) => {
      await tx.event.update({ where: { id: eventId }, data: { isPremium: true } });
      await tx.auditLog.create({
        data: {
          adminId:  admin.id,
          azione:   "GIFT_PREMIUM_EVENTO",
          dettagli: `Premium regalato all'evento ${eventId}. Nota: "${note || "nessuna"}" — (${admin.email}).`,
        },
      });
    });

    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Errore interno." };
  }
}

// ── Elimina evento ────────────────────────────────────────────────────────────

export async function deleteEventAction(
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await assertAdmin();

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          azione:  "ELIMINA_EVENTO",
          dettagli: `Evento ${eventId} eliminato dalla Regia (${admin.email}).`,
        },
      });

      // onDelete: Cascade rimuove automaticamente le Prediction collegate
      await tx.event.delete({ where: { id: eventId } });
    });

    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (err) {
    if (isPrismaError(err, "P2025")) {
      return { success: false, error: "Evento non trovato." };
    }
    const msg = err instanceof Error ? err.message : "Errore interno.";
    return { success: false, error: msg };
  }
}

// ── IP Ban Console ────────────────────────────────────────────────────────────

export async function fetchBannedIpsAction(): Promise<{
  success: boolean;
  ips?: { ip: string; ttl: number }[];
  error?: string;
}> {
  try {
    await assertAdmin();
    const keys: string[] = await redis.keys(`${BAN_PREFIX}*`);
    const ips = await Promise.all(
      keys.map(async (key) => ({
        ip:  key.replace(BAN_PREFIX, ""),
        ttl: await redis.ttl(key),
      })),
    );
    return { success: true, ips };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

export async function unbanIpAction(
  ip: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await assertAdmin();
    await redis.del(`${BAN_PREFIX}${ip}`);
    await prisma.auditLog.create({
      data: {
        adminId:  admin.id,
        azione:   "UNBAN_IP",
        dettagli: `IP ${ip} rimosso dalla blacklist dalla Regia (${admin.email}).`,
      },
    });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

export async function banIpManualAction(
  ip: string,
  ttlOre?: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await assertAdmin();
    await banIp(ip, ttlOre ? ttlOre * 3600 : null);
    await prisma.auditLog.create({
      data: {
        adminId:  admin.id,
        azione:   "BAN_IP",
        dettagli: `IP ${ip} bannato manualmente dalla Regia (${admin.email}). TTL: ${ttlOre ? `${ttlOre}h` : "permanente"}.`,
      },
    });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

// ── Radar Frodi ───────────────────────────────────────────────────────────────

export async function clearFlagSospettoAction(
  predictionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await assertAdmin();
    await prisma.$transaction(async (tx) => {
      await tx.prediction.update({
        where: { id: predictionId },
        data: { flagSospetto: false, motivazioneSospetto: null },
      });
      await tx.auditLog.create({
        data: {
          adminId:  admin.id,
          azione:   "CLEAR_FLAG_FRODE",
          dettagli: `Flag sospetto rimosso dalla prediction ${predictionId} dalla Regia (${admin.email}).`,
        },
      });
    });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

export async function deletePredictionAdminAction(
  predictionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await assertAdmin();
    await prisma.$transaction(async (tx) => {
      const p = await tx.prediction.delete({ where: { id: predictionId } });
      await tx.auditLog.create({
        data: {
          adminId:  admin.id,
          azione:   "ELIMINA_VOTO_FRODE",
          dettagli: `Voto di "${p.nomeInvitato}" (${predictionId}) eliminato per frode dalla Regia (${admin.email}).`,
        },
      });
    });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    if (isPrismaError(e, "P2025")) return { success: false, error: "Voto non trovato." };
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

export async function banIpFromPredictionAction(
  predictionId: string,
  ttlOre?: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await assertAdmin();
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
      select: { ipAddress: true, nomeInvitato: true },
    });
    if (!prediction?.ipAddress) {
      return { success: false, error: "IP non disponibile per questo voto." };
    }
    await banIp(prediction.ipAddress, ttlOre ? ttlOre * 3600 : null);
    await prisma.auditLog.create({
      data: {
        adminId:  admin.id,
        azione:   "BAN_IP_FRODE",
        dettagli: `IP ${prediction.ipAddress} (voto di "${prediction.nomeInvitato}") bannato dalla Regia (${admin.email}). TTL: ${ttlOre ? `${ttlOre}h` : "permanente"}.`,
      },
    });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

// ── Impersonazione (audit log) ────────────────────────────────────────────────

export async function logImpersonazioneAction(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await assertAdmin();
    await prisma.auditLog.create({
      data: {
        adminId:  admin.id,
        azione:   "IMPERSONA_UTENTE",
        dettagli: `Accesso sola lettura al profilo utente ${userId} dalla Regia (${admin.email}).`,
      },
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}
