"use client";

import { useState } from "react";
import { type NuovoEventoFormData } from "../types";

const C = {
  white: "#ffffff", bg: "#fef5f4", border: "#f0e8e6", primary: "#b5352c",
  priXLight: "#fde8e6",
  onSurf: "#1a1a2e", onSurfVar: "#5a4e50", muted: "#a89a9b",
} as const;
const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";
const FR = "var(--font-fredoka, sans-serif)";
const MAX = 300;

interface Props { data: NuovoEventoFormData; onChange: (u: Partial<NuovoEventoFormData>) => void; }

export default function Step3Personalizzazione({ data, onChange }: Props) {
  const [focused, setFocused] = useState(false);
  const count = data.messaggioBenvenuto.length;

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 24, padding: "40px 36px", display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 4px 32px -8px rgba(181,53,44,0.10)" }}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💌</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, fontFamily: FR, color: C.onSurf, margin: "0 0 8px" }}>
          Un messaggio per i tuoi cari
        </h2>
        <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>
          Scrivi un messaggio che gli invitati leggeranno prima di votare. Puoi lasciarlo vuoto.
        </p>
      </div>

      {/* Textarea */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: focused ? C.primary : C.onSurfVar, fontFamily: VN }}>
          Messaggio di benvenuto (opzionale)
        </label>
        <div style={{ position: "relative" }}>
          <textarea
            value={data.messaggioBenvenuto}
            onChange={(e) => onChange({ messaggioBenvenuto: e.target.value.slice(0, MAX) })}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="es. Ciao a tutti! Siamo emozionatissimi…"
            rows={5}
            style={{
              width: "100%", boxSizing: "border-box", outline: "none", resize: "none",
              border: `1.5px solid ${focused ? C.primary : C.border}`,
              borderRadius: 16, padding: "14px 16px 40px",
              fontSize: 14, fontFamily: VN, color: C.onSurf,
              background: C.white, transition: "border-color 150ms", lineHeight: 1.6,
            }}
          />
          <span style={{ position: "absolute", bottom: 10, right: 14, fontSize: 11, color: count > 250 ? C.primary : C.muted, pointerEvents: "none" }}>
            {count}/{MAX}
          </span>
        </div>
      </div>

      {/* Live preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: 0 }}>
          Anteprima
        </p>
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 15, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: 0 }}>
            Il FantaParto di {data.nomeMamma || "…"}
          </p>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
            {data.nomeFeto ? `Baby ${data.nomeFeto}` : "…"}
          </p>
          {data.messaggioBenvenuto.trim() ? (
            <p style={{ fontSize: 13, color: C.onSurfVar, fontStyle: "italic", margin: "4px 0 0", lineHeight: 1.6 }}>
              &ldquo;{data.messaggioBenvenuto}&rdquo;
            </p>
          ) : (
            <span style={{ display: "inline-block", marginTop: 4, fontSize: 11, color: C.muted, background: C.white, border: `1px solid ${C.border}`, borderRadius: 999, padding: "2px 10px" }}>
              Nessun messaggio
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
