import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-request";
import { withCors, optionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const result = await getUserFromRequest(req);
  if (!result || "reason" in result) {
    const reason = result && "reason" in result ? result.reason : "nessun risultato";
    return withCors(NextResponse.json({ success: false, error: `Non autorizzato: ${reason}` }, { status: 401 }));
  }
  const user = result;

  let nome: string | undefined;
  try {
    const body = await req.json();
    nome = typeof body?.nome === "string" ? body.nome.trim() : undefined;
  } catch {
    // body assente o non JSON — non è un errore
  }

  const email = user.email ?? "";

  let dbUser;
  try {
    dbUser = await prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email, nome: nome ?? null },
      update: { ...(nome ? { nome } : {}) },
      select: {
        id: true, email: true, nome: true,
        avatarUrl: true, isPremium: true,
        couponRiscattato: true, createdAt: true,
      },
    });
  } catch (err: unknown) {
    const isPrismaUniqueError =
      typeof err === "object" && err !== null &&
      "code" in err && (err as { code: string }).code === "P2002";

    if (!isPrismaUniqueError) throw err;

    dbUser = await prisma.user.update({
      where: { email },
      data: { id: user.id, ...(nome ? { nome } : {}) },
      select: {
        id: true, email: true, nome: true,
        avatarUrl: true, isPremium: true,
        couponRiscattato: true, createdAt: true,
      },
    });
  }

  return withCors(NextResponse.json({ success: true, data: dbUser }));
}
