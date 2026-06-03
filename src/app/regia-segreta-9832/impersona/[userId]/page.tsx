import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { logImpersonazioneAction } from "../../actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function ImpersonaPage({ params }: PageProps) {
  const { userId } = await params;
  await requireAdmin();

  const utente = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, nome: true,
      isPremium: true, createdAt: true,
      events: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, nomeBimbo: true, stato: true,
          dataPresuntaParto: true, codiceCondivisione: true,
          isPremium: true, visualizzazioniLink: true,
          createdAt: true,
          _count: { select: { predictions: true } },
          predictions: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true, nomeInvitato: true, votoSesso: true,
              votoPeso: true, votoData: true, punteggioOttenuto: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!utente) notFound();

  // Logga l'accesso in AuditLog
  await logImpersonazioneAction(userId);

  const fmt = (d: Date) => new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

  const STATO_COLOR: Record<string, string> = {
    IN_CORSO:           "#22c55e",
    PRONTO_RIVELAZIONE: "#eab308",
    CONCLUSO:           "#64748b",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#020617",
      color: "#cbd5e1", fontFamily: "system-ui, sans-serif",
      padding: "2rem", maxWidth: "1200px", margin: "0 auto",
    }}>

      {/* Banner sola lettura */}
      <div style={{
        background: "#92400e22", border: "1px solid #92400e55",
        borderRadius: 10, padding: "12px 20px", marginBottom: "1.5rem",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>
            MODALITÀ SOLA LETTURA — Accesso tracciato nell&apos;Audit Log
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#92400e" }}>
            Stai visualizzando il profilo di {utente.email} per assistenza clienti. Non puoi modificare nulla.
          </p>
        </div>
        <Link href="/regia-segreta-9832" style={{
          marginLeft: "auto", padding: "6px 14px", borderRadius: 6,
          background: "#1e293b", border: "1px solid #334155",
          color: "#94a3b8", fontSize: 12, textDecoration: "none",
          flexShrink: 0,
        }}>
          ← Torna alla Regia
        </Link>
      </div>

      {/* Header utente */}
      <div style={{
        background: "#0f172a", border: "1px solid #1e293b",
        borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem",
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #874e58, #5e2d3a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 900, color: "#fff", flexShrink: 0,
        }}>
          {(utente.nome ?? utente.email).slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9" }}>
            {utente.nome ?? "—"}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>{utente.email}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475569" }}>
            Iscritto il {fmt(utente.createdAt)} · {utente.events.length} event{utente.events.length === 1 ? "o" : "i"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{
            padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: utente.isPremium ? "#a78bfa22" : "#1e293b",
            color: utente.isPremium ? "#a78bfa" : "#64748b",
            border: `1px solid ${utente.isPremium ? "#a78bfa44" : "#334155"}`,
          }}>
            {utente.isPremium ? "⭐ Premium" : "Free"}
          </span>
          <span style={{
            padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: "#0284c722", color: "#38bdf8", border: "1px solid #0284c744",
          }}>
            ID: {userId.slice(0, 8)}…
          </span>
        </div>
      </div>

      {/* Lista eventi */}
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "1rem" }}>
        🗂️ Eventi ({utente.events.length})
      </h2>

      {utente.events.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 13 }}>Nessun evento creato.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {utente.events.map((ev) => (
            <div key={ev.id} style={{
              background: "#0f172a", border: "1px solid #1e293b",
              borderRadius: 12, padding: "1.25rem",
            }}>
              {/* Header evento */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: "#f1f5f9", fontSize: 15 }}>
                    {ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a"}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                    DPP: {fmt(ev.dataPresuntaParto)} · Creato: {fmt(ev.createdAt)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: (STATO_COLOR[ev.stato] ?? "#64748b") + "22",
                    color: STATO_COLOR[ev.stato] ?? "#64748b",
                  }}>
                    {ev.stato.replace("_", " ")}
                  </span>
                  {ev.isPremium && (
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#a78bfa22", color: "#a78bfa" }}>
                      ⭐ Premium
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748b" }}>
                  <span>🗳️ {ev._count.predictions} voti</span>
                  <span>👁️ {ev.visualizzazioniLink} views</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11 }}>{ev.codiceCondivisione}</span>
                </div>
              </div>

              {/* Ultimi 5 pronostici */}
              {ev.predictions.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: "#475569", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Ultimi pronostici
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {ev.predictions.map((p) => (
                      <div key={p.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        background: "#020617", borderRadius: 6, padding: "6px 10px", fontSize: 12,
                      }}>
                        <span style={{ flex: 1, color: "#94a3b8", fontWeight: 600 }}>{p.nomeInvitato}</span>
                        {p.votoSesso && (
                          <span style={{ color: p.votoSesso === "MASCHIO" ? "#38bdf8" : "#f472b6" }}>
                            {p.votoSesso === "MASCHIO" ? "💙" : "🩷"}
                          </span>
                        )}
                        {p.votoPeso && <span style={{ color: "#64748b" }}>{(p.votoPeso / 1000).toFixed(2)} kg</span>}
                        {p.punteggioOttenuto !== null && (
                          <span style={{ fontWeight: 700, color: "#a78bfa" }}>{p.punteggioOttenuto} pt</span>
                        )}
                        <span style={{ color: "#334155", fontSize: 10 }}>{fmt(p.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
