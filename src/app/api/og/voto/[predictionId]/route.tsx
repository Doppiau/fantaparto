import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function loadLogo(): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ predictionId: string }> },
) {
  const { predictionId } = await params;

  const prediction = await prisma.prediction.findUnique({
    where:  { id: predictionId },
    select: {
      votoSesso:       true,
      votoData:        true,
      votoPeso:        true,
      messaggioAugurio: true,
      event: {
        select: {
          nomeBimbo:          true,
          codiceCondivisione: true,
        },
      },
    },
  });

  if (!prediction) return new Response("Not found", { status: 404 });

  const logoSrc = loadLogo();

  // ── Dati dinamici ────────────────────────────────────────────────────────────
  const nomeBaby   = prediction.event.nomeBimbo ? `Baby ${prediction.event.nomeBimbo}` : "FantaParto";
  const codice     = prediction.event.codiceCondivisione;
  const voteUrl    = `https://fantaparto.com/vota/${codice}`;

  const isMaschio  = prediction.votoSesso === "MASCHIO";
  const isFemmina  = prediction.votoSesso === "FEMMINA";
  const testoSesso = isMaschio ? "TEAM MASCHIO" : isFemmina ? "TEAM FEMMINA" : null;

  const dataLabel  = prediction.votoData
    ? new Date(prediction.votoData).toLocaleDateString("it-IT", { day: "numeric", month: "short" })
    : null;

  const pesoLabel  = prediction.votoPeso
    ? `${(prediction.votoPeso / 1000).toFixed(2).replace(".", ",")} kg`
    : null;

  const messaggio  = prediction.messaggioAugurio
    ? prediction.messaggioAugurio.slice(0, 28) + (prediction.messaggioAugurio.length > 28 ? "…" : "")
    : null;

  // Bolle colori: maschio = blu, femmina = rosa
  const bubbleBg   = isMaschio
    ? "radial-gradient(circle at 38% 32%, #c8eaff 0%, #5fb3e8 35%, #1565c0 100%)"
    : isFemmina
    ? "radial-gradient(circle at 38% 32%, #ffd4ec 0%, #f296c2 35%, #c2185b 100%)"
    : "radial-gradient(circle at 38% 32%, #e0e0e0 0%, #aaa 35%, #555 100%)";
  const bubbleGlow = isMaschio
    ? "0 0 72px rgba(91,179,232,0.75), 0 0 150px rgba(91,179,232,0.35)"
    : isFemmina
    ? "0 0 72px rgba(242,150,194,0.75), 0 0 150px rgba(242,150,194,0.35)"
    : "0 0 40px rgba(160,160,160,0.50)";
  const bubbleIcon = isMaschio ? "🍼" : isFemmina ? "🎀" : "👶";

  // ── QR code ──────────────────────────────────────────────────────────────────
  let qrSrc = "";
  try {
    const qrRes = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(voteUrl)}&bgcolor=0d0d1a&color=ffffff&format=png&margin=8`,
      { signal: AbortSignal.timeout(3000) },
    );
    const buf = await qrRes.arrayBuffer();
    qrSrc = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
  } catch { /* skip QR se offline */ }

  // ── Pillole bottom: solo le slot con dati ────────────────────────────────────
  const pillole: { icon: string; text: string }[] = [];
  if (dataLabel)  pillole.push({ icon: "📅", text: dataLabel });
  if (pesoLabel)  pillole.push({ icon: "⚖️", text: pesoLabel });
  if (messaggio)  pillole.push({ icon: "💬", text: messaggio });

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%",
        background: "#0d0d1a",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        padding: "88px 64px 80px",
        position: "relative", overflow: "hidden",
        fontFamily: "sans-serif",
      }}>

        {/* ── Bolle bokeh sfondo ───────────────────────────────────────────── */}
        <div style={{ position: "absolute", top: -180, left: -180, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(220,50,50,0.28), transparent 68%)", display: "flex" }} />
        <div style={{ position: "absolute", top: -80, right: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,185,0,0.22), transparent 68%)", display: "flex" }} />
        <div style={{ position: "absolute", top: "40%", left: -100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,80,80,0.13), transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -120, right: -100, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,195,0,0.18), transparent 68%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: "30%", left: -80, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(60,80,220,0.14), transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", top: "55%", right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(180,50,200,0.12), transparent 70%)", display: "flex" }} />

        {/* ── Logo + nome evento ───────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {logoSrc ? (
            <img src={logoSrc} width={200} height={200} style={{ display: "block", filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.50))" }} />
          ) : (
            <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: "-2px", display: "flex" }}>
              <span style={{ color: "#ff9f45" }}>Fanta</span><span style={{ color: "#ffffff" }}>Parto</span>
            </div>
          )}
          <div style={{ fontSize: 38, fontWeight: 700, color: "rgba(255,255,255,0.80)", display: "flex" }}>
            {nomeBaby}
          </div>
        </div>

        {/* ── Card glassmorphism principale ───────────────────────────────── */}
        <div style={{
          width: "100%",
          background: "rgba(255,255,255,0.065)",
          border: "1.5px solid rgba(255,255,255,0.13)",
          borderRadius: 44,
          padding: "48px 40px 44px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 36,
        }}>
          {/* Titolo card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em", textTransform: "uppercase", display: "flex" }}>
              I MIEI PRONOSTICI PER
            </span>
            <span style={{ fontSize: 34, fontWeight: 900, color: "#ffffff", letterSpacing: "0.03em", textTransform: "uppercase", display: "flex" }}>
              {nomeBaby.toUpperCase()}!
            </span>
          </div>

          {/* Bolla sesso */}
          {testoSesso ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <div style={{
                width: 290, height: 290,
                borderRadius: "50%",
                background: bubbleBg,
                boxShadow: bubbleGlow,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                <span style={{ fontSize: 56, display: "flex" }}>{bubbleIcon}</span>
                <span style={{ fontSize: 44, fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "0.02em", display: "flex" }}>
                  {testoSesso.split(" ")[0]}
                </span>
                <span style={{ fontSize: 44, fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "0.02em", display: "flex" }}>
                  {testoSesso.split(" ")[1]}
                </span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 500, color: "rgba(255,255,255,0.50)", display: "flex" }}>
                Ho puntato sul…
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 80, display: "flex" }}>👶</span>
              <span style={{ fontSize: 26, color: "rgba(255,255,255,0.45)", display: "flex" }}>Nessun voto sul sesso</span>
            </div>
          )}
        </div>

        {/* ── Pillole riassuntive ──────────────────────────────────────────── */}
        {pillole.length > 0 && (
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {pillole.map(({ icon, text }) => (
              <div
                key={text}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(255,255,255,0.09)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: 999, padding: "14px 28px",
                }}
              >
                <span style={{ fontSize: 28, display: "flex" }}>{icon}</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#fff", display: "flex" }}>{text}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── CTA + QR ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: 44, fontWeight: 800, color: "#ffffff", display: "flex" }}>
            Scommetti anche tu!
          </span>
          {qrSrc ? (
            <div style={{
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.18)",
              borderRadius: 28, padding: "18px 18px 10px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <img src={qrSrc} width={180} height={180} style={{ borderRadius: 12, display: "block" }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.40)", display: "flex" }}>
                fantaparto.com
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 20, color: "rgba(255,255,255,0.40)", display: "flex" }}>
              fantaparto.com/vota/{codice}
            </span>
          )}
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
