"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";

// ID admin fisso per l'AuditLog — Fase 7: sostituire con Supabase Auth JWT
const SYSTEM_ADMIN_ID = "regia-system";

// ── Chiudi evento ─────────────────────────────────────────────────────────────

export async function closeEventAction(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: eventId },
        data: { stato: "CONCLUSO" },
      });

      await tx.auditLog.create({
        data: {
          adminId: SYSTEM_ADMIN_ID,
          azione: "CHIUDI_EVENTO",
          dettagli: `Evento ${eventId} forzato a CONCLUSO dalla Regia.`,
        },
      });
    });

    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (err) {
    if (isPrismaError(err, "P2025")) {
      return { success: false, error: "Evento non trovato." };
    }
    console.error("[closeEventAction]", err);
    return { success: false, error: "Errore interno." };
  }
}

// ── Elimina evento ────────────────────────────────────────────────────────────

export async function deleteEventAction(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // AuditLog scritto prima della delete (cascade eliminerebbe i dati collegati)
      await tx.auditLog.create({
        data: {
          adminId: SYSTEM_ADMIN_ID,
          azione: "ELIMINA_EVENTO",
          dettagli: `Evento ${eventId} eliminato dalla Regia.`,
        },
      });

      // onDelete: Cascade elimina automaticamente le Prediction associate
      await tx.event.delete({ where: { id: eventId } });
    });

    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (err) {
    if (isPrismaError(err, "P2025")) {
      return { success: false, error: "Evento non trovato." };
    }
    console.error("[deleteEventAction]", err);
    return { success: false, error: "Errore interno." };
  }
}
