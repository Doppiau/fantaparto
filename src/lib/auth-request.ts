import { NextRequest } from "next/server";

function decodeJwtPayload(token: string): { sub?: string; email?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export type AuthError = { reason: string };

export async function getUserFromRequest(req: NextRequest): Promise<{ id: string; email: string } | AuthError | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return { reason: "header Authorization assente" };
  if (!auth.startsWith("Bearer ")) return { reason: `header malformato: ${auth.substring(0, 30)}` };

  const token = auth.slice(7);
  if (!token) return { reason: "token vuoto dopo Bearer" };

  const tokenPreview = token.substring(0, 20);

  const payload = decodeJwtPayload(token);
  if (!payload) return { reason: `JWT non decodificabile (token inizia con: ${tokenPreview})` };
  if (!payload.sub) return { reason: `JWT senza sub (token inizia con: ${tokenPreview})` };

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return { reason: `token scaduto ${new Date(payload.exp * 1000).toISOString()} (ora: ${new Date().toISOString()})` };
  }

  return { id: payload.sub, email: payload.email ?? "" };
}
