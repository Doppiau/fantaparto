import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

const STATO: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  IN_CORSO:            { label: "In corso",   color: "#166534", bg: "#f0fdf4", border: "#bbf7d0", dot: "#4ade80" },
  PRONTO_RIVELAZIONE:  { label: "Chiuso",     color: "#92400e", bg: "#fef3c7", border: "#fde68a", dot: "#f59e0b" },
  CONCLUSO:            { label: "Concluso",   color: "#5a3d48", bg: "#f5eaed", border: "#e8d5da", dot: "#b0a0a2" },
};

export default async function EventiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const eventi = await prisma.event.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id:                true,
      nomeBimbo:         true,
      stato:             true,
      dataPresuntaParto: true,
      createdAt:         true,
      _count: { select: { predictions: true } },
    },
  });

  const totaleVoti    = eventi.reduce((s, e) => s + e._count.predictions, 0);
  const inCorso       = eventi.filter((e) => e.stato === "IN_CORSO").length;
  const conclusi      = eventi.filter((e) => e.stato === "CONCLUSO").length;

  return (
    <div className="px-4 md:px-6" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 860, margin: "0 auto", fontFamily: VN }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C2C2E", fontFamily: QS, margin: 0 }}>
            Tutti i FantaParto
          </h1>
          <p style={{ fontSize: 13, color: "rgba(44,44,46,0.50)", margin: "4px 0 0" }}>
            {eventi.length === 0
              ? "Nessun evento ancora"
              : `${eventi.length} event${eventi.length === 1 ? "o" : "i"} · ${totaleVoti} vot${totaleVoti === 1 ? "o" : "i"} totali`}
          </p>
        </div>
        <Link
          href="/dashboard/nuovo-evento"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: 12,
            fontSize: 13, fontWeight: 700, fontFamily: VN,
            textDecoration: "none", color: "#fff", flexShrink: 0,
            background: "linear-gradient(135deg, #874e58 0%, #5e2d3a 100%)",
            boxShadow: "0 4px 14px rgba(135,78,88,0.30)",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          Nuova Sfida
        </Link>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      {eventi.length > 0 && (
        <div className="grid grid-cols-3" style={{ gap: 12, marginBottom: 24 }}>
          {[
            { label: "Totale eventi", value: eventi.length, icon: "🗂️" },
            { label: "In corso",      value: inCorso,        icon: "🟢" },
            { label: "Conclusi",      value: conclusi,       icon: "✅" },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              style={{
                background: "#fff", border: "1.5px solid #F1ECE4",
                borderRadius: 16, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#2C2C2E", fontFamily: QS, margin: 0, lineHeight: 1.1 }}>
                  {value}
                </p>
                <p style={{ fontSize: 11, color: "rgba(44,44,46,0.45)", margin: "2px 0 0", fontWeight: 600 }}>
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lista eventi ────────────────────────────────────────────────── */}
      {eventi.length === 0 ? (
        <div style={{
          background: "#fff", border: "1.5px solid #F1ECE4", borderRadius: 20,
          padding: "56px 32px", textAlign: "center", display: "flex",
          flexDirection: "column", alignItems: "center", gap: 16,
        }}>
          <span style={{ fontSize: 52 }}>🍼</span>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#2C2C2E", fontFamily: QS, margin: 0 }}>
              Nessun FantaParto ancora
            </p>
            <p style={{ fontSize: 13, color: "rgba(44,44,46,0.50)", margin: "6px 0 0" }}>
              Crea il tuo primo evento e invita i tuoi cari a votare!
            </p>
          </div>
          <Link
            href="/dashboard/nuovo-evento"
            style={{
              display: "inline-block", marginTop: 8, padding: "12px 24px",
              borderRadius: 999, textDecoration: "none", fontWeight: 700,
              fontSize: 14, color: "#fff",
              background: "linear-gradient(135deg, #874e58 0%, #5e2d3a 100%)",
              boxShadow: "0 4px 14px rgba(135,78,88,0.25)",
            }}
          >
            🚀 Crea il primo FantaParto
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {eventi.map((ev) => {
            const cfg     = STATO[ev.stato] ?? STATO.CONCLUSO;
            const nome    = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a";
            const dpp     = new Date(ev.dataPresuntaParto).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
            const giorni  = Math.round((new Date(ev.dataPresuntaParto).getTime() - Date.now()) / 86_400_000);
            const creato  = new Date(ev.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

            return (
              <Link
                key={ev.id}
                href={`/dashboard/${ev.id}`}
                className="fp-evento-card"
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: "#fff", border: "1.5px solid #F1ECE4",
                  borderRadius: 16, padding: "16px 20px",
                  textDecoration: "none",
                }}
              >
                {/* Dot status */}
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot, flexShrink: 0, boxShadow: ev.stato === "IN_CORSO" ? `0 0 6px ${cfg.dot}` : "none" }} />

                {/* Nome */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2E", fontFamily: QS, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {nome}
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(44,44,46,0.45)", margin: "2px 0 0" }}>
                    Creato il {creato}
                  </p>
                </div>

                {/* DPP */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#2C2C2E", margin: 0 }}>
                    {dpp}
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(44,44,46,0.45)", margin: "2px 0 0" }}>
                    {ev.stato === "CONCLUSO"
                      ? "nato/a"
                      : giorni > 0
                      ? `tra ${giorni} giorni`
                      : giorni === 0
                      ? "oggi! 🎉"
                      : `${Math.abs(giorni)}g fa`}
                  </p>
                </div>

                {/* Voti */}
                <div style={{ textAlign: "right", flexShrink: 0, minWidth: 48 }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "#874e58", fontFamily: QS, margin: 0, lineHeight: 1 }}>
                    {ev._count.predictions}
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(44,44,46,0.40)", margin: "2px 0 0", fontWeight: 600 }}>
                    vot{ev._count.predictions === 1 ? "o" : "i"}
                  </p>
                </div>

                {/* Badge stato */}
                <span style={{
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                  padding: "4px 10px", borderRadius: 999,
                  color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                }}>
                  {cfg.label}
                </span>

                {/* Arrow */}
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "rgba(44,44,46,0.25)", flexShrink: 0 }}>
                  chevron_right
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
