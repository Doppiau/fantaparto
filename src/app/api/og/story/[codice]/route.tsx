import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
      where: { event: { codiceCondivisione: codice }, votoPeso: { not: null } },
      select: { votoPeso: true },
    }),
  ]);

  if (!evento) return new Response("Not found", { status: 404 });

  const totVoti  = evento._count.predictions;
  const totSesso = maschio + femmina;
  const pctM     = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 50;
  const pctF     = 100 - pctM;
  const pesi     = pesiVoti.map((p) => p.votoPeso!);
  const mediaPeso = pesi.length > 0 ? pesi.reduce((a, b) => a + b, 0) / pesi.length : null;

  const dppLabel = evento.dataPresuntaParto
    ? new Date(evento.dataPresuntaParto).toLocaleDateString("it-IT", { day: "numeric", month: "short" })
    : null;

  const nomeEvento = evento.nomeBimbo ? `Baby ${evento.nomeBimbo}` : "FantaParto";
  const isConcluso = evento.stato === "CONCLUSO";
  const voteUrl   = `https://fantaparto.com/vota/${codice}`;

  // Fetch QR code as base64
  let qrSrc = "";
  try {
    const qrRes = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(voteUrl)}&bgcolor=0d0d1a&color=ffffff&format=png&margin=8`,
      { signal: AbortSignal.timeout(3000) },
    );
    const buf = await qrRes.arrayBuffer();
    qrSrc = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
  } catch { /* skip QR se offline */ }

  // ── Risultati reali (solo se CONCLUSO) ─────────────────────────────────────
  if (isConcluso && evento.realeSesso) {
    const sessoLabel = evento.realeSesso === "MASCHIO" ? "Maschio 💙" : "Femmina 🩷";
    const realeDataLabel = evento.realeData
      ? new Date(evento.realeData).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
      : null;
    const realePesoLabel = evento.realePeso ? `${(evento.realePeso / 1000).toFixed(3)} kg` : null;

    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", background: "#0d0d1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", position: "relative", overflow: "hidden" }}>
          {/* BG blobs */}
          <div style={{ position: "absolute", top: -150, left: -150, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(220,50,50,0.22), transparent 70%)", display: "flex" }} />
          <div style={{ position: "absolute", bottom: -100, right: -100, width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,180,0,0.18), transparent 70%)", display: "flex" }} />

          {/* Logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 48 }}>
            <div style={{ fontSize: 80, fontWeight: 900, display: "flex", color: "#fff" }}>
              <span style={{ color: "#ff9f45" }}>Fanta</span><span>Parto</span>
            </div>
            <div style={{ fontSize: 48, fontWeight: 700, color: "#fff", display: "flex" }}>{nomeEvento}</div>
          </div>

          {/* Risultati card */}
          <div style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 40, padding: "56px 64px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 36, width: "82%",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, display: "flex" }}>
              <span style={{ fontSize: 72, display: "flex" }}>👶</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.6)", display: "flex" }}>È</span>
                <span style={{ fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1, display: "flex" }}>{sessoLabel}</span>
              </div>
            </div>
            {realeDataLabel && <span style={{ fontSize: 36, color: "rgba(255,255,255,0.75)", display: "flex" }}>📅 {realeDataLabel}</span>}
            {realePesoLabel && <span style={{ fontSize: 36, color: "rgba(255,255,255,0.75)", display: "flex" }}>⚖️ {realePesoLabel}</span>}
            <span style={{ fontSize: 26, color: "rgba(255,255,255,0.55)", display: "flex" }}>{totVoti} partecipanti hanno giocato</span>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 64 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.50)", display: "flex" }}>fantaparto.com</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1920 },
    );
  }

  // ── IN_CORSO — Design principale ────────────────────────────────────────────
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%",
        background: "#0d0d1a",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        padding: "96px 64px 80px",
        position: "relative", overflow: "hidden",
        fontFamily: "sans-serif",
      }}>
        {/* ── Bolle decorative sfondo ──────────────────────────────────────── */}
        <div style={{ position: "absolute", top: -160, left: -160, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(220,50,50,0.28), transparent 68%)", display: "flex" }} />
        <div style={{ position: "absolute", top: -60, right: -100, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,185,0,0.22), transparent 68%)", display: "flex" }} />
        <div style={{ position: "absolute", top: "38%", left: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,80,80,0.14), transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -100, right: -80, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,195,0,0.18), transparent 68%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: "28%", left: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(180,50,200,0.12), transparent 70%)", display: "flex" }} />

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: "-2px", display: "flex" }}>
            <span style={{ color: "#ff9f45" }}>Fanta</span><span style={{ color: "#ffffff" }}>Parto</span>
          </div>
          <div style={{ fontSize: 46, fontWeight: 700, color: "#ffffff", display: "flex" }}>{nomeEvento}</div>
        </div>

        {/* ── Card glassmorphism ────────────────────────────────────────────── */}
        <div style={{
          width: "100%",
          background: "rgba(255,255,255,0.065)",
          border: "1.5px solid rgba(255,255,255,0.13)",
          borderRadius: 40,
          padding: "44px 40px 40px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
        }}>
          {/* Header pill */}
          <div style={{
            background: "rgba(20,8,40,0.85)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 999, padding: "16px 48px", display: "flex",
          }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: "#ffffff", letterSpacing: "0.04em" }}>
              CHI INDOVINA VINCE!
            </span>
          </div>

          {/* Cerchi team */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
            {/* Maschio (più grande se pctM >= pctF) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: pctM >= pctF ? 272 : 212, height: pctM >= pctF ? 272 : 212,
                borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, #c8eaff 0%, #5fb3e8 35%, #1565c0 100%)",
                boxShadow: pctM >= pctF
                  ? "0 0 64px rgba(91,179,232,0.70), 0 0 130px rgba(91,179,232,0.35)"
                  : "0 0 40px rgba(91,179,232,0.50)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              }}>
                <span style={{ fontSize: pctM >= pctF ? 20 : 16, display: "flex" }}>🍼</span>
                <span style={{ fontSize: pctM >= pctF ? 76 : 58, fontWeight: 900, color: "#fff", lineHeight: 1, display: "flex" }}>{pctM}%</span>
                <span style={{ fontSize: pctM >= pctF ? 22 : 18, fontWeight: 700, color: "rgba(255,255,255,0.88)", letterSpacing: "0.05em", display: "flex" }}>MASCHIO</span>
              </div>
            </div>

            {/* Femmina */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: pctF > pctM ? 272 : 212, height: pctF > pctM ? 272 : 212,
                borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, #ffd4ec 0%, #f296c2 35%, #c2185b 100%)",
                boxShadow: pctF > pctM
                  ? "0 0 64px rgba(242,150,194,0.70), 0 0 130px rgba(242,150,194,0.35)"
                  : "0 0 40px rgba(242,150,194,0.50)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              }}>
                <span style={{ fontSize: pctF > pctM ? 20 : 16, display: "flex" }}>🎀</span>
                <span style={{ fontSize: pctF > pctM ? 76 : 58, fontWeight: 900, color: "#fff", lineHeight: 1, display: "flex" }}>{pctF}%</span>
                <span style={{ fontSize: pctF > pctM ? 22 : 18, fontWeight: 700, color: "rgba(255,255,255,0.88)", letterSpacing: "0.05em", display: "flex" }}>FEMMINA</span>
              </div>
            </div>
          </div>

          {/* Voti */}
          <div style={{ fontSize: 30, fontWeight: 500, color: "rgba(255,255,255,0.70)", display: "flex" }}>
            {totVoti} amici hanno già votato
          </div>
        </div>

        {/* ── Pill stats ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
          {dppLabel && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 999, padding: "13px 26px" }}>
              <span style={{ fontSize: 26, display: "flex" }}>📅</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: "#fff", display: "flex" }}>Data: {dppLabel}</span>
            </div>
          )}
          {mediaPeso && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 999, padding: "13px 26px" }}>
              <span style={{ fontSize: 26, display: "flex" }}>⚖️</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: "#fff", display: "flex" }}>Peso: {(mediaPeso / 1000).toFixed(1)} kg</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 999, padding: "13px 26px" }}>
            <span style={{ fontSize: 26, display: "flex" }}>🗳️</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: "#fff", display: "flex" }}>Voti: {totVoti}</span>
          </div>
        </div>

        {/* ── CTA + QR ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: 46, fontWeight: 800, color: "#fff", display: "flex" }}>
            Indovina anche tu!
          </span>
          {qrSrc ? (
            <div style={{
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.18)",
              borderRadius: 28, padding: "18px 18px 10px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <img src={qrSrc} width={190} height={190} style={{ borderRadius: 12, display: "block" }} />
              <span style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.45)", display: "flex" }}>
                fantaparto.com
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 22, color: "rgba(255,255,255,0.45)", display: "flex" }}>
              fantaparto.com/vota/{codice}
            </span>
          )}
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
