"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { assertAdmin } from "@/lib/admin";

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
