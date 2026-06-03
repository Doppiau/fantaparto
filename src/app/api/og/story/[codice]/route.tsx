import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// Carica il logo da /public/logo.png (trasparente) come base64
function loadLogo(): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

// Stelle fisse deterministiche per lo sfondo stellato
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: ((i * 137.508 + 42) % 1080),
  y: ((i * 233.721 + 88) % 1920),
  r: i % 7 === 0 ? 3.5 : i % 3 === 0 ? 2.2 : 1.4,
  o: 0.25 + (i % 5) * 0.15,
}));

// Costellazioni semplificate (linee tra stelle)
const CONSTELLATIONS = [
  { x1: 120, y1: 180, x2: 210, y2: 260 }, { x1: 210, y1: 260, x2: 280, y2: 200 },
  { x1: 820, y1: 320, x2: 900, y2: 380 }, { x1: 900, y1: 380, x2: 960, y2: 300 },
  { x1: 80,  y1: 900, x2: 160, y2: 960 }, { x1: 160, y1: 960, x2: 200, y2: 880 },
  { x1: 880, y1: 820, x2: 950, y2: 900 }, { x1: 950, y1: 900, x2: 1010, y2: 840 },
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ codice: string }> },
) {
  const { codice } = await params;

  const [evento, maschio, femmina, pesiVoti] = await Promise.all([
    prisma.event.findFirst({
      where:  { codiceCondivisione: codice },
      select: {
        nomeBimbo: true, stato: true,
        dataPresuntaParto: true,
        realeSesso: true, realeData: true, realePeso: true,
        _count: { select: { predictions: true } },
      },
    }),
    prisma.prediction.count({ where: { event: { codiceCondivisione: codice }, votoSesso: "MASCHIO" } }),
    prisma.prediction.count({ where: { event: { codiceCondivisione: codice }, votoSesso: "FEMMINA" } }),
    prisma.prediction.findMany({
      where:  { event: { codiceCondivisione: codice }, votoPeso: { not: null } },
      select: { votoPeso: true },
    }),
  ]);

  if (!evento) return new Response("Not found", { status: 404 });

  const logoSrc = loadLogo();

  const totVoti   = evento._count.predictions;
  const totSesso  = maschio + femmina;
  const pctM      = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 50;
  const pctF      = 100 - pctM;
  const pesi      = pesiVoti.map((p) => p.votoPeso!);
  const mediaPeso = pesi.length > 0 ? pesi.reduce((a, b) => a + b, 0) / pesi.length : null;
  const dppLabel  = evento.dataPresuntaParto
    ? new Date(evento.dataPresuntaParto).toLocaleDateString("it-IT", { day: "numeric", month: "short" })
    : null;

  const nomeEvento = evento.nomeBimbo ? `Baby ${evento.nomeBimbo}` : "FantaParto";
  const isConcluso = evento.stato === "CONCLUSO";
  const voteUrl    = `https://fantaparto.com/vota/${codice}`;

  // QR code base64
  let qrSrc = "";
  try {
    const qrRes = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(voteUrl)}&bgcolor=162040&color=ffffff&format=png&margin=8`,
      { signal: AbortSignal.timeout(3000) },
    );
    qrSrc = `data:image/png;base64,${Buffer.from(await qrRes.arrayBuffer()).toString("base64")}`;
  } catch { /* skip */ }

  // ── Sfondo stellato comune ────────────────────────────────────────────────────
  const StarryBg = () => (
    <svg
      width="1080" height="1920"
      style={{ position: "absolute", top: 0, left: 0 }}
      viewBox="0 0 1080 1920"
    >
      {/* Costellazioni */}
      {CONSTELLATIONS.map((c, i) => (
        <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
          stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeDasharray="4 6" />
      ))}
      {/* Stelle */}
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
      ))}
      {/* Decorazioni angolo — orso in basso sx */}
      <text x="40"  y="1750" fontSize="90" opacity="0.22">🐻</text>
      <text x="900" y="1780" fontSize="80" opacity="0.20">🐻</text>
      {/* Razzi */}
      <text x="900" y="320"  fontSize="80" opacity="0.22" transform="rotate(30,940,280)">🚀</text>
      <text x="60"  y="1150" fontSize="70" opacity="0.20" transform="rotate(-20,95,1115)">🚀</text>
      {/* Stelle decorative angoli */}
      <text x="50"  y="450"  fontSize="50" opacity="0.28">✨</text>
      <text x="980" y="600"  fontSize="40" opacity="0.22">✨</text>
      <text x="40"  y="1400" fontSize="45" opacity="0.20">⭐</text>
      <text x="990" y="1300" fontSize="50" opacity="0.24">⭐</text>
    </svg>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // CONCLUSO — Reveal card in stile kawaii stellato
  // ════════════════════════════════════════════════════════════════════════════
  if (isConcluso && evento.realeSesso) {
    const isMaschio      = evento.realeSesso === "MASCHIO";
    const sessoTesto     = isMaschio ? "MASCHIO" : "FEMMINA";
    const sessoColor     = isMaschio ? "#4ea8de" : "#f48fb1";
    const sessoShadow    = isMaschio ? "#1565c0" : "#c2185b";
    const sessoEmoji     = isMaschio ? "💙" : "🩷";
    const babyEmoji      = isMaschio ? "👦" : "👧";
    const cardBorder     = isMaschio ? "#5ab4e8" : "#f48fb1";

    const realeDataLabel = evento.realeData
      ? new Date(evento.realeData).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
      : null;
    const realePesoLabel = evento.realePeso
      ? `${(evento.realePeso / 1000).toFixed(3)} kg`
      : null;

    return new ImageResponse(
      (
        <div style={{
          width: "100%", height: "100%",
          background: "linear-gradient(165deg, #1e3060 0%, #122040 45%, #0a1528 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "space-between",
          padding: "72px 56px 64px",
          position: "relative", overflow: "hidden",
          fontFamily: "sans-serif",
        }}>
          <StarryBg />

          {/* ── Logo ────────────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 1 }}>
            {logoSrc ? (
              <img src={logoSrc} width={220} height={220} style={{ display: "block", filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.55))" }} />
            ) : (
              <>
                <span style={{ fontSize: 80, display: "flex" }}>🦢</span>
                <div style={{ fontSize: 68, fontWeight: 900, letterSpacing: "-1px", display: "flex" }}>
                  <span style={{ color: "#ff9f45" }}>Fanta</span><span style={{ color: "#ffffff" }}>Parto</span>
                </div>
              </>
            )}
            <div style={{ fontSize: 34, fontWeight: 600, color: "rgba(255,255,255,0.75)", display: "flex" }}>
              {nomeEvento}
            </div>
          </div>

          {/* ── Card reveal ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, zIndex: 1, width: "100%" }}>
            {/* Banner "È NATO/A" */}
            <div style={{
              background: "linear-gradient(135deg, #fffde7 0%, #fff8cc 100%)",
              border: "3px solid #f0c040",
              borderRadius: 999, padding: "16px 52px",
              boxShadow: "0 4px 20px rgba(240,192,64,0.45)",
              display: "flex", alignItems: "center", gap: 12,
              marginBottom: -22, zIndex: 2,
            }}>
              <span style={{ fontSize: 30, display: "flex" }}>🎉</span>
              <span style={{ fontSize: 32, fontWeight: 900, color: "#7c5a00", letterSpacing: "0.06em" }}>
                È NATO/A
              </span>
              <span style={{ fontSize: 30, display: "flex" }}>🎉</span>
            </div>

            {/* Card principale */}
            <div style={{
              width: "100%",
              background: "linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)",
              border: `3px solid ${cardBorder}55`,
              borderRadius: 36,
              padding: "44px 36px 40px",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 28,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 60px ${cardBorder}22, inset 0 1px 0 rgba(255,255,255,0.12)`,
            }}>
              {/* Stelle decorative attorno alla card (top) */}
              <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
                {["⭐","🌟","⭐","🌟","⭐","🌟","⭐"].map((s, i) => (
                  <span key={i} style={{ fontSize: 28, display: "flex", opacity: 0.85 }}>{s}</span>
                ))}
              </div>

              {/* Baby su luna */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 140, display: "flex", filter: `drop-shadow(0 0 32px ${sessoColor}88)` }}>🌙</span>
                  <span style={{
                    position: "absolute", fontSize: 80, display: "flex",
                    filter: `drop-shadow(0 0 20px ${sessoColor})`,
                  }}>{babyEmoji}</span>
                </div>
                <span style={{ fontSize: 28, display: "flex" }}>❤️</span>
              </div>

              {/* Nome sesso */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{
                  fontSize: 88, fontWeight: 900,
                  color: sessoColor,
                  textShadow: `0 0 40px ${sessoColor}, 0 4px 0 ${sessoShadow}`,
                  letterSpacing: "0.04em", lineHeight: 1, display: "flex",
                }}>
                  {sessoTesto}
                </span>
                <span style={{ fontSize: 40, display: "flex" }}>{sessoEmoji}</span>
              </div>

              {/* Stelle decorative (bottom) */}
              <div style={{ display: "flex", gap: 20 }}>
                {["⭐","🌟","⭐","🌟","⭐","🌟","⭐"].map((s, i) => (
                  <span key={i} style={{ fontSize: 28, display: "flex", opacity: 0.85 }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Pillole data e peso — sotto la card */}
            <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
              {realeDataLabel && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(255,253,231,0.14)", border: "2px solid rgba(255,220,80,0.40)",
                  borderRadius: 999, padding: "14px 30px",
                  boxShadow: "0 4px 16px rgba(255,200,40,0.15)",
                }}>
                  <span style={{ fontSize: 28, display: "flex" }}>📅</span>
                  <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", display: "flex" }}>{realeDataLabel}</span>
                </div>
              )}
              {realePesoLabel && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(255,253,231,0.14)", border: "2px solid rgba(255,220,80,0.40)",
                  borderRadius: 999, padding: "14px 30px",
                  boxShadow: "0 4px 16px rgba(255,200,40,0.15)",
                }}>
                  <span style={{ fontSize: 28, display: "flex" }}>⚖️</span>
                  <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", display: "flex" }}>{realePesoLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 20, padding: "18px 48px", zIndex: 1,
          }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "rgba(255,255,255,0.80)", letterSpacing: "0.08em", display: "flex" }}>
              {totVoti} AMICI HANNO GIOCATO
            </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.10em", display: "flex" }}>
              FANTAPARTO.COM
            </span>
          </div>
        </div>
      ),
      { width: 1080, height: 1920 },
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // IN_CORSO — Team challenge (stellato)
  // ════════════════════════════════════════════════════════════════════════════
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%",
        background: "linear-gradient(165deg, #1e3060 0%, #122040 45%, #0a1528 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        padding: "88px 56px 80px",
        position: "relative", overflow: "hidden",
        fontFamily: "sans-serif",
      }}>
        <StarryBg />

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 1 }}>
          {logoSrc ? (
            <img src={logoSrc} width={220} height={220} style={{ display: "block", filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.55))" }} />
          ) : (
            <>
              <span style={{ fontSize: 80, display: "flex" }}>🦢</span>
              <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: "-2px", display: "flex" }}>
                <span style={{ color: "#ff9f45" }}>Fanta</span><span style={{ color: "#ffffff" }}>Parto</span>
              </div>
            </>
          )}
          <div style={{ fontSize: 40, fontWeight: 700, color: "rgba(255,255,255,0.80)", display: "flex" }}>
            {nomeEvento}
          </div>
        </div>

        {/* Card */}
        <div style={{
          width: "100%", zIndex: 1,
          background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)",
          border: "2px solid rgba(255,255,255,0.15)",
          borderRadius: 40, padding: "44px 36px 40px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
        }}>
          <div style={{
            background: "rgba(20,8,40,0.80)", border: "1px solid rgba(255,220,80,0.30)",
            borderRadius: 999, padding: "16px 48px", display: "flex",
          }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#ffe066", letterSpacing: "0.05em" }}>
              ⭐ CHI INDOVINA VINCE! ⭐
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
            {/* Maschio */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: pctM >= pctF ? 272 : 210, height: pctM >= pctF ? 272 : 210,
                borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, #c8eaff 0%, #5fb3e8 35%, #1565c0 100%)",
                boxShadow: pctM >= pctF ? "0 0 64px rgba(91,179,232,0.72), 0 0 130px rgba(91,179,232,0.35)" : "0 0 36px rgba(91,179,232,0.48)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              }}>
                <span style={{ fontSize: pctM >= pctF ? 22 : 17, display: "flex" }}>🍼</span>
                <span style={{ fontSize: pctM >= pctF ? 76 : 58, fontWeight: 900, color: "#fff", lineHeight: 1, display: "flex" }}>{pctM}%</span>
                <span style={{ fontSize: pctM >= pctF ? 20 : 16, fontWeight: 800, color: "rgba(255,255,255,0.90)", letterSpacing: "0.06em", display: "flex" }}>MASCHIO</span>
              </div>
            </div>

            <span style={{ fontSize: 36, color: "rgba(255,220,80,0.70)", fontWeight: 900, display: "flex" }}>VS</span>

            {/* Femmina */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: pctF > pctM ? 272 : 210, height: pctF > pctM ? 272 : 210,
                borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, #ffd4ec 0%, #f296c2 35%, #c2185b 100%)",
                boxShadow: pctF > pctM ? "0 0 64px rgba(242,150,194,0.72), 0 0 130px rgba(242,150,194,0.35)" : "0 0 36px rgba(242,150,194,0.48)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              }}>
                <span style={{ fontSize: pctF > pctM ? 22 : 17, display: "flex" }}>🎀</span>
                <span style={{ fontSize: pctF > pctM ? 76 : 58, fontWeight: 900, color: "#fff", lineHeight: 1, display: "flex" }}>{pctF}%</span>
                <span style={{ fontSize: pctF > pctM ? 20 : 16, fontWeight: 800, color: "rgba(255,255,255,0.90)", letterSpacing: "0.06em", display: "flex" }}>FEMMINA</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.60)", display: "flex" }}>
            {totVoti} amici hanno già votato
          </div>
        </div>

        {/* Pills */}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", zIndex: 1 }}>
          {dppLabel && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,253,231,0.12)", border: "2px solid rgba(255,220,80,0.35)", borderRadius: 999, padding: "13px 26px" }}>
              <span style={{ fontSize: 26, display: "flex" }}>📅</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", display: "flex" }}>DPP: {dppLabel}</span>
            </div>
          )}
          {mediaPeso && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,253,231,0.12)", border: "2px solid rgba(255,220,80,0.35)", borderRadius: 999, padding: "13px 26px" }}>
              <span style={{ fontSize: 26, display: "flex" }}>⚖️</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", display: "flex" }}>Media: {(mediaPeso / 1000).toFixed(1)} kg</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,253,231,0.12)", border: "2px solid rgba(255,220,80,0.35)", borderRadius: 999, padding: "13px 26px" }}>
            <span style={{ fontSize: 26, display: "flex" }}>🗳️</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", display: "flex" }}>{totVoti} voti</span>
          </div>
        </div>

        {/* CTA + QR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
          <span style={{ fontSize: 46, fontWeight: 900, color: "#ffe066", display: "flex", textShadow: "0 0 20px rgba(255,220,80,0.50)" }}>
            Indovina anche tu! ⭐
          </span>
          {qrSrc ? (
            <div style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,220,80,0.30)", borderRadius: 24, padding: "16px 16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <img src={qrSrc} width={180} height={180} style={{ borderRadius: 12, display: "block" }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.35)", display: "flex" }}>fantaparto.com</span>
            </div>
          ) : (
            <span style={{ fontSize: 20, color: "rgba(255,255,255,0.40)", display: "flex" }}>fantaparto.com/vota/{codice}</span>
          )}
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
