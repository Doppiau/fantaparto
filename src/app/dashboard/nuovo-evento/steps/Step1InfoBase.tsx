"use client";

import { useState } from "react";
import { type NuovoEventoFormData } from "../types";

const C = {
  white: "#ffffff", border: "#e8e4e1", primary: "#874e58",
  priXLight: "#ffd9de", priLight: "#f4acb7", onPri: "#733d47",
  secondary: "#40627b", secLight: "#bee1ff", onSec: "#42647e",
  onSurf: "#1b1c1a", onSurfVar: "#6b5b5d", muted: "#b0a0a2",
  error: "#b91c1c", errBg: "#fef2f2", errBrd: "#fecaca",
} as const;
const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

function getDomani() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; }
function getMaxDPP()  { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split("T")[0]; }
function calcolaSettimana(dpp: string): number | null {
  if (!dpp) return null;
  const oggi = new Date(); const dppD = new Date(dpp);
  if (isNaN(dppD.getTime()) || dppD <= oggi) return null;
  return Math.max(0, 40 - Math.ceil((dppD.getTime() - oggi.getTime()) / (86_400_000 * 7)));
}

function InputRow({
  label, id, type = "text", value, onChange, onBlur,
  placeholder, helper, error, min, max, maxLength, showCounter,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; onBlur?: () => void;
  placeholder?: string; helper?: string; error?: string;
  min?: string; max?: string; maxLength?: number; showCounter?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const hasErr = !!error;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: hasErr ? C.error : C.onSurfVar, fontFamily: VN }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id} type={type} value={value} placeholder={placeholder}
          min={min} max={max} maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          style={{
            width: "100%", boxSizing: "border-box", outline: "none",
            border: `1.5px solid ${hasErr ? C.error : focused ? C.primary : C.border}`,
            borderRadius: 999, padding: "13px 20px",
            paddingRight: showCounter ? 56 : 20,
            fontSize: 15, fontFamily: VN, color: C.onSurf,
            background: C.white, transition: "border-color 150ms",
          }}
        />
        {showCounter && maxLength && (
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: value.length > maxLength * 0.85 ? C.primary : C.muted, pointerEvents: "none" }}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {(helper || error) && (
        <p style={{ fontSize: 12, color: hasErr ? C.error : C.muted, paddingLeft: 4, margin: 0, fontFamily: VN }}>
          {error ?? helper}
        </p>
      )}
    </div>
  );
}

interface Props { data: NuovoEventoFormData; onChange: (u: Partial<NuovoEventoFormData>) => void; }

export default function Step1InfoBase({ data, onChange }: Props) {
  const [touched, setTouched] = useState({ nomeFeto: false, dpp: false, nomeMamma: false });
  const touch = (k: keyof typeof touched) => () => setTouched((t) => ({ ...t, [k]: true }));
  const oggi  = new Date(); oggi.setHours(0, 0, 0, 0);
  const dppD  = data.dpp ? new Date(data.dpp) : null;

  const errNome = touched.nomeFeto && data.nomeFeto.trim().length < 2 ? "Minimo 2 caratteri" : undefined;
  const errDpp  = touched.dpp
    ? !data.dpp ? "Seleziona una data" : dppD && dppD <= oggi ? "La DPP deve essere futura" : undefined
    : undefined;
  const errMamma = touched.nomeMamma && data.nomeMamma.trim().length < 2 ? "Minimo 2 caratteri" : undefined;
  const settimana = calcolaSettimana(data.dpp);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "36px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🍼</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: "0 0 8px" }}>
          Parliamo del tuo piccolo
        </h2>
        <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>
          Queste informazioni saranno visibili agli invitati che voteranno.
        </p>
      </div>

      <InputRow label="Soprannome del piccolo" id="nomeFeto" value={data.nomeFeto}
        onChange={(v) => onChange({ nomeFeto: v })} onBlur={touch("nomeFeto")}
        placeholder="es. Baby Rossi, Principessa…"
        helper="Apparirà nella pagina di voto degli invitati"
        error={errNome} maxLength={30} showCounter />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <InputRow label="Data Presunta del Parto" id="dpp" type="date" value={data.dpp}
          onChange={(v) => onChange({ dpp: v })} onBlur={touch("dpp")}
          helper="Puoi modificarla in seguito dalla configurazione"
          error={errDpp} min={getDomani()} max={getMaxDPP()} />
        {settimana !== null && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.secLight, borderRadius: 999, padding: "4px 12px", width: "fit-content", fontSize: 12, fontWeight: 700, color: C.onSec }}>
            📅 Sei alla settimana {settimana} di gravidanza
          </span>
        )}
      </div>

      <InputRow label="Il tuo nome (visibile agli invitati)" id="nomeMamma" value={data.nomeMamma}
        onChange={(v) => onChange({ nomeMamma: v })} onBlur={touch("nomeMamma")}
        placeholder="es. Giulia"
        helper={`Gli invitati vedranno "Il FantaParto di ${data.nomeMamma || "..."}"`}
        error={errMamma} />
    </div>
  );
}
