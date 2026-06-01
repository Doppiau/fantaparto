"use client";

import { type NuovoEventoFormData } from "../types";

const C = {
  white: "#ffffff", bg: "#fbf9f5", border: "#e8e4e1",
  primary: "#874e58", priXLight: "#ffd9de", priLight: "#f4acb7", onPri: "#733d47",
  secondary: "#40627b", secLight: "#bee1ff", onSec: "#42647e",
  onSurf: "#1b1c1a", onSurfVar: "#6b5b5d", muted: "#b0a0a2",
} as const;
const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

const ML: Record<string, { emoji: string; nome: string }> = {
  sesso:     { emoji: "👶", nome: "Sesso"     },
  data:      { emoji: "📅", nome: "Data"      },
  peso:      { emoji: "⚖️", nome: "Peso"      },
  ora:       { emoji: "🕐", nome: "Ora"       },
  lunghezza: { emoji: "📏", nome: "Lunghezza" },
  capelli:   { emoji: "💇", nome: "Capelli"   },
  occhi:     { emoji: "👁️", nome: "Occhi"     },
};

function Row({ icon, label, value, onEdit }: { icon: string; label: string; value: React.ReactNode; onEdit: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 18, width: 24, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.onSurf, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
      </div>
      <button onClick={onEdit} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: C.primary, fontFamily: VN, flexShrink: 0 }}>
        Modifica
      </button>
    </div>
  );
}

interface Props { data: NuovoEventoFormData; onGoToStep: (s: number) => void; onSubmit: () => void; isLoading: boolean; error: string | null; }

export default function Step4Anteprima({ data, onGoToStep }: Props) {
  const dppFormatted = data.dpp
    ? new Date(data.dpp).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const base    = Object.entries(data.metriche).filter(([k, v]) => v && ["sesso","data","peso"].includes(k)).map(([k]) => ML[k]?.nome).filter(Boolean);
  const premium = Object.entries(data.metriche).filter(([k, v]) => v && !["sesso","data","peso"].includes(k)).length;
  const metrLabel = [...base, premium > 0 ? `+${premium}🔒` : null].filter(Boolean).join(", ");

  const attive = Object.entries(data.metriche).filter(([, v]) => v).map(([k]) => ML[k]).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }} className="max-md:grid-cols-1">

        {/* Riepilogo */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "28px 28px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: "0 0 4px" }}>Tutto pronto! 🎉</h2>
          <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>Controlla i dettagli prima di creare il tuo FantaParto.</p>
          <Row icon="👶" label="Soprannome"  value={data.nomeFeto || "—"}   onEdit={() => onGoToStep(0)} />
          <Row icon="📅" label="DPP"         value={dppFormatted}            onEdit={() => onGoToStep(0)} />
          <Row icon="👤" label="Il tuo nome" value={data.nomeMamma || "—"}  onEdit={() => onGoToStep(0)} />
          <Row icon="🎯" label="Pronostici"  value={metrLabel || "—"}        onEdit={() => onGoToStep(1)} />
          <Row
            icon="💌" label="Messaggio"
            value={data.messaggioBenvenuto.trim()
              ? `"${data.messaggioBenvenuto.slice(0, 36)}${data.messaggioBenvenuto.length > 36 ? "…" : ""}"`
              : "Nessun messaggio"}
            onEdit={() => onGoToStep(2)}
          />
        </div>

        {/* Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: 0 }}>
            Anteprima pagina invitati
          </p>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", height: 260 }}>
            <div style={{ transform: "scale(0.62)", transformOrigin: "top left", width: "161%", pointerEvents: "none", userSelect: "none" }}>
              <div style={{ background: C.white, padding: "24px 28px", fontFamily: VN }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${C.priLight}, ${C.primary})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: C.white, fontSize: 12, fontWeight: 900, fontFamily: QS }}>F</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, fontFamily: QS }}>FantaParto</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: "0 0 4px" }}>Il FantaParto di {data.nomeMamma || "…"}</h3>
                <p style={{ fontSize: 13, color: C.muted, margin: "0 0 12px" }}>Fai il tuo pronostico per {data.nomeFeto ? `Baby ${data.nomeFeto}` : "…"}!</p>
                {data.messaggioBenvenuto.trim() && (
                  <p style={{ fontSize: 12, fontStyle: "italic", color: C.onSurfVar, margin: "0 0 14px", lineHeight: 1.5, borderLeft: `3px solid ${C.priLight}`, paddingLeft: 10 }}>
                    &ldquo;{data.messaggioBenvenuto.slice(0, 80)}&rdquo;
                  </p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {attive.map((m) => (
                    <span key={m.nome} style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: C.priXLight, color: C.onPri }}>
                      {m.emoji} {m.nome}
                    </span>
                  ))}
                </div>
                <div style={{ background: C.muted, borderRadius: 999, padding: "10px 20px", textAlign: "center", fontSize: 13, fontWeight: 700, color: C.white }}>
                  Vota ora →
                </div>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 11, color: C.muted }}>Anteprima semplificata — la pagina reale è ottimizzata per mobile.</p>
        </div>
      </div>
    </div>
  );
}
