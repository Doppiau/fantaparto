import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { CreateEventSchema } from "@/lib/validations";
import { isPrismaError } from "@/lib/prisma-errors";

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 0. Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Non autorizzato" },
      { status: 401 }
    );
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

    // ── 3a. Aggiorna nome mamma se fornito ────────────────────────────────────
    if (nomeMamma) {
      await prisma.user.upsert({
        where:  { id: userId },
        create: { id: userId, email: user.email ?? "", nome: nomeMamma },
        update: { nome: nomeMamma },
      });
    }

    // ── 3b. Creazione evento ──────────────────────────────────────────────────
    const evento = await prisma.event.create({
      data: {
        userId,
        nomeBimbo: nomeBimbo ?? undefined,
        dataPresuntaParto,
        codiceCondivisione,
        stato: "IN_CORSO",
        isPremium,
        sessoAttivo,
        dataAttiva,
        pesoAttivo,
        lunghezzaAttiva,
        oraAttiva,
        capelliAttivo,
        occhiAttivo,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        customQuestions: customQuestions as any ?? undefined,
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

    return NextResponse.json(
      { success: true, data: evento },
      { status: 201 }
    );
  } catch (err) {
    // P2002: race condition sul codice condivisione unico
    if (isPrismaError(err, "P2002")) {
      return NextResponse.json(
        { success: false, error: "Errore interno del server. Riprova tra qualche istante." },
        { status: 500 }
      );
    }

    // P2003: userId non esiste in users (FK violation — utente non autenticato correttamente)
    if (isPrismaError(err, "P2003")) {
      return NextResponse.json(
        { success: false, error: "Utente non trovato. Autenticati nuovamente." },
        { status: 401 }
      );
    }

    console.error("[POST /api/v1/event]", err);
    return NextResponse.json(
      { success: false, error: "Errore interno del server. Riprova tra qualche istante." },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  // TODO Fase 6: lista eventi dell'utente autenticato (richiede Supabase Auth JWT)
  return NextResponse.json(
    { success: false, error: "Non implementato" },
    { status: 501 }
  );
}
