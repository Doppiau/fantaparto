import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { EventoActions } from "./EventiClient";

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
      id: true, nomeBimbo: true, stato: true, archiviato: true,
      dataPresuntaParto: true, createdAt: true,
      _count: { select: { predictions: true } },
    },
  });

  const attivi    = eventi.filter((e) => !e.archiviato);
  const archiviati = eventi.filter((e) => e.archiviato);

  const totaleVoti = attivi.reduce((s, e) => s + e._count.predictions, 0);
  const inCorso    = attivi.filter((e) => e.stato === "IN_CORSO").length;
  const conclusi   = attivi.filter((e) => e.stato === "CONCLUSO").length;

  function EventoRow({ ev }: { ev: typeof eventi[0] }) {
    const cfg    = STATO[ev.stato] ?? STATO.CONCLUSO;
    const nome   = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a";
    const dpp    = new Date(ev.dataPresuntaParto).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
    const giorni = Math.round((new Date(ev.dataPresuntaParto).getTime() - Date.now()) / 86_400_000);
    const creato = new Date(ev.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: ev.archiviato ? "#f7f5f2" : "#fff", border: "1.5px solid #F1ECE4", borderRadius: 16, padding: "16px 20px", opacity: ev.archiviato ? 0.75 : 1 }}>
        {/* Dot */}
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: ev.archiviato ? "#d1c4c7" : cfg.dot, flexShrink: 0, boxShadow: (!ev.archiviato && ev.stato === "IN_CORSO") ? `0 0 6px ${cfg.dot}` : "none" }} />

        {/* Link sul nome */}
        <Link href={`/dashboard/${ev.id}`} style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2E", fontFamily: QS, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {nome} {ev.archiviato && <span style={{ fontSize: 11, color: "#847375" }}>(archiviato)</span>}
          </p>
          <p style={{ fontSize: 11, color: "rgba(44,44,46,0.45)", margin: "2px 0 0" }}>Creato il {creato}</p>
        </Link>

        {/* DPP */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#2C2C2E", margin: 0 }}>{dpp}</p>
          <p style={{ fontSize: 11, color: "rgba(44,44,46,0.45)", margin: "2px 0 0" }}>
            {ev.stato === "CONCLUSO" ? "nato/a" : giorni > 0 ? `tra ${giorni} giorni` : giorni === 0 ? "oggi! 🎉" : `${Math.abs(giorni)}g fa`}
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
        {!ev.archiviato && (
          <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, padding: "4px 10px", borderRadius: 999, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
        )}

        {/* Azioni: Duplica + Archivia */}
        <EventoActions eventId={ev.id} archiviato={ev.archiviato} />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 860, margin: "0 auto", fontFamily: VN }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C2C2E", fontFamily: QS, margin: 0 }}>
            Tutti i FantaParto
          </h1>
          <p style={{ fontSize: 13, color: "rgba(44,44,46,0.50)", margin: "4px 0 0" }}>
            {attivi.length === 0 ? "Nessun evento attivo" : `${attivi.length} event${attivi.length === 1 ? "o" : "i"} · ${totaleVoti} vot${totaleVoti === 1 ? "o" : "i"} totali`}
          </p>
        </div>
        <Link
          href="/dashboard/nuovo-evento"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: VN, textDecoration: "none", color: "#fff", flexShrink: 0, background: "linear-gradient(135deg, #874e58 0%, #5e2d3a 100%)", boxShadow: "0 4px 14px rgba(135,78,88,0.30)" }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          Nuova Sfida
        </Link>
      </div>

      {/* KPI row */}
      {attivi.length > 0 && (
        <div className="grid grid-cols-3" style={{ gap: 12, marginBottom: 24 }}>
          {[
            { label: "Totale eventi", value: attivi.length, icon: "🗂️" },
            { label: "In corso",      value: inCorso,        icon: "🟢" },
            { label: "Conclusi",      value: conclusi,       icon: "✅" },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: "#fff", border: "1.5px solid #F1ECE4", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#2C2C2E", fontFamily: QS, margin: 0, lineHeight: 1.1 }}>{value}</p>
                <p style={{ fontSize: 11, color: "rgba(44,44,46,0.45)", margin: "2px 0 0", fontWeight: 600 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista eventi attivi */}
      {attivi.length === 0 ? (
        <div style={{ background: "#fff", border: "1.5px solid #F1ECE4", borderRadius: 20, padding: "56px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 52 }}>🍼</span>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#2C2C2E", fontFamily: QS, margin: 0 }}>Nessun FantaParto ancora</p>
            <p style={{ fontSize: 13, color: "rgba(44,44,46,0.50)", margin: "6px 0 0" }}>Crea il tuo primo evento e invita i tuoi cari a votare!</p>
          </div>
          <Link href="/dashboard/nuovo-evento" style={{ display: "inline-block", marginTop: 8, padding: "12px 24px", borderRadius: 999, textDecoration: "none", fontWeight: 700, fontSize: 14, color: "#fff", background: "linear-gradient(135deg, #874e58 0%, #5e2d3a 100%)", boxShadow: "0 4px 14px rgba(135,78,88,0.25)" }}>
            🚀 Crea il primo FantaParto
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {attivi.map((ev) => <EventoRow key={ev.id} ev={ev} />)}
        </div>
      )}

      {/* Sezione archiviati */}
      {archiviati.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(44,44,46,0.35)", marginBottom: 12 }}>
            📦 Archiviati ({archiviati.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {archiviati.map((ev) => <EventoRow key={ev.id} ev={ev} />)}
          </div>
        </div>
      )}
    </div>
  );
}
