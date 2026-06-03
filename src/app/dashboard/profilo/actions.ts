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
