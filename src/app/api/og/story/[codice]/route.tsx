import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ codice: string }> },
) {
  const { codice } = await params;

  const evento = await prisma.event.findFirst({
    where:  { codiceCondivisione: codice },
    select: {
      nomeBimbo:    true,
      stato:        true,
      realeSesso:   true,
      realeData:    true,
      realePeso:    true,
      _count: { select: { predictions: true } },
    },
  });

  if (!evento) {
    return new Response("Not found", { status: 404 });
  }

  const totVoti = evento._count.predictions;

  const maschio = await prisma.prediction.count({ where: { event: { codiceCondivisione: codice }, votoSesso: "MASCHIO" } });
  const femmina = await prisma.prediction.count({ where: { event: { codiceCondivisione: codice }, votoSesso: "FEMMINA" } });
  const totSesso = maschio + femmina;
  const pctM = totSesso > 0 ? Math.round((maschio / totSesso) * 100) : 0;
  const pctF = 100 - pctM;
  const teamWin = pctM >= pctF ? "MASCHIO" : "FEMMINA";

  const pesiVoti = await prisma.prediction.findMany({
    where: { event: { codiceCondivisione: codice }, votoPeso: { not: null } },
    select: { votoPeso: true },
  });
  const pesi = pesiVoti.map((p) => p.votoPeso!);
  const mediaPeso = pesi.length > 0 ? pesi.reduce((a, b) => a + b, 0) / pesi.length : null;

  const nomeEvento = evento.nomeBimbo ? `Baby ${evento.nomeBimbo}` : "FantaParto";
  const isConcluso = evento.stato === "CONCLUSO";

  // Se l'evento è concluso, mostra i dati reali
  const realeSessoLabel = evento.realeSesso === "MASCHIO" ? "Maschio 💙" : "Femmina 🩷";
  const realeData = evento.realeData
    ? new Date(evento.realeData).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const realePesoLabel = evento.realePeso
    ? `${(evento.realePeso / 1000).toFixed(3)} kg`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #fef5f4 0%, #fde8e6 40%, #ffd9d9 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          padding: "80px 64px",
        }}
      >
        {/* Background decoration */}
        <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: "rgba(181,53,44,0.08)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(181,53,44,0.06)", display: "flex" }} />

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 72 }}>
          <div style={{ fontSize: 96, marginBottom: 8, display: "flex" }}>🍼</div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#b5352c", letterSpacing: "-1px", display: "flex" }}>
            FantaParto
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, color: "#5a4e50", marginTop: 8, display: "flex" }}>
            {nomeEvento}
          </div>
        </div>

        {isConcluso && evento.realeSesso ? (
          /* ── Risultati reali ── */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#1a1a2e", textAlign: "center", display: "flex" }}>
              È {realeSessoLabel}!
            </div>
            {realeData && (
              <div style={{ fontSize: 32, color: "#5a4e50", display: "flex" }}>📅 {realeData}</div>
            )}
            {realePesoLabel && (
              <div style={{ fontSize: 32, color: "#5a4e50", display: "flex" }}>⚖️ {realePesoLabel}</div>
            )}
            <div style={{ fontSize: 28, color: "#a89a9b", marginTop: 16, display: "flex" }}>
              {totVoti} partecipanti
            </div>
          </div>
        ) : (
          /* ── Statistiche pronostici ── */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48, width: "100%" }}>

            {/* Team challenge */}
            {totSesso > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: "#5a4e50", display: "flex" }}>
                  Chi sarà?
                </div>
                <div style={{ display: "flex", gap: 24, width: "100%" }}>
                  {/* Maschio */}
                  <div style={{
                    flex: pctM, display: "flex", flexDirection: "column", alignItems: "center",
                    background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                    borderRadius: 24, padding: "28px 20px", gap: 8,
                  }}>
                    <div style={{ fontSize: 48, display: "flex" }}>💙</div>
                    <div style={{ fontSize: 64, fontWeight: 900, color: "#1e40af", display: "flex" }}>{pctM}%</div>
                    <div style={{ fontSize: 28, color: "#1e40af", display: "flex" }}>Maschio</div>
                    <div style={{ fontSize: 22, color: "#3b82f6", display: "flex" }}>{maschio} voti</div>
                  </div>
                  {/* Femmina */}
                  <div style={{
                    flex: pctF, display: "flex", flexDirection: "column", alignItems: "center",
                    background: "linear-gradient(135deg, #fde8e6, #ffd9d9)",
                    borderRadius: 24, padding: "28px 20px", gap: 8,
                  }}>
                    <div style={{ fontSize: 48, display: "flex" }}>🩷</div>
                    <div style={{ fontSize: 64, fontWeight: 900, color: "#b5352c", display: "flex" }}>{pctF}%</div>
                    <div style={{ fontSize: 28, color: "#b5352c", display: "flex" }}>Femmina</div>
                    <div style={{ fontSize: 22, color: "#e04040", display: "flex" }}>{femmina} voti</div>
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: teamWin === "MASCHIO" ? "#1e40af" : "#b5352c", display: "flex" }}>
                  Il {pctM >= pctF ? pctM : pctF}% pensa sia {teamWin === "MASCHIO" ? "maschio" : "femmina"}!
                </div>
              </div>
            )}

            {/* Media peso */}
            {mediaPeso && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.7)", borderRadius: 20, padding: "20px 40px" }}>
                <div style={{ fontSize: 40, display: "flex" }}>⚖️</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 22, color: "#a89a9b", display: "flex" }}>Peso medio previsto</div>
                  <div style={{ fontSize: 40, fontWeight: 800, color: "#1a1a2e", display: "flex" }}>
                    {(mediaPeso / 1000).toFixed(2)} kg
                  </div>
                </div>
              </div>
            )}

            {/* Totale voti */}
            <div style={{ fontSize: 36, fontWeight: 700, color: "#a89a9b", display: "flex" }}>
              {totVoti} partecipanti hanno già votato!
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ position: "absolute", bottom: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 24, color: "#a89a9b", display: "flex" }}>fantaparto.com</div>
        </div>
      </div>
    ),
    {
      width:  1080,
      height: 1920,
    },
  );
}
