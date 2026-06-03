"use client";

import { useState, useTransition } from "react";
import { creaCouponAction, disattivaCouponAction, eliminaCouponAction } from "./p2-actions";

interface CouponRow {
  id: string; codice: string; tipo: string;
  creatorTag: string | null; usoMax: number | null; usoCorrente: number;
  scadenza: Date | null; attivo: boolean; note: string | null;
}

const S = { border: "#1e293b", text: "#f1f5f9", muted: "#64748b", red: "#ef4444", green: "#22c55e", purple: "#a78bfa", yellow: "#eab308" };

const TIPO_LABEL: Record<string, { label: string; color: string }> = {
  PREMIUM_USER:    { label: "⭐ Premium Account", color: "#a78bfa" },
  PREMIUM_EVENTO:  { label: "💎 Premium Evento",  color: "#38bdf8" },
  SCONTO_PCT:      { label: "🏷️ Sconto %",         color: "#34d399" },
};

export function CouponManager({ initialCoupons }: { initialCoupons: CouponRow[] }) {
  const [coupons, setCoupons]     = useState(initialCoupons);
  const [form, setForm]           = useState({ tipo: "PREMIUM_USER", creatorTag: "", prefisso: "", usoMax: "", scadenzaGg: "", note: "" });
  const [msg, setMsg]             = useState<string | null>(null);
  const [generato, setGenerato]   = useState<string | null>(null);
  const [pending, setPending]     = useState<string | null>(null);
  const [, startTransition]       = useTransition();

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 4000); }

  function handleCrea() {
    startTransition(async () => {
      const res = await creaCouponAction({
        tipo:       form.tipo as "PREMIUM_USER" | "PREMIUM_EVENTO" | "SCONTO_PCT",
        creatorTag: form.creatorTag || undefined,
        prefisso:   form.prefisso || undefined,
        usoMax:     form.usoMax ? parseInt(form.usoMax) : undefined,
        scadenzaGg: form.scadenzaGg ? parseInt(form.scadenzaGg) : undefined,
        note:       form.note || undefined,
      });
      if (res.success && res.codice) {
        setGenerato(res.codice);
        setForm({ tipo: "PREMIUM_USER", creatorTag: "", prefisso: "", usoMax: "", scadenzaGg: "", note: "" });
        flash("✓ Coupon generato!");
      } else {
        flash(`✗ ${res.error}`);
      }
    });
  }

  function handleDisattiva(id: string) {
    setPending(id);
    setCoupons((l) => l.map((c) => c.id === id ? { ...c, attivo: false } : c));
    startTransition(async () => {
      const res = await disattivaCouponAction(id);
      if (!res.success) { setCoupons((l) => l.map((c) => c.id === id ? { ...c, attivo: true } : c)); flash(`✗ ${res.error}`); }
      setPending(null);
    });
  }

  function handleElimina(id: string, codice: string) {
    if (!confirm(`Eliminare il coupon ${codice}?`)) return;
    setCoupons((l) => l.filter((c) => c.id !== id));
    startTransition(async () => {
      const res = await eliminaCouponAction(id);
      if (!res.success) { flash(`✗ ${res.error}`); }
    });
  }

  const inp = (style?: React.CSSProperties): React.CSSProperties => ({
    padding: "7px 10px", borderRadius: 7, border: `1px solid ${S.border}`,
    background: "#020617", color: S.text, fontSize: 12, outline: "none", ...style,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Form generazione */}
      <div style={{ background: "#020617", border: `1px solid ${S.border}`, borderRadius: 10, padding: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: S.muted, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          🎟️ Genera nuovo coupon
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
          <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} style={inp({ minWidth: 160 })}>
            <option value="PREMIUM_USER">⭐ Premium Account</option>
            <option value="PREMIUM_EVENTO">💎 Premium Evento</option>
            <option value="SCONTO_PCT">🏷️ Sconto %</option>
          </select>
          <input placeholder="Creator/tag (es. CHIARA)" value={form.creatorTag} onChange={(e) => setForm((f) => ({ ...f, creatorTag: e.target.value }))} style={inp({ width: 140 })} />
          <input placeholder="Prefisso codice" value={form.prefisso} onChange={(e) => setForm((f) => ({ ...f, prefisso: e.target.value }))} style={inp({ width: 100 })} />
          <input type="number" placeholder="Max usi (∞)" value={form.usoMax} onChange={(e) => setForm((f) => ({ ...f, usoMax: e.target.value }))} style={inp({ width: 90 })} min={1} />
          <input type="number" placeholder="Scade in gg" value={form.scadenzaGg} onChange={(e) => setForm((f) => ({ ...f, scadenzaGg: e.target.value }))} style={inp({ width: 90 })} min={1} />
          <input placeholder="Note" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} style={inp({ flex: "1 1 140px" })} />
          <button onClick={handleCrea} style={{ padding: "7px 18px", borderRadius: 7, border: "none", background: "#a78bfa22", color: S.purple, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Genera ✨
          </button>
        </div>

        {generato && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#22c55e12", border: `1px solid ${S.green}33`, borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 900, color: S.green, letterSpacing: "0.1em" }}>{generato}</span>
            <button onClick={() => navigator.clipboard.writeText(generato)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#22c55e22", color: S.green, fontSize: 11, cursor: "pointer" }}>
              📋 Copia
            </button>
          </div>
        )}
        {msg && <p style={{ fontSize: 12, marginTop: 8, color: msg.startsWith("✓") ? S.green : S.red }}>{msg}</p>}
      </div>

      {/* Tabella coupon */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.border}`, color: S.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {["Codice", "Tipo", "Creator", "Usi", "Scadenza", "Stato", "Azioni"].map((h) => (
                <th key={h} style={{ padding: "7px 10px", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 20, textAlign: "center", color: S.muted }}>Nessun coupon ancora</td></tr>
            )}
            {coupons.map((c) => {
              const tipo = TIPO_LABEL[c.tipo] ?? { label: c.tipo, color: S.muted };
              const scaduto = c.scadenza ? new Date(c.scadenza) < new Date() : false;
              return (
                <tr key={c.id} style={{ borderBottom: `1px solid ${S.border}22`, opacity: (!c.attivo || scaduto) ? 0.5 : 1 }}>
                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: 700, color: S.text }}>{c.codice}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: tipo.color + "22", color: tipo.color }}>{tipo.label}</span>
                  </td>
                  <td style={{ padding: "8px 10px", color: S.muted }}>{c.creatorTag ?? "—"}</td>
                  <td style={{ padding: "8px 10px", color: S.muted }}>{c.usoCorrente}{c.usoMax ? `/${c.usoMax}` : "/∞"}</td>
                  <td style={{ padding: "8px 10px", color: scaduto ? S.red : S.muted }}>
                    {c.scadenza ? new Date(c.scadenza).toLocaleDateString("it-IT") : "Mai"}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: c.attivo && !scaduto ? S.green + "22" : S.red + "22", color: c.attivo && !scaduto ? S.green : S.red }}>
                      {!c.attivo ? "Disattivo" : scaduto ? "Scaduto" : "Attivo"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px", display: "flex", gap: 6 }}>
                    {c.attivo && !scaduto && (
                      <button onClick={() => handleDisattiva(c.id)} disabled={pending === c.id} style={{ padding: "3px 9px", borderRadius: 5, border: "none", background: S.yellow + "22", color: S.yellow, fontSize: 10, cursor: "pointer" }}>
                        {pending === c.id ? "…" : "Disattiva"}
                      </button>
                    )}
                    <button onClick={() => handleElimina(c.id, c.codice)} style={{ padding: "3px 9px", borderRadius: 5, border: "none", background: S.red + "22", color: S.red, fontSize: 10, cursor: "pointer" }}>
                      Elimina
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
