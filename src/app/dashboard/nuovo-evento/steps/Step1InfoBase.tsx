"use client";

import { useState } from "react";
import { type NuovoEventoFormData } from "../types";

const C = {
  white:        "#ffffff",
  primary:      "#874e58",
  primaryFixed: "#ffd9de",
  primaryCont:  "#f4acb7",
  onPriCont:    "#733d47",
  secondary:    "#40627b",
  secCont:      "#bee1ff",
  onSecCont:    "#42647e",
  onSurf:       "#1b1c1a",
  onSurfVar:    "#514345",
  outlineVar:   "#d6c2c3",
  error:        "#ba1a1a",
  errCont:      "#ffdad6",
  shadow:       "0px 12px 32px rgba(135,78,88,0.08)",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDomani(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getMaxDPP(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

function calcolaSettimana(dpp: string): number | null {
  if (!dpp) return null;
  const oggi  = new Date();
  const dppD  = new Date(dpp);
  if (isNaN(dppD.getTime()) || dppD <= oggi) return null;
  const giorni = Math.ceil((dppD.getTime() - oggi.getTime()) / 86_400_000);
  return Math.max(0, 40 - Math.ceil(giorni / 7));
}

// ── Componente input pill con floating label ──────────────────────────────────

function InputField({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  helperText,
  error,
  min,
  max,
  maxLength,
  showCounter,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  min?: string;
  max?: string;
  maxLength?: number;
  showCounter?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <div className="flex flex-col gap-1">
      {/* Floating label */}
      <label
        className="text-[13px] font-semibold"
        style={{ color: hasError ? C.error : focused ? C.primary : C.onSurfVar, fontFamily: VN }}
      >
        {label}
      </label>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          placeholder={placeholder}
          min={min}
          max={max}
          maxLength={maxLength}
          className="w-full outline-none"
          style={{
            background:    C.white,
            border:        `1.5px solid ${hasError ? C.error : focused ? C.primary : C.outlineVar}`,
            borderRadius:  "999px",
            padding:       "14px 20px",
            fontSize:      "15px",
            fontFamily:    VN,
            color:         C.onSurf,
            transition:    "border-color 150ms",
          }}
        />
        {/* Contatore caratteri */}
        {showCounter && maxLength && (
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-medium pointer-events-none select-none"
            style={{ color: value.length > maxLength * 0.85 ? C.primary : C.outlineVar }}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      {/* Helper / Error */}
      {(helperText || error) && (
        <p
          className="text-[12px] font-medium px-2"
          style={{ color: hasError ? C.error : C.onSurfVar, fontFamily: VN }}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────

interface Props {
  data:     NuovoEventoFormData;
  onChange: (updates: Partial<NuovoEventoFormData>) => void;
}

export default function Step1InfoBase({ data, onChange }: Props) {
  const [touched, setTouched] = useState({
    nomeFeto: false,
    dpp:      false,
    nomeMamma:false,
  });

  const touch = (field: keyof typeof touched) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  // Errori inline
  const errNomeFeto =
    touched.nomeFeto && data.nomeFeto.trim().length < 2
      ? "Inserisci almeno 2 caratteri"
      : undefined;

  const errDpp = (() => {
    if (!touched.dpp) return undefined;
    if (!data.dpp)    return "Seleziona una data";
    const d = new Date(data.dpp);
    const oggi = new Date(); oggi.setHours(0,0,0,0);
    if (isNaN(d.getTime()))  return "Data non valida";
    if (d <= oggi)           return "La DPP deve essere nel futuro";
    return undefined;
  })();

  const errNomeMamma =
    touched.nomeMamma && data.nomeMamma.trim().length < 2
      ? "Inserisci almeno 2 caratteri"
      : undefined;

  const settimana = calcolaSettimana(data.dpp);

  return (
    <div
      className="mx-auto max-w-lg rounded-[3rem] p-10 flex flex-col gap-6"
      style={{ background: C.white, boxShadow: C.shadow }}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-5xl select-none" aria-hidden>🍼</span>
        <h2
          className="text-[28px] font-semibold"
          style={{ fontFamily: QS, color: C.onSurf }}
        >
          Parliamo del tuo piccolo
        </h2>
        <p className="text-[15px] font-normal max-w-xs" style={{ color: C.onSurfVar }}>
          Queste informazioni saranno visibili agli invitati che voteranno.
        </p>
      </div>

      {/* Campo 1 — Soprannome feto */}
      <InputField
        label="Soprannome del piccolo"
        value={data.nomeFeto}
        onChange={(v) => onChange({ nomeFeto: v })}
        onBlur={touch("nomeFeto")}
        placeholder="es. Baby Rossi, Principessa, Campione..."
        helperText="Questo nome apparirà nella pagina di voto degli invitati"
        error={errNomeFeto}
        maxLength={30}
        showCounter
      />

      {/* Campo 2 — DPP */}
      <div className="flex flex-col gap-1">
        <InputField
          label="Data Presunta del Parto"
          type="date"
          value={data.dpp}
          onChange={(v) => onChange({ dpp: v })}
          onBlur={touch("dpp")}
          helperText="Puoi modificarla in seguito dalla configurazione"
          error={errDpp}
          min={getDomani()}
          max={getMaxDPP()}
        />

        {/* Pill settimana di gravidanza */}
        {settimana !== null && (
          <div
            className="self-start rounded-full px-4 py-1.5 text-[13px] font-semibold mt-1"
            style={{ background: C.secCont, color: C.onSecCont, fontFamily: VN }}
          >
            📅 Sei alla settimana {settimana} di gravidanza
          </div>
        )}
      </div>

      {/* Campo 3 — Nome mamma */}
      <InputField
        label="Il tuo nome (visibile agli invitati)"
        value={data.nomeMamma}
        onChange={(v) => onChange({ nomeMamma: v })}
        onBlur={touch("nomeMamma")}
        placeholder="es. Giulia"
        helperText={`Gli invitati vedranno "Il FantaParto di ${data.nomeMamma || "..."}" `}
        error={errNomeMamma}
      />
    </div>
  );
}
