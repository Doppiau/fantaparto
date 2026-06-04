export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import MetrichePanel from "./MetrichePanel";

const C = {
  bg:     "#f8f4f5",
  white:  "#ffffff",
  border: "#e8e4e1",
  onSurf: "#1b1c1a",
  muted:  "#b0a0a2",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [dbUser, eventi] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { isPremium: true } }),
    prisma.event.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id:                true,
        nomeBimbo:         true,
        dataPresuntaParto: true,
        isPremium:         true,
        stato:             true,
        sessoAttivo:       true,
        dataAttiva:        true,
        pesoAttivo:        true,
        oraAttiva:         true,
        lunghezzaAttiva:   true,
        capelliAttivo:     true,
        occhiAttivo:       true,
      },
    }),
  ]);

  const userIsPremium = dbUser?.isPremium ?? false;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: VN }}>

      {/* Sticky top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40, height: 52,
        background: C.white, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", padding: "0 32px", gap: 8,
      }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>
          Dashboard
        </Link>
        <span style={{ fontSize: 13, color: C.border }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.onSurf, fontFamily: QS }}>
          Configurazione
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 26, fontWeight: 800, fontFamily: QS,
            color: C.onSurf, margin: "0 0 6px", letterSpacing: "-0.02em",
          }}>
            Configurazione del Gioco
          </h1>
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
            Scegli su quali metriche gli invitati potranno scommettere e quanti punti vale ciascuna.
          </p>
        </div>

        {eventi.length === 0 ? (
          <div style={{
            background: C.white, border: `1px solid ${C.border}`, borderRadius: 20,
            padding: "56px 32px", textAlign: "center",
          }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>🎮</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.onSurf, margin: "0 0 6px" }}>
              Nessun evento ancora
            </p>
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 24px" }}>
              Crea il tuo primo FantaParto per configurare il gioco.
            </p>
            <Link
              href="/dashboard/nuovo-evento"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 14, fontWeight: 700, color: "#fff",
                background: "linear-gradient(135deg, #874e58, #5e2d3a)",
                borderRadius: 12, padding: "12px 24px", textDecoration: "none",
                boxShadow: "0 6px 18px rgba(135,78,88,0.30)",
              }}
            >
              + Crea FantaParto
            </Link>
          </div>
        ) : (
          <MetrichePanel eventi={eventi} userIsPremium={userIsPremium} />
        )}
      </div>
    </div>
  );
}
