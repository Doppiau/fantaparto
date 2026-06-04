"use client";

import { useState } from "react";
import Link from "next/link";
import CountdownCard from "@/components/widgets/CountdownCard";
import SessoWidget from "@/components/widgets/SessoWidget";
import BilanciaPesoWidget from "@/components/widgets/BilanciaPesoWidget";
import CalendarioWidget from "@/components/widgets/CalendarioWidget";

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";
const FR = "var(--font-fredoka, sans-serif)";

// ── Tema colori ────────────────────────────────────────────────────────────────
const TEMA: Record<string, { primary: string; light: string; xlight: string }> = {
  ROSA:    { primary: "#874e58", light: "#f4acb7", xlight: "#fde8e6" },
  CELESTE: { primary: "#2c6e8a", light: "#bee1ff", xlight: "#dff0ff" },
  NEUTRO:  { primary: "#6b5b5d", light: "#d6c2c3", xlight: "#f0e8e9" },
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface EventProps {
  nomeBimbo:          string | null;
  dataPresuntaParto:  string;
  stato:              string;
  isPremium:          boolean;
  hypeSpaceAnonimo:   boolean;
  temaColore:         string;
  codiceCondivisione: string;
  sessoAttivo:        boolean;
  pesoAttivo:         boolean;
  dataAttiva:         boolean;
  lunghezzaAttiva:    boolean;
  capelliAttivo:      boolean;
  occhiAttivo:        boolean;
  oraAttiva:          boolean;
}

interface Stats {
  totaleVoti:       number;
  maschio:          number;
  femmina:          number;
  mediaPeso:        number | null;
  minPeso:          number;
  maxPeso:          number;
  totVotiPeso:      number;
  votiPerGiorno:    Record<string, number>;
  mediaLunghezza:   number | null;
  totVotiLunghezza: number;
  capelliDist:      { LISCI: number; RICCI: number; CALVO: number };
  occhiDist:        { CHIARI: number; SCURI: number };
  oreDist:          Record<string, number>;
}

// ── Mini componenti ────────────────────────────────────────────────────────────

function StatChip({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "14px 16px", background: "#fff", borderRadius: 16, border: "1.5px solid #F1ECE4", flex: 1 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 18, fontWeight: 800, color: "#2C2C2E", fontFamily: QS, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(44,44,46,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
    </div>
  );
}

function DistBar({ label, count, total, color, emoji }: { label: string; count: number; total: number; color: string; emoji: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2C2C2E", fontFamily: VN }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color }}>
            {count > 0 ? `${pct}% (${count})` : "—"}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: "#F1ECE4", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.6s ease" }} />
        </div>
      </div>
    </div>
  );
}

// ── Overlay anonimo ────────────────────────────────────────────────────────────
function AnonOverlay() {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10, borderRadius: 28,
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      background: "rgba(253,251,247,0.85)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
      padding: 24, textAlign: "center",
    }}>
      <span style={{ fontSize: 32 }}>🔒</span>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#2C2C2E", margin: 0, fontFamily: QS }}>
        Segreto fino alla nascita
      </p>
      <p style={{ fontSize: 11, color: "rgba(44,44,46,0.55)", margin: 0, lineHeight: 1.5 }}>
        La mamma ha attivato la modalità anonima.<br />I risultati si sbloccano dopo il parto!
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HypeSpaceClient({ event, stats }: { event: EventProps; stats: Stats }) {
  const [copied, setCopied] = useState(false);
  const tema = TEMA[event.temaColore] ?? TEMA.ROSA;
  const nomeDisplay = event.nomeBimbo ? `Baby ${event.nomeBimbo}` : "Il Fagiolino";
  const hypeUrl = `https://fantaparto.com/vota/${event.codiceCondivisione}/hype`;
  const isConcluso = event.stato === "CONCLUSO";

  function handleShare() {
    navigator.clipboard.writeText(hypeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const totCapelli = stats.capelliDist.LISCI + stats.capelliDist.RICCI + stats.capelliDist.CALVO;
  const totOcchi   = stats.occhiDist.CHIARI + stats.occhiDist.SCURI;
  const totOra     = Object.values(stats.oreDist).reduce((a, b) => a + b, 0);
  const oreLabels: Record<string, string> = { Mattina: "🌅", Pomeriggio: "☀️", Sera: "🌆", Notte: "🌙" };

  return (
    <div style={{ minHeight: "100vh", background: "#fbf9f5", fontFamily: VN }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(253,251,247,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #F1ECE4",
        padding: "0 20px", height: 60,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Link href={`/vota/${event.codiceCondivisione}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>🍼</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: tema.primary, fontFamily: QS }}>FantaParto</span>
        </Link>

        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#2C2C2E", margin: 0, fontFamily: QS }}>{nomeDisplay}</p>
        </div>

        {/* Live badge + share */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isConcluso && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#166534", background: "#dcfce7", borderRadius: 999, padding: "3px 10px", border: "1px solid #bbf7d0" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block", boxShadow: "0 0 4px #16a34a" }} />
              LIVE
            </span>
          )}
          <button
            type="button"
            onClick={handleShare}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: copied ? "#166534" : tema.primary, background: copied ? "#dcfce7" : tema.xlight, border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", transition: "all 200ms" }}
          >
            {copied ? "✓ Copiato!" : "📤 Condividi"}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div style={{
          borderRadius: 24, padding: "28px 28px 24px",
          background: `linear-gradient(135deg, ${tema.xlight} 0%, #fff8f7 70%, #fbf9f5 100%)`,
          border: `1.5px solid ${tema.light}55`,
          marginBottom: 16, textAlign: "center",
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: tema.primary, margin: "0 0 6px" }}>
            Hype Space
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: FR, color: "#1b1c1a", margin: "0 0 8px", lineHeight: 1.2 }}>
            {nomeDisplay}
          </h1>
          <p style={{ fontSize: 13, color: "rgba(44,44,46,0.55)", margin: 0 }}>
            {isConcluso
              ? "L'evento si è concluso. Ecco com'è andata!"
              : `${stats.totaleVoti} pronostic${stats.totaleVoti === 1 ? "o" : "i"} ricevut${stats.totaleVoti === 1 ? "o" : "i"} fino ad ora`}
          </p>
        </div>

        {/* ── Chip stats rapide ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <StatChip icon="🗳️" value={String(stats.totaleVoti)} label="Pronostici" />
          {event.sessoAttivo && stats.maschio + stats.femmina > 0 && (
            <StatChip
              icon={stats.maschio >= stats.femmina ? "💙" : "🩷"}
              value={stats.maschio >= stats.femmina ? `${Math.round(stats.maschio / (stats.maschio + stats.femmina) * 100)}% M` : `${Math.round(stats.femmina / (stats.maschio + stats.femmina) * 100)}% F`}
              label="Sesso favorito"
            />
          )}
          {event.pesoAttivo && stats.mediaPeso !== null && (
            <StatChip
              icon="⚖️"
              value={`${(stats.mediaPeso / 1000).toFixed(2).replace(".", ",")} kg`}
              label="Peso medio"
            />
          )}
        </div>

        {/* ── Countdown ─────────────────────────────────────────────────────── */}
        {!isConcluso && (
          <div style={{ marginBottom: 16 }}>
            <CountdownCard dataPresuntaParto={event.dataPresuntaParto} />
          </div>
        )}

        {/* ── Sesso widget ──────────────────────────────────────────────────── */}
        {event.sessoAttivo && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <SessoWidget maschio={stats.maschio} femmina={stats.femmina} totale={stats.maschio + stats.femmina} />
            {event.hypeSpaceAnonimo && <AnonOverlay />}
          </div>
        )}

        {/* ── Peso widget ───────────────────────────────────────────────────── */}
        {event.pesoAttivo && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <BilanciaPesoWidget
              mediaPeso={stats.mediaPeso}
              minPeso={stats.minPeso}
              maxPeso={stats.maxPeso}
              totVotiPeso={stats.totVotiPeso}
            />
            {event.hypeSpaceAnonimo && <AnonOverlay />}
          </div>
        )}

        {/* ── TotoData calendar ─────────────────────────────────────────────── */}
        {event.dataAttiva && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <CalendarioWidget
              dataPresuntaParto={new Date(event.dataPresuntaParto)}
              votiPerGiorno={stats.votiPerGiorno}
            />
            {event.hypeSpaceAnonimo && <AnonOverlay />}
          </div>
        )}

        {/* ── Metriche avanzate Premium ─────────────────────────────────────── */}
        {event.isPremium && (event.lunghezzaAttiva || event.capelliAttivo || event.occhiAttivo || event.oraAttiva) && (
          <div className="clay-card" style={{ padding: 24, marginBottom: 16, position: "relative" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#2C2C2E", fontFamily: QS, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              ✨ Pronostici avanzati
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Lunghezza */}
              {event.lunghezzaAttiva && stats.mediaLunghezza !== null && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", margin: "0 0 8px" }}>
                    📏 Lunghezza media prevista
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: "#40627b", fontFamily: QS, margin: 0, lineHeight: 1 }}>
                    {(stats.mediaLunghezza / 10).toFixed(1).replace(".", ",")} cm
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(44,44,46,0.40)", marginLeft: 6 }}>
                      su {stats.totVotiLunghezza} voti
                    </span>
                  </p>
                </div>
              )}

              {/* Capelli */}
              {event.capelliAttivo && totCapelli > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", margin: "0 0 10px" }}>
                    💇 Capelli
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <DistBar label="Lisci"  count={stats.capelliDist.LISCI} total={totCapelli} color="#874e58" emoji="💇" />
                    <DistBar label="Ricci"  count={stats.capelliDist.RICCI} total={totCapelli} color="#40627b" emoji="🌀" />
                    <DistBar label="Calvo"  count={stats.capelliDist.CALVO} total={totCapelli} color="#f59e0b" emoji="✨" />
                  </div>
                </div>
              )}

              {/* Occhi */}
              {event.occhiAttivo && totOcchi > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", margin: "0 0 10px" }}>
                    👁️ Colore occhi
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <DistBar label="Chiari" count={stats.occhiDist.CHIARI} total={totOcchi} color="#40627b" emoji="🔵" />
                    <DistBar label="Scuri"  count={stats.occhiDist.SCURI}  total={totOcchi} color="#874e58" emoji="🟤" />
                  </div>
                </div>
              )}

              {/* Ora di nascita */}
              {event.oraAttiva && totOra > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", margin: "0 0 10px" }}>
                    🕐 Fascia oraria preferita
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(["Mattina", "Pomeriggio", "Sera", "Notte"] as const).map((fascia) => (
                      <DistBar key={fascia} label={fascia} count={stats.oreDist[fascia] ?? 0} total={totOra} color="#f59e0b" emoji={oreLabels[fascia]} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {event.hypeSpaceAnonimo && <AnonOverlay />}
          </div>
        )}

        {/* ── CTA: Vota anche tu ────────────────────────────────────────────── */}
        {!isConcluso && (
          <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
            <p style={{ fontSize: 13, color: "rgba(44,44,46,0.50)", margin: "0 0 12px" }}>
              Non hai ancora votato?
            </p>
            <Link
              href={`/vota/${event.codiceCondivisione}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 15, fontWeight: 700, color: "#fff",
                background: `linear-gradient(135deg, ${tema.primary}, ${tema.light}cc)`,
                borderRadius: 999, padding: "13px 28px",
                textDecoration: "none",
                boxShadow: `0 8px 24px ${tema.primary}40`,
              }}
            >
              🚀 Fai il tuo pronostico!
            </Link>
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "rgba(44,44,46,0.35)", margin: "0 0 8px" }}>
            Aggiorna la pagina per vedere i pronostici più recenti
          </p>
          <p style={{ fontSize: 12, color: "rgba(44,44,46,0.35)", margin: 0 }}>
            Powered by{" "}
            <Link href="/" style={{ color: tema.primary, fontWeight: 700, textDecoration: "none" }}>
              FantaParto
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
