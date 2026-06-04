import { NextRequest, NextResponse } from "next/server";

// QR code generator via Google Charts API (nessuna dipendenza aggiuntiva)
// La richiesta è server-side, non espone URL grezzi al client
export async function GET(req: NextRequest) {
  const url      = req.nextUrl.searchParams.get("url");
  const download = req.nextUrl.searchParams.get("download") === "1";

  if (!url) return NextResponse.json({ error: "url mancante" }, { status: 400 });

  // Validazione: accetta solo URL di fantaparto.com/vota/*
  let parsed: URL;
  try { parsed = new URL(url); } catch { return NextResponse.json({ error: "URL non valido" }, { status: 400 }); }
  if (parsed.hostname !== "fantaparto.com" || !parsed.pathname.startsWith("/vota/")) {
    return NextResponse.json({ error: "URL non autorizzato" }, { status: 403 });
  }

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=300x300&margin=10&format=png`;

  const upstream = await fetch(qrApiUrl, { next: { revalidate: 86400 } });
  if (!upstream.ok) return NextResponse.json({ error: "Generazione QR fallita" }, { status: 502 });

  const buffer = await upstream.arrayBuffer();
  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=86400",
  };
  if (download) {
    headers["Content-Disposition"] = "attachment; filename=qr-fantaparto.png";
  }
  return new NextResponse(buffer, { headers });
}
