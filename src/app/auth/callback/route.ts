import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { user } = data;

  // Sincronizza l'utente Supabase con la tabella users di Prisma.
  // Necessario perché Google OAuth bypassa la signup action,
  // che non crea il record Prisma.
  const nome: string =
    (user.user_metadata?.["full_name"] as string | undefined)?.slice(0, 80) ??
    (user.user_metadata?.["name"] as string | undefined)?.slice(0, 80) ??
    (user.email?.split("@")[0] ?? "Mamma").slice(0, 80);

  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email ?? `${user.id}@fantaparto.app`,
        nome,
      },
    });
  } catch {
    // Se l'upsert fallisce (es. email duplicata), lasciamo passare.
    // L'utente esiste già oppure gestiremo l'errore in app.
  }

  return NextResponse.redirect(`${origin}${next}`);
}
