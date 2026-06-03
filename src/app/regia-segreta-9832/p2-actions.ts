"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";

type Result = { success: boolean; error?: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomCode(prefix = "", len = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return prefix ? `${prefix.toUpperCase()}-${suffix}` : suffix;
}

// ════════════════════════════════════════════════════════════════════════════
// COUPON
// ════════════════════════════════════════════════════════════════════════════

const CouponSchema = z.object({
  tipo:       z.enum(["PREMIUM_USER", "PREMIUM_EVENTO", "SCONTO_PCT"]),
  creatorTag: z.string().max(60).optional(),
  scontoPct:  z.number().int().min(1).max(100).optional(),
  usoMax:     z.number().int().min(1).optional(),
  scadenzaGg: z.number().int().min(1).optional(), // giorni da oggi
  note:       z.string().max(300).optional(),
  prefisso:   z.string().max(12).optional(),
});

export async function creaCouponAction(
  data: z.infer<typeof CouponSchema>,
): Promise<Result & { codice?: string }> {
  try {
    const admin = await assertAdmin();
    const parsed = CouponSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dati non validi" };

    const { tipo, creatorTag, scontoPct, usoMax, scadenzaGg, note, prefisso } = parsed.data;
    const codice = randomCode(prefisso || creatorTag?.slice(0, 8) || "FP");
    const scadenza = scadenzaGg
      ? new Date(Date.now() + scadenzaGg * 86_400_000)
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.coupon.create({
        data: { codice, tipo, creatorTag: creatorTag ?? null, scontoPct: scontoPct ?? null, usoMax: usoMax ?? null, scadenza, note: note ?? null },
      });
      await tx.auditLog.create({
        data: {
          adminId:  admin.id,
          azione:   "CREA_COUPON",
          dettagli: `Coupon ${codice} (${tipo}) creato dalla Regia (${admin.email}).`,
        },
      });
    });

    revalidatePath("/regia-segreta-9832");
    return { success: true, codice };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

export async function disattivaCouponAction(id: string): Promise<Result> {
  try {
    const admin = await assertAdmin();
    await prisma.$transaction(async (tx) => {
      const c = await tx.coupon.update({ where: { id }, data: { attivo: false } });
      await tx.auditLog.create({
        data: {
          adminId:  admin.id,
          azione:   "DISATTIVA_COUPON",
          dettagli: `Coupon ${c.codice} disattivato dalla Regia (${admin.email}).`,
        },
      });
    });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

export async function eliminaCouponAction(id: string): Promise<Result> {
  try {
    const admin = await assertAdmin();
    await prisma.$transaction(async (tx) => {
      const c = await tx.coupon.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          adminId:  admin.id,
          azione:   "ELIMINA_COUPON",
          dettagli: `Coupon ${c.codice} eliminato dalla Regia (${admin.email}).`,
        },
      });
    });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CAMPAGNE INFLUENCER
// ════════════════════════════════════════════════════════════════════════════

const CampagnaSchema = z.object({
  nome:      z.string().min(2).max(80),
  codiceRif: z.string().min(2).max(30).regex(/^[A-Z0-9_-]+$/, "Solo lettere maiuscole, numeri, - e _"),
  note:      z.string().max(300).optional(),
});

export async function creaCampagnaAction(
  data: z.infer<typeof CampagnaSchema>,
): Promise<Result> {
  try {
    const admin = await assertAdmin();
    const parsed = CampagnaSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { nome, codiceRif, note } = parsed.data;
    await prisma.$transaction(async (tx) => {
      await tx.campagnaInfluencer.create({
        data: { nome, codiceRif, note: note ?? null },
      });
      await tx.auditLog.create({
        data: {
          adminId:  admin.id,
          azione:   "CREA_CAMPAGNA",
          dettagli: `Campagna "${nome}" (ref: ${codiceRif}) creata dalla Regia (${admin.email}).`,
        },
      });
    });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore";
    return { success: false, error: msg.includes("Unique") ? "Codice riferimento già esistente" : msg };
  }
}

export async function toggleCampagnaAction(id: string, attiva: boolean): Promise<Result> {
  try {
    await assertAdmin();
    await prisma.campagnaInfluencer.update({ where: { id }, data: { attiva } });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

export async function eliminaCampagnaAction(id: string): Promise<Result> {
  try {
    const admin = await assertAdmin();
    await prisma.$transaction(async (tx) => {
      const c = await tx.campagnaInfluencer.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          adminId:  admin.id,
          azione:   "ELIMINA_CAMPAGNA",
          dettagli: `Campagna "${c.nome}" (ref: ${c.codiceRif}) eliminata dalla Regia (${admin.email}).`,
        },
      });
    });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

// ── Tracciamento click (chiamata da API pubblica) ──────────────────────────

export async function trackRefClickAction(codiceRif: string): Promise<void> {
  try {
    await prisma.campagnaInfluencer.updateMany({
      where: { codiceRif, attiva: true },
      data:  { click: { increment: 1 } },
    });
  } catch { /* silenzioso */ }
}

export async function trackRefConversionAction(codiceRif: string): Promise<void> {
  try {
    await prisma.campagnaInfluencer.updateMany({
      where: { codiceRif, attiva: true },
      data:  { conversioni: { increment: 1 } },
    });
  } catch { /* silenzioso */ }
}

// ════════════════════════════════════════════════════════════════════════════
// LINK AFFILIAZIONE (Lista Nascita Intelligente — B2B2C)
// ════════════════════════════════════════════════════════════════════════════

const LinkAffiliazioneSchema = z.object({
  nome:            z.string().min(2).max(120),
  partner:         z.enum(["AMAZON", "NIDODIGRAZIA", "ALTRO"]),
  url:             z.string().url().max(2000),
  tagTracciamento: z.string().min(1).max(80),
  categoria:       z.string().max(60).optional(),
  commissioni:     z.number().min(0).optional(),
  note:            z.string().max(300).optional(),
});

export async function creaLinkAffiliazioneAction(
  data: z.infer<typeof LinkAffiliazioneSchema>,
): Promise<Result> {
  try {
    const admin = await assertAdmin();
    const parsed = LinkAffiliazioneSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { nome, partner, url, tagTracciamento, categoria, commissioni, note } = parsed.data;
    await prisma.$transaction(async (tx) => {
      await tx.linkAffiliazione.create({
        data: { nome, partner, url, tagTracciamento, categoria: categoria ?? null, commissioni: commissioni ?? null, note: note ?? null },
      });
      await tx.auditLog.create({
        data: {
          adminId:  admin.id,
          azione:   "CREA_LINK_AFFILIAZIONE",
          dettagli: `Link "${nome}" (${partner}) aggiunto dalla Regia (${admin.email}).`,
        },
      });
    });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

export async function toggleLinkAffiliazioneAction(id: string, attivo: boolean): Promise<Result> {
  try {
    await assertAdmin();
    await prisma.linkAffiliazione.update({ where: { id }, data: { attivo } });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

export async function eliminaLinkAffiliazioneAction(id: string): Promise<Result> {
  try {
    const admin = await assertAdmin();
    await prisma.$transaction(async (tx) => {
      const l = await tx.linkAffiliazione.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          adminId:  admin.id,
          azione:   "ELIMINA_LINK_AFFILIAZIONE",
          dettagli: `Link "${l.nome}" (${l.partner}) eliminato dalla Regia (${admin.email}).`,
        },
      });
    });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

export async function aggiornaCommissioniAction(id: string, commissioni: number): Promise<Result> {
  try {
    await assertAdmin();
    if (commissioni < 0) return { success: false, error: "Valore non valido" };
    await prisma.linkAffiliazione.update({ where: { id }, data: { commissioni } });
    revalidatePath("/regia-segreta-9832");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore" };
  }
}

export async function trackAffiliateLinkClickAction(id: string): Promise<void> {
  try {
    await prisma.linkAffiliazione.update({
      where: { id, attivo: true },
      data:  { click: { increment: 1 } },
    });
  } catch { /* silenzioso */ }
}
