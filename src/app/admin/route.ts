import { NextRequest, NextResponse } from "next/server";
import { banIp, getIpFromRequest } from "@/lib/ratelimit";

// Rotta trappola — chiunque tenti /admin o qualsiasi sotto-rotta viene:
//   1. Bannato su Redis per 24h (IP blocklist)
//   2. Riceve un finto 404 identico a quello di Next.js
// L'esistenza di questa rotta non deve mai essere rivelata pubblicamente.

const BAN_TTL_SECONDS = 86_400; // 24 ore

async function trap(req: NextRequest): Promise<NextResponse> {
  const ip = getIpFromRequest(req);

  // Ban silenzioso — non attendiamo la risposta per non rallentare il 404
  if (ip !== "unknown") {
    banIp(ip, BAN_TTL_SECONDS).catch((err) =>
      console.error("[admin-trap] ban fallito per IP", ip, err)
    );
  }

  return NextResponse.json({ message: "Not Found" }, { status: 404 });
}

export const GET     = trap;
export const POST    = trap;
export const PUT     = trap;
export const PATCH   = trap;
export const DELETE  = trap;
export const HEAD    = trap;
export const OPTIONS = trap;
