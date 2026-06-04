"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");
  return { supabase, user };
}

async function verificaProprietario(eventId: string, userId: string) {
  const ev = await prisma.event.findFirst({ where: { id: eventId, userId } });
  if (!ev) throw new Error("Evento non trovato o non autorizzato");
  return ev;
}

// ── Tipi di ritorno comuni ────────────────────────────────────────────────────

type Result = { success: true } | { success: false; error: string };

// ── 0. Aggiorna nome genitore ─────────────────────────────────────────────────

const NomeGenitoreSchema = z.string().max(80);

export async function aggiornaNomeGenitoreAction(nome: string): Promise<Result> {
  try {
    const { user } = await getAuthUser();
    const trimmed = nome.trim();
    const parsed = NomeGenitoreSchema.safeParse(trimmed);
    if (!parsed.success) return { success: false, error: "Nome troppo lungo (max 80 caratteri)" };
    await prisma.user.update({
      where: { id: user.id },
      data:  { nome: trimmed || null },
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profilo");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 1. Aggiorna DPP ───────────────────────────────────────────────────────────

const DppSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida");

export async function aggiornaDppAction(eventId: string, data: string): Promise<Result> {
  try {
    const { user } = await getAuthUser();
    await verificaProprietario(eventId, user.id);
    const parsed = DppSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Formato data non valido" };
    await prisma.event.update({
      where: { id: eventId },
      data:  { dataPresuntaParto: new Date(parsed.data) },
    });
    revalidatePath(`/dashboard/${eventId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 2. Aggiorna nome bimbo ────────────────────────────────────────────────────

const NomeSchema = z.string().max(60);

export async function aggiornaNomeBimboAction(eventId: string, nome: string): Promise<Result> {
  try {
    const { user } = await getAuthUser();
    await verificaProprietario(eventId, user.id);
    const trimmed = nome.trim();
    const parsed = NomeSchema.safeParse(trimmed);
    if (!parsed.success) return { success: false, error: "Nome troppo lungo (max 60 caratteri)" };
    await prisma.event.update({
      where: { id: eventId },
      data:  { nomeBimbo: trimmed || null },
    });
    revalidatePath(`/dashboard/${eventId}`);
    revalidatePath(`/dashboard`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 3. Toggle switch evento (boolean fields) ──────────────────────────────────

const SWITCH_MAP: Record<string, string> = {
  votiBloccati:      "votiBloccati",
  classificaPrivata: "classificaPrivata",
  hypeSpaceAnonimo:  "hypeSpaceAnonimo",
  notificheVoto:     "notificheVoto",
  avvisoDpp:         "avvisoDpp",
};

export async function toggleSwitchEventoAction(
  eventId: string,
  campo: string,
  valore: boolean,
): Promise<Result> {
  try {
    const { user } = await getAuthUser();
    await verificaProprietario(eventId, user.id);
    if (!SWITCH_MAP[campo]) return { success: false, error: "Campo non valido" };
    await prisma.event.update({
      where: { id: eventId },
      data:  { [campo]: valore },
    });
    revalidatePath(`/dashboard/${eventId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 3b. Aggiorna tema colore evento ──────────────────────────────────────────

const TemaColoreEnum = z.enum(["ROSA", "CELESTE", "NEUTRO"]);

export async function aggiornaTemaColoreAction(eventId: string, tema: string): Promise<Result> {
  try {
    const { user } = await getAuthUser();
    await verificaProprietario(eventId, user.id);
    const parsed = TemaColoreEnum.safeParse(tema);
    if (!parsed.success) return { success: false, error: "Tema non valido" };
    await prisma.event.update({ where: { id: eventId }, data: { temaColore: parsed.data } });
    revalidatePath(`/dashboard/${eventId}`);
    revalidatePath("/dashboard/profilo");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 3c. Rinomina codice condivisione ─────────────────────────────────────────

const CodiceSchema = z.string()
  .min(3).max(40)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Usa solo lettere minuscole, numeri e trattini (es. baby-sofia)");

export async function aggiornaCodiceCondivisioneAction(eventId: string, codice: string): Promise<Result> {
  try {
    const { user } = await getAuthUser();
    await verificaProprietario(eventId, user.id);
    const trimmed = codice.trim().toLowerCase();
    const parsed  = CodiceSchema.safeParse(trimmed);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Codice non valido" };
    const existing = await prisma.event.findUnique({ where: { codiceCondivisione: trimmed } });
    if (existing && existing.id !== eventId) return { success: false, error: "Questo codice è già in uso" };
    await prisma.event.update({ where: { id: eventId }, data: { codiceCondivisione: trimmed } });
    revalidatePath(`/dashboard/${eventId}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profilo");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 3d. Archivia / Ripristina evento ─────────────────────────────────────────

export async function archiviaEventoAction(eventId: string, archiviato: boolean): Promise<Result> {
  try {
    const { user } = await getAuthUser();
    await verificaProprietario(eventId, user.id);
    await prisma.event.update({ where: { id: eventId }, data: { archiviato } });
    revalidatePath("/dashboard/eventi");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 3e. Duplica evento ───────────────────────────────────────────────────────

function generaCodiceRandom() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function duplicaEventoAction(
  eventId: string,
): Promise<{ success: true; nuovoId: string } | { success: false; error: string }> {
  try {
    const { user } = await getAuthUser();
    const orig = await verificaProprietario(eventId, user.id);

    // Genera un codice univoco
    let codice: string;
    let tentativi = 0;
    do {
      codice = `copia-${generaCodiceRandom().toLowerCase()}`;
      const dup = await prisma.event.findUnique({ where: { codiceCondivisione: codice } });
      if (!dup) break;
      tentativi++;
    } while (tentativi < 10);

    const nuovoEvento = await prisma.event.create({
      data: {
        userId:             user.id,
        codiceCondivisione: codice!,
        nomeBimbo:          orig.nomeBimbo,
        dataPresuntaParto:  orig.dataPresuntaParto,
        sessoAttivo:        orig.sessoAttivo,
        dataAttiva:         orig.dataAttiva,
        pesoAttivo:         orig.pesoAttivo,
        lunghezzaAttiva:    orig.lunghezzaAttiva,
        oraAttiva:          orig.oraAttiva,
        capelliAttivo:      orig.capelliAttivo,
        occhiAttivo:        orig.occhiAttivo,
        customQuestions:    orig.customQuestions ?? undefined,
        temaColore:         orig.temaColore,
        classificaPrivata:  orig.classificaPrivata,
        hypeSpaceAnonimo:   orig.hypeSpaceAnonimo,
      },
    });

    revalidatePath("/dashboard/eventi");
    revalidatePath("/dashboard");
    return { success: true, nuovoId: nuovoEvento.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 3f. Aggiorna digest notifiche ────────────────────────────────────────────

const DigestEnum = z.enum(["DISATTIVATO", "GIORNALIERO", "SETTIMANALE"]);

export async function aggiornaDigestNotificheAction(eventId: string, valore: string): Promise<Result> {
  try {
    const { user } = await getAuthUser();
    await verificaProprietario(eventId, user.id);
    const parsed = DigestEnum.safeParse(valore);
    if (!parsed.success) return { success: false, error: "Valore non valido" };
    await prisma.event.update({ where: { id: eventId }, data: { digestNotifiche: parsed.data } });
    revalidatePath("/dashboard/profilo");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 3g. Riscatta coupon ──────────────────────────────────────────────────────

export async function riscattaCouponAction(
  codice: string,
): Promise<{ success: true; messaggio: string } | { success: false; error: string }> {
  try {
    const { user } = await getAuthUser();

    const coupon = await prisma.coupon.findUnique({ where: { codice: codice.trim().toUpperCase() } });
    if (!coupon)            return { success: false, error: "Codice coupon non valido" };
    if (!coupon.attivo)     return { success: false, error: "Questo coupon non è più attivo" };
    if (coupon.scadenza && new Date() > coupon.scadenza)
                            return { success: false, error: "Coupon scaduto" };
    if (coupon.usoMax !== null && coupon.usoCorrente >= coupon.usoMax)
                            return { success: false, error: "Coupon esaurito" };

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { isPremium: true, couponRiscattato: true } });
    if (dbUser?.couponRiscattato) return { success: false, error: "Hai già usato un coupon" };

    if (coupon.tipo === "PREMIUM_USER") {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data:  { isPremium: true, couponRiscattato: coupon.codice, pianoAttivatoAt: new Date() },
        }),
        // Propaga il premium a tutti gli eventi esistenti dell'utente
        prisma.event.updateMany({
          where: { userId: user.id },
          data:  { isPremium: true },
        }),
        prisma.coupon.update({
          where: { id: coupon.id },
          data:  { usoCorrente: { increment: 1 } },
        }),
      ]);
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/profilo");
      return { success: true, messaggio: "Account aggiornato a Premium!" };
    }

    return { success: false, error: `Tipo coupon non gestito: ${coupon.tipo}` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 3h. Disconnetti tutti i dispositivi ──────────────────────────────────────

export async function disconnettiTuttiAction(): Promise<Result> {
  try {
    const { supabase } = await getAuthUser();
    await supabase.auth.signOut({ scope: "global" });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 4. Esporta dati (GDPR) ────────────────────────────────────────────────────

export async function esportaDatiAction(): Promise<
  { success: true; json: string } | { success: false; error: string }
> {
  try {
    const { user } = await getAuthUser();
    const dbUser = await prisma.user.findUnique({
      where:  { id: user.id },
      select: { id: true, email: true, nome: true, createdAt: true },
    });

    const eventi = await prisma.event.findMany({
      where:   { userId: user.id },
      select: {
        id: true, nomeBimbo: true, stato: true,
        dataPresuntaParto: true, createdAt: true,
        codiceCondivisione: true,
        _count: { select: { predictions: true } },
        predictions: {
          select: {
            id: true, nomeInvitato: true, emailInvitato: true,
            messaggioAugurio: true, votoSesso: true, votoData: true,
            votoPeso: true, votoOra: true, votoLunghezza: true,
            votoCapelli: true, votoOcchi: true, punteggioOttenuto: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const payload = {
      esportato_il: new Date().toISOString(),
      utente: dbUser,
      eventi,
    };

    return { success: true, json: JSON.stringify(payload, null, 2) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

// ── 5. Elimina account (GDPR — cascata completa) ─────────────────────────────

export async function eliminaAccountAction(): Promise<Result> {
  try {
    const { supabase, user } = await getAuthUser();

    // Elimina tutti i dati utente in cascata (events → predictions via onDelete: Cascade)
    await prisma.$transaction([
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    // Elimina l'utente da Supabase Auth
    // Usa il client di sessione: l'utente elimina se stesso tramite signOut
    // La rimozione lato Auth avviene via Admin API se disponibile, altrimenti
    // si esegue sign-out e i dati sono già stati rimossi dal DB.
    await supabase.auth.signOut();

    // Prova a eliminare l'account Auth via Admin se disponibile
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (serviceKey && supabaseUrl) {
      try {
        await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
          method:  "DELETE",
          headers: {
            "apikey":        serviceKey,
            "Authorization": `Bearer ${serviceKey}`,
          },
        });
      } catch { /* ignora se admin API non disponibile */ }
    }

  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }

  redirect("/");
}
