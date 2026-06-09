import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { CreateEventSchema } from "@/lib/validations";
import { isPrismaError } from "@/lib/prisma-errors";
import { getUserFromRequest } from "@/lib/auth-request";
import { withCors, optionsResponse } from "@/lib/cors";

// Charset senza caratteri ambigui (0/O, 1/l/I) per leggibilità su WhatsApp
const CODICE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const CODICE_LENGTH = 6;

function generaCodiceCondivisione(): string {
  let codice = "";
  for (let i = 0; i < CODICE_LENGTH; i++) {
    codice += CODICE_CHARSET[Math.floor(Math.random() * CODICE_CHARSET.length)];
  }
  return codice;
}

// Schema wrapper: aggiunge nomeMamma (aggiorna User.nome come side-effect)
const PostBodySchema = CreateEventSchema.extend({
  nomeMamma: z.string().min(2).max(50).optional(),
});

// ── Auth helper: accetta sia cookie (web) che Bearer token (app) ──────────────
async function getAuthUser(req: NextRequest): Promise<{ id: string; email: string } | null> {
  // Prova prima Bearer token (app mobile)
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const result = await getUserFromRequest(req);
    if (result && !("reason" in result)) return result;
  }
  // Fallback: cookie Supabase (web)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { id: user.id, email: user.email ?? "" };
  return null;
}

async function getAuthError(req: NextRequest): Promise<string> {
  const result = await getUserFromRequest(req);
  if (!result) return "nessun risultato";
  if ("reason" in result) return result.reason;
  return "ok";
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    const reason = await getAuthError(req);
    return withCors(NextResponse.json({ success: false, error: `Non autorizzato: ${reason}` }, { status: 401 }));
  }

  try {
    const eventi = await prisma.event.findMany({
      where: { userId: user.id, archiviato: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nomeBimbo: true,
        codiceCondivisione: true,
        dataPresuntaParto: true,
        stato: true,
        isPremium: true,
        sessoAttivo: true,
        dataAttiva: true,
        pesoAttivo: true,
        lunghezzaAttiva: true,
        oraAttiva: true,
        capelliAttivo: true,
        occhiAttivo: true,
        createdAt: true,
        _count: { select: { predictions: true } },
      },
    });
    const eventiMapped = eventi.map(({ _count, ...e }) => ({ ...e, count: _count }));
    return withCors(NextResponse.json({ success: true, data: eventiMapped }));
  } catch (err) {
    console.error("[GET /api/v1/event]", err);
    return withCors(NextResponse.json({ success: false, error: "Errore interno" }, { status: 500 }));
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 0. Auth ──────────────────────────────────────────────────────────────────
  const user = await getAuthUser(req);
  if (!user) {
    return withCors(NextResponse.json(
      { success: false, error: "Non autorizzato" },
      { status: 401 }
    ));
  }

  // ── 1. Parse e validazione input ────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Corpo della richiesta non valido (JSON malformato)" },
      { status: 400 }
    );
  }

  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Dati non validi", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const {
    nomeBimbo,
    dataPresuntaParto,
    isPremium,
    sessoAttivo,
    dataAttiva,
    pesoAttivo,
    lunghezzaAttiva,
    oraAttiva,
    capelliAttivo,
    occhiAttivo,
    customQuestions,
    nomeMamma,
  } = parsed.data;

  const userId = user.id;

  try {
    // ── 2. Genera codice condivisione unico (max 5 tentativi) ─────────────────
    let codiceCondivisione = "";
    for (let i = 0; i < 5; i++) {
      const candidato = generaCodiceCondivisione();
      const esiste = await prisma.event.findUnique({
        where: { codiceCondivisione: candidato },
        select: { id: true },
      });
      if (!esiste) {
        codiceCondivisione = candidato;
        break;
      }
    }

    if (!codiceCondivisione) {
      console.error("[POST /api/v1/event] Impossibile generare un codice unico dopo 5 tentativi");
      return NextResponse.json(
        { success: false, error: "Errore interno del server. Riprova tra qualche istante." },
        { status: 500 }
      );
    }

    // ── 3a. Crea utente se non esiste; aggiorna nome solo se ancora vuoto ───────
    if (nomeMamma) {
      // upsert: crea se non esiste, non tocca nulla se esiste già
      await prisma.user.upsert({
        where:  { id: userId },
        create: { id: userId, email: user.email ?? "", nome: nomeMamma },
        update: {},
      });
      // Imposta nome solo se il profilo è ancora senza nome
      await prisma.user.updateMany({
        where: { id: userId, nome: null },
        data:  { nome: nomeMamma },
      });
    }

    // ── 3b. Leggi isPremium reale dal DB (non dal body — prevenire bypass client) ─
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { isPremium: true } });
    const userIsPremium = dbUser?.isPremium ?? false;

    // Se l'utente non è Premium, forza le metriche avanzate a false
    const metricheFinali = userIsPremium
      ? { sessoAttivo, dataAttiva, pesoAttivo, lunghezzaAttiva, oraAttiva, capelliAttivo, occhiAttivo }
      : { sessoAttivo, dataAttiva, pesoAttivo, lunghezzaAttiva: false, oraAttiva: false, capelliAttivo: false, occhiAttivo: false };

    // ── 3c. Creazione evento ──────────────────────────────────────────────────
    const evento = await prisma.event.create({
      data: {
        userId,
        nomeBimbo: nomeBimbo ?? undefined,
        dataPresuntaParto,
        codiceCondivisione,
        stato: "IN_CORSO",
        isPremium: userIsPremium,
        ...metricheFinali,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        customQuestions: (userIsPremium ? customQuestions : undefined) as any ?? undefined,
      },
      select: {
        id: true,
        codiceCondivisione: true,
        nomeBimbo: true,
        dataPresuntaParto: true,
        stato: true,
        isPremium: true,
        sessoAttivo: true,
        dataAttiva: true,
        pesoAttivo: true,
        lunghezzaAttiva: true,
        oraAttiva: true,
        capelliAttivo: true,
        occhiAttivo: true,
        createdAt: true,
      },
    });

    return withCors(NextResponse.json(
      { success: true, data: evento },
      { status: 201 }
    ));
  } catch (err) {
    if (isPrismaError(err, "P2002")) {
      return withCors(NextResponse.json(
        { success: false, error: "Errore interno del server. Riprova tra qualche istante." },
        { status: 500 }
      ));
    }
    if (isPrismaError(err, "P2003")) {
      return withCors(NextResponse.json(
        { success: false, error: "Utente non trovato. Autenticati nuovamente." },
        { status: 401 }
      ));
    }
    console.error("[POST /api/v1/event]", err);
    return withCors(NextResponse.json(
      { success: false, error: "Errore interno del server. Riprova tra qualche istante." },
      { status: 500 }
    ));
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    return withCors(NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 }));
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return withCors(NextResponse.json({ success: false, error: "Parametro id mancante" }, { status: 400 }));
  }

  const evento = await prisma.event.findUnique({ where: { id }, select: { userId: true } });
  if (!evento || evento.userId !== user.id) {
    return withCors(NextResponse.json({ success: false, error: "Evento non trovato" }, { status: 404 }));
  }

  await prisma.event.delete({ where: { id } });
  return withCors(NextResponse.json({ success: true }));
}
