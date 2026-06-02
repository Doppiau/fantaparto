export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import GrandeGiornoWizard from "./GrandeGiornoWizard";
import { type Toggle, type Partecipante, type RisultatiEsistenti } from "../components/BottomTabs";

const C = {
  bg:     "#fef5f4",
  white:  "#ffffff",
  border: "#f0e8e6",
  primary:"#b5352c",
  priXL:  "#fde8e6",
  onSurf: "#1a1a2e",
  muted:  "#a89a9b",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";
const FR = "var(--font-fredoka, sans-serif)";

interface PageProps { params: Promise<{ eventId: string }> }

export default async function GrandeGiornoPage({ params }: PageProps) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const evento = await prisma.event.findFirst({
    where: { id: eventId, userId: user.id },
    select: {
      id: true, nomeBimbo: true, stato: true,
      codiceCondivisione: true,
      sessoAttivo: true, dataAttiva: true, pesoAttivo: true,
      oraAttiva: true, lunghezzaAttiva: true, capelliAttivo: true, occhiAttivo: true,
      realeSesso: true, realeData: true, realePeso: true,
      realeOra: true, realeLunghezza: true, realeCapelli: true, realeOcchi: true,
      predictions: {
        orderBy: [{ punteggioOttenuto: "desc" }, { createdAt: "asc" }],
        select: {
          id: true, nomeInvitato: true, emailInvitato: true,
          votoSesso: true, votoPeso: true, votoData: true,
          votoOra: true, votoLunghezza: true, votoCapelli: true, votoOcchi: true,
          punteggioOttenuto: true, messaggioAugurio: true, createdAt: true,
        },
      },
    },
  });

  if (!evento) notFound();

  const nomeEvento = evento.nomeBimbo ? `Baby ${evento.nomeBimbo}` : "Bimbo/a";

  const toggles: Toggle[] = [
    { key: "sessoAttivo",     label: "Sesso",     emoji: "👶", attivo: evento.sessoAttivo },
    { key: "dataAttiva",      label: "Data",      emoji: "📅", attivo: evento.dataAttiva },
    { key: "pesoAttivo",      label: "Peso",      emoji: "⚖️", attivo: evento.pesoAttivo },
    { key: "oraAttiva",       label: "Ora",       emoji: "🕐", attivo: evento.oraAttiva },
    { key: "lunghezzaAttiva", label: "Lunghezza", emoji: "📏", attivo: evento.lunghezzaAttiva },
    { key: "capelliAttivo",   label: "Capelli",   emoji: "💇", attivo: evento.capelliAttivo },
    { key: "occhiAttivo",     label: "Occhi",     emoji: "👁️", attivo: evento.occhiAttivo },
  ];

  const risultatiEsistenti: RisultatiEsistenti = {
    realeSesso:     evento.realeSesso,
    realeData:      evento.realeData,
    realePeso:      evento.realePeso,
    realeOra:       evento.realeOra,
    realeLunghezza: evento.realeLunghezza,
    realeCapelli:   evento.realeCapelli,
    realeOcchi:     evento.realeOcchi,
  };

  const partecipanti: Partecipante[] = evento.predictions.map((p) => ({
    id:                p.id,
    nomeInvitato:      p.nomeInvitato,
    emailInvitato:     p.emailInvitato,
    votoSesso:         p.votoSesso,
    votoPeso:          p.votoPeso,
    votoData:          p.votoData,
    votoOra:           p.votoOra,
    votoLunghezza:     p.votoLunghezza,
    votoCapelli:       p.votoCapelli,
    votoOcchi:         p.votoOcchi,
    punteggioOttenuto: p.punteggioOttenuto,
    messaggioAugurio:  p.messaggioAugurio,
    createdAt:         p.createdAt,
  }));

  // ── Sezione Ricordi (solo se CONCLUSO) ─────────────────────────────────────
  const CONCLUSO = evento.stato === "CONCLUSO";
  const formatData = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const SESSO_LABEL: Record<string, string> = { MASCHIO: "Maschio 💙", FEMMINA: "Femmina 🩷" };
  const CAPELLI_LABEL: Record<string, string> = { LISCI: "Lisci", RICCI: "Ricci", CALVO: "Calvo/a" };
  const OCCHI_LABEL: Record<string, string> = { CHIARI: "Chiari", SCURI: "Scuri" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: VN }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40, height: 56,
        background: C.white, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", padding: "0 24px", gap: 12,
      }}>
        <Link
          href={`/dashboard/${eventId}`}
          style={{ fontSize: 13, fontWeight: 600, color: C.muted, textDecoration: "none" }}
        >
          ← {nomeEvento}
        </Link>
        <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 700, fontFamily: FR, color: C.onSurf }}>
          {CONCLUSO ? "🏅 Sezione Ricordi" : "🏁 Il Grande Giorno"}
        </span>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── Sezione Ricordi — solo se CONCLUSO ──────────────────────────── */}
        {CONCLUSO && evento.realeData && (
          <div style={{
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 24, padding: "32px 28px", marginBottom: 32,
            boxShadow: "0 4px 32px -8px rgba(181,53,44,0.10)",
          }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <p style={{ fontSize: 40, margin: "0 0 8px" }}>👶</p>
              <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: FR, color: C.onSurf, margin: "0 0 6px" }}>
                {nomeEvento} è arrivato!
              </h2>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                {formatData(evento.realeData)}
              </p>
            </div>

            {/* Scheda dati nascita */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {[
                { label: "Sesso",    value: evento.realeSesso     ? SESSO_LABEL[evento.realeSesso]    ?? evento.realeSesso     : null, emoji: "👶" },
                { label: "Peso",     value: evento.realePeso       ? `${(evento.realePeso / 1000).toFixed(3)} kg`               : null, emoji: "⚖️" },
                { label: "Data",     value: evento.realeData       ? formatData(evento.realeData)                                : null, emoji: "📅" },
                { label: "Ora",      value: evento.realeOra        ? evento.realeOra                                             : null, emoji: "🕐" },
                { label: "Lunghezza",value: evento.realeLunghezza  ? `${(evento.realeLunghezza / 10).toFixed(1)} cm`            : null, emoji: "📏" },
                { label: "Capelli",  value: evento.realeCapelli    ? CAPELLI_LABEL[evento.realeCapelli] ?? evento.realeCapelli  : null, emoji: "💇" },
                { label: "Occhi",    value: evento.realeOcchi      ? OCCHI_LABEL[evento.realeOcchi]    ?? evento.realeOcchi     : null, emoji: "👁️" },
              ].filter((r) => r.value !== null).map((r) => (
                <div key={r.label} style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{r.emoji}</span>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: C.muted, margin: 0 }}>
                      {r.label}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.onSurf, margin: "2px 0 0" }}>
                      {r.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Link story */}
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <a
                href={`/api/og/story/${evento.codiceCondivisione}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontSize: 14, fontWeight: 700, color: C.white,
                  background: C.primary, borderRadius: 14,
                  padding: "12px 28px", textDecoration: "none",
                  boxShadow: "0 6px 18px rgba(181,53,44,0.28)",
                }}
              >
                📸 Genera Story Instagram/TikTok
              </a>
            </div>
          </div>
        )}

        {/* ── Wizard Grande Giorno ─────────────────────────────────────────── */}
        <div style={{
          background: C.white, border: `1px solid ${C.border}`,
          borderRadius: 24, padding: "36px 32px",
          boxShadow: "0 4px 32px -8px rgba(181,53,44,0.10)",
        }}>
          <GrandeGiornoWizard
            eventId={eventId}
            stato={evento.stato}
            toggles={toggles}
            risultatiEsistenti={risultatiEsistenti}
            partecipanti={partecipanti}
          />
        </div>

      </div>
    </div>
  );
}
