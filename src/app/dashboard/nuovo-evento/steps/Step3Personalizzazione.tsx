"use client";

import { useState } from "react";
import { type NuovoEventoFormData } from "../types";

const C = {
  white:        "#ffffff",
  primary:      "#874e58",
  primaryFixed: "#ffd9de",
  onSurf:       "#1b1c1a",
  onSurfVar:    "#514345",
  outlineVar:   "#d6c2c3",
  surfContLow:  "#f5f3ef",
  surfCont:     "#efeeea",
  shadow:       "0px 12px 32px rgba(135,78,88,0.08)",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

const MAX_CHARS = 300;

interface Props {
  data:     NuovoEventoFormData;
  onChange: (updates: Partial<NuovoEventoFormData>) => void;
}

export default function Step3Personalizzazione({ data, onChange }: Props) {
  const [focused, setFocused] = useState(false);

  const charCount    = data.messaggioBenvenuto.length;
  const counterColor = charCount > 250 ? C.primary : C.outlineVar;

  return (
    <div
      className="mx-auto max-w-lg rounded-[3rem] p-10 flex flex-col gap-6"
      style={{ background: C.white, boxShadow: C.shadow }}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-5xl select-none" aria-hidden>💌</span>
        <h2
          className="text-[28px] font-semibold"
          style={{ fontFamily: QS, color: C.onSurf }}
        >
          Un messaggio per i tuoi cari
        </h2>
        <p className="text-[15px] font-normal max-w-xs" style={{ color: C.onSurfVar }}>
          Scrivi un messaggio che gli invitati leggeranno prima di votare. Puoi lasciarlo vuoto.
        </p>
      </div>

      {/* Textarea */}
      <div className="flex flex-col gap-1">
        <label
          className="text-[13px] font-semibold"
          style={{ color: focused ? C.primary : C.onSurfVar, fontFamily: VN }}
        >
          Messaggio di benvenuto (opzionale)
        </label>

        <div className="relative">
          <textarea
            value={data.messaggioBenvenuto}
            onChange={(e) =>
              onChange({ messaggioBenvenuto: e.target.value.slice(0, MAX_CHARS) })
            }
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="es. Ciao a tutti! Siamo emozionatissimi e vogliamo giocare con voi a indovinare chi sarà il nostro piccolo. Votate e che vinca il migliore! 🍼"
            rows={5}
            className="w-full outline-none resize-none"
            style={{
              background:   C.white,
              border:       `1.5px solid ${focused ? C.primary : C.outlineVar}`,
              borderRadius: "24px",
              padding:      "16px 20px 36px",
              fontSize:     "15px",
              fontFamily:   VN,
              color:        C.onSurf,
              transition:   "border-color 150ms",
              lineHeight:   "1.6",
            }}
          />
          {/* Counter */}
          <span
            className="absolute bottom-3 right-4 text-[11px] font-medium pointer-events-none select-none"
            style={{ color: counterColor, fontFamily: VN }}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {/* Anteprima live */}
      <div className="flex flex-col gap-2">
        <p
          className="text-[13px] font-semibold uppercase tracking-widest"
          style={{ color: C.onSurfVar, fontFamily: VN }}
        >
          Anteprima
        </p>

        <div
          className="rounded-[1.5rem] p-5 flex flex-col gap-2"
          style={{ background: C.surfContLow }}
        >
          <p
            className="text-[16px] font-bold"
            style={{ fontFamily: QS, color: C.onSurf }}
          >
            Il FantaParto di {data.nomeMamma || "..."}
          </p>
          <p className="text-[12px] font-medium" style={{ color: C.onSurfVar, fontFamily: VN }}>
            {data.nomeFeto ? `Baby ${data.nomeFeto}` : "..."}
          </p>

          {data.messaggioBenvenuto.trim() ? (
            <p
              className="text-[14px] italic mt-1"
              style={{ color: C.onSurfVar, fontFamily: VN, lineHeight: "1.6" }}
            >
              &ldquo;{data.messaggioBenvenuto}&rdquo;
            </p>
          ) : (
            <span
              className="self-start rounded-full px-3 py-1 text-[11px] font-semibold mt-1"
              style={{ background: C.surfCont, color: C.onSurfVar, fontFamily: VN }}
            >
              Nessun messaggio — gli invitati vedranno direttamente il form di voto
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
