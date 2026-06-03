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
      where:  { event: { codiceCondivisione: codice }, votoPeso: { not: null } },
      select: { votoPeso: true },
    }),
  ]);

  if (!evento) return new Response("Not found", { status: 404 });

  const totVoti    = evento._count.predictions;
  const totSesso   = maschio + femmina;
  const pctM       = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 50;
  const pctF       = 100 - pctM;
  const pesi       = pesiVoti.map((p) => p.votoPeso!);
  const mediaPeso  = pesi.length > 0 ? pesi.reduce((a, b) => a + b, 0) / pesi.length : null;

  const dppLabel   = evento.dataPresuntaParto
    ? new Date(evento.dataPresuntaParto).toLocaleDateString("it-IT", { day: "numeric", month: "short" })
    : null;

  const nomeEvento = evento.nomeBimbo ? `Baby ${evento.nomeBimbo}` : "FantaParto";
  const isConcluso = evento.stato === "CONCLUSO";
  const voteUrl    = `https://fantaparto.com/vota/${codice}`;

  // ── QR code (base64) ─────────────────────────────────────────────────────────
  let qrSrc = "";
  try {
    const qrRes = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(voteUrl)}&bgcolor=0d0d1a&color=ffffff&format=png&margin=8`,
      { signal: AbortSignal.timeout(3000) },
    );
    const buf = await qrRes.arrayBuffer();
    qrSrc = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
  } catch { /* skip QR se offline */ }

  // ── Bolle bokeh comuni ────────────────────────────────────────────────────────
  const Bokeh = () => (
    <>
      <div style={{ position: "absolute", top: -180, left: -180, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(220,50,50,0.28), transparent 68%)", display: "flex" }} />
      <div style={{ position: "absolute", top: -80, right: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,185,0,0.22), transparent 68%)", display: "flex" }} />
      <div style={{ position: "absolute", top: "38%", left: -100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,80,80,0.13), transparent 70%)", display: "flex" }} />
      <div style={{ position: "absolute", bottom: -120, right: -100, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,195,0,0.18), transparent 68%)", display: "flex" }} />
      <div style={{ position: "absolute", bottom: "28%", left: -80, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(60,80,220,0.14), transparent 70%)", display: "flex" }} />
      <div style={{ position: "absolute", top: "55%", right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(180,50,200,0.11), transparent 70%)", display: "flex" }} />
    </>
  );

  // ── Logo + nome ───────────────────────────────────────────────────────────────
  const Logo = ({ nome }: { nome: string }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: "-2px", display: "flex" }}>
        <span style={{ color: "#ff9f45" }}>Fanta</span><span style={{ color: "#ffffff" }}>Parto</span>
      </div>
      <div style={{ fontSize: 40, fontWeight: 700, color: "rgba(255,255,255,0.80)", display: "flex" }}>
        {nome}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // CONCLUSO — Reveal premium
  // ════════════════════════════════════════════════════════════════════════════
  if (isConcluso && evento.realeSesso) {
    const isMaschio      = evento.realeSesso === "MASCHIO";
    const sessoTesto     = isMaschio ? "MASCHIO" : "FEMMINA";
    const sessoEmoji     = isMaschio ? "👶💙" : "👶🩷";
    const bubbleBg       = isMaschio
      ? "radial-gradient(circle at 38% 32%, #c8eaff 0%, #5fb3e8 35%, #1565c0 100%)"
      : "radial-gradient(circle at 38% 32%, #ffd4ec 0%, #f296c2 35%, #c2185b 100%)";
    const bubbleGlow     = isMaschio
      ? "0 0 80px rgba(91,179,232,0.85), 0 0 180px rgba(91,179,232,0.40)"
      : "0 0 80px rgba(242,150,194,0.85), 0 0 180px rgba(242,150,194,0.40)";
    const accentColor    = isMaschio ? "#5fb3e8" : "#f296c2";
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
          background: "#0d0d1a",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "space-between",
          padding: "88px 64px 72px",
          position: "relative", overflow: "hidden",
          fontFamily: "sans-serif",
        }}>
          <Bokeh />

          {/* Logo */}
          <Logo nome={nomeEvento} />

          {/* Card principale */}
          <div style={{
            width: "100%",
            background: "rgba(255,255,255,0.065)",
            border: `1.5px solid ${accentColor}44`,
            borderRadius: 44,
            padding: "52px 40px 48px",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 40,
            boxShadow: `0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.10)`,
          }}>

            {/* Label reveal */}
            <div style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 999, padding: "14px 40px", display: "flex",
            }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: "rgba(255,255,255,0.70)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                🎉 È nato/a
              </span>
            </div>

            {/* Bolla gender */}
            <div style={{
              width: 300, height: 300,
              borderRadius: "50%",
              background: bubbleBg,
              boxShadow: bubbleGlow,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              <span style={{ fontSize: 52, display: "flex" }}>{sessoEmoji}</span>
              <span style={{ fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "0.03em", display: "flex" }}>
                {sessoTesto}
              </span>
            </div>

            {/* Pillole data e peso */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              {realeDataLabel && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "14px 28px" }}>
                  <span style={{ fontSize: 28, display: "flex" }}>📅</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#fff", display: "flex" }}>{realeDataLabel}</span>
                </div>
              )}
              {realePesoLabel && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "14px 28px" }}>
                  <span style={{ fontSize: 28, display: "flex" }}>⚖️</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#fff", display: "flex" }}>{realePesoLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Partecipanti + footer */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.45)", display: "flex" }}>
              {totVoti} amici hanno giocato
            </span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: "0.06em", display: "flex" }}>
              FANTAPARTO.COM
            </span>
          </div>
        </div>
      ),
      { width: 1080, height: 1920 },
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // IN_CORSO — Team challenge
  // ════════════════════════════════════════════════════════════════════════════
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
        <Bokeh />

        {/* Logo */}
        <Logo nome={nomeEvento} />

        {/* Card glassmorphism */}
        <div style={{
          width: "100%",
          background: "rgba(255,255,255,0.065)",
          border: "1.5px solid rgba(255,255,255,0.12)",
          borderRadius: 44,
          padding: "48px 40px 44px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 36,
        }}>
          {/* Badge */}
          <div style={{
            background: "rgba(20,8,40,0.85)", border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 999, padding: "16px 48px", display: "flex",
          }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", letterSpacing: "0.04em" }}>
              CHI INDOVINA VINCE!
            </span>
          </div>

          {/* Team circles */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            {/* Maschio */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
              <div style={{
                width: pctM >= pctF ? 276 : 210, height: pctM >= pctF ? 276 : 210,
                borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, #c8eaff 0%, #5fb3e8 35%, #1565c0 100%)",
                boxShadow: pctM >= pctF
                  ? "0 0 64px rgba(91,179,232,0.72), 0 0 130px rgba(91,179,232,0.35)"
                  : "0 0 36px rgba(91,179,232,0.48)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              }}>
                <span style={{ fontSize: pctM >= pctF ? 20 : 16, display: "flex" }}>🍼</span>
                <span style={{ fontSize: pctM >= pctF ? 76 : 58, fontWeight: 900, color: "#fff", lineHeight: 1, display: "flex" }}>{pctM}%</span>
                <span style={{ fontSize: pctM >= pctF ? 20 : 17, fontWeight: 800, color: "rgba(255,255,255,0.88)", letterSpacing: "0.06em", display: "flex" }}>MASCHIO</span>
              </div>
            </div>

            <span style={{ fontSize: 32, color: "rgba(255,255,255,0.30)", fontWeight: 700, display: "flex" }}>VS</span>

            {/* Femmina */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
              <div style={{
                width: pctF > pctM ? 276 : 210, height: pctF > pctM ? 276 : 210,
                borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, #ffd4ec 0%, #f296c2 35%, #c2185b 100%)",
                boxShadow: pctF > pctM
                  ? "0 0 64px rgba(242,150,194,0.72), 0 0 130px rgba(242,150,194,0.35)"
                  : "0 0 36px rgba(242,150,194,0.48)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              }}>
                <span style={{ fontSize: pctF > pctM ? 20 : 16, display: "flex" }}>🎀</span>
                <span style={{ fontSize: pctF > pctM ? 76 : 58, fontWeight: 900, color: "#fff", lineHeight: 1, display: "flex" }}>{pctF}%</span>
                <span style={{ fontSize: pctF > pctM ? 20 : 17, fontWeight: 800, color: "rgba(255,255,255,0.88)", letterSpacing: "0.06em", display: "flex" }}>FEMMINA</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,0.55)", display: "flex" }}>
            {totVoti} amici hanno già votato
          </div>
        </div>

        {/* Pills stats */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {dppLabel && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "13px 26px" }}>
              <span style={{ fontSize: 26, display: "flex" }}>📅</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", display: "flex" }}>DPP: {dppLabel}</span>
            </div>
          )}
          {mediaPeso && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "13px 26px" }}>
              <span style={{ fontSize: 26, display: "flex" }}>⚖️</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", display: "flex" }}>Media: {(mediaPeso / 1000).toFixed(1)} kg</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "13px 26px" }}>
            <span style={{ fontSize: 26, display: "flex" }}>🗳️</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", display: "flex" }}>{totVoti} voti</span>
          </div>
        </div>

        {/* CTA + QR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: 44, fontWeight: 800, color: "#fff", display: "flex" }}>
            Indovina anche tu!
          </span>
          {qrSrc ? (
            <div style={{
              background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.17)",
              borderRadius: 28, padding: "18px 18px 10px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <img src={qrSrc} width={180} height={180} style={{ borderRadius: 12, display: "block" }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.38)", display: "flex" }}>
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
