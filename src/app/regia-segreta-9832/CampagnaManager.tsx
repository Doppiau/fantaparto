"use client";

import { useState, useTransition } from "react";
import { creaCampagnaAction, toggleCampagnaAction, eliminaCampagnaAction } from "./p2-actions";

interface CampagnaRow {
  id: string; nome: string; codiceRif: string;
  click: number; conversioni: number; attiva: boolean; note: string | null;
  createdAt: Date;
}

const S = { border: "#1e293b", text: "#f1f5f9", muted: "#64748b", red: "#ef4444", green: "#22c55e", blue: "#38bdf8", yellow: "#eab308", orange: "#f97316" };

export function CampagnaManager({ initialCampagne, baseUrl }: { initialCampagne: CampagnaRow[]; baseUrl: string }) {
  const [campagne, setCampagne]   = useState(initialCampagne);
  const [form, setForm]           = useState({ nome: "", codiceRif: "", note: "" });
  const [msg, setMsg]             = useState<string | null>(null);
  const [pending, setPending]     = useState<string | null>(null);
  const [, startTransition]       = useTransition();

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 4000); }

  function handleCrea() {
    if (!form.nome.trim() || !form.codiceRif.trim()) { flash("✗ Nome e codice riferimento obbligatori"); return; }
    startTransition(async () => {
      const res = await creaCampagnaAction({
        nome: form.nome.trim(),
        codiceRif: form.codiceRif.trim().toUpperCase(),
        note: form.note || undefined,
      });
      if (res.success) {
        setCampagne((prev) => [{
          id: crypto.randomUUID(), nome: form.nome.trim(),
          codiceRif: form.codiceRif.trim().toUpperCase(),
          click: 0, conversioni: 0, attiva: true, note: form.note || null, createdAt: new Date(),
        }, ...prev]);
        setForm({ nome: "", codiceRif: "", note: "" });
        flash("✓ Campagna creata!");
      } else {
        flash(`✗ ${res.error}`);
      }
    });
  }

  function handleToggle(id: string, attiva: boolean) {
    setPending(id);
    setCampagne((l) => l.map((c) => c.id === id ? { ...c, attiva: !attiva } : c));
    startTransition(async () => {
      const res = await toggleCampagnaAction(id, !attiva);
      if (!res.success) { setCampagne((l) => l.map((c) => c.id === id ? { ...c, attiva } : c)); flash(`✗ ${res.error}`); }
      setPending(null);
    });
  }

  function handleElimina(id: string, nome: string) {
    if (!confirm(`Eliminare la campagna "${nome}"?`)) return;
    setCampagne((l) => l.filter((c) => c.id !== id));
    startTransition(async () => {
      const res = await eliminaCampagnaAction(id);
      if (!res.success) flash(`✗ ${res.error}`);
    });
  }

  const inp = (style?: React.CSSProperties): React.CSSProperties => ({
    padding: "7px 10px", borderRadius: 7, border: `1px solid ${S.border}`,
    background: "#020617", color: S.text, fontSize: 12, outline: "none", ...style,
  });

  const totalClick      = campagne.reduce((s, c) => s + c.click, 0);
  const totalConversioni = campagne.reduce((s, c) => s + c.conversioni, 0);
  const globalCvr       = totalClick > 0 ? ((totalConversioni / totalClick) * 100).toFixed(1) : "0.0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Mini KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <MiniKpi label="Campagne Attive" value={campagne.filter((c) => c.attiva).length} color={S.green} />
        <MiniKpi label="Click Totali"    value={totalClick}                               color={S.blue} />
        <MiniKpi label="Conversioni"     value={totalConversioni}                         color={S.orange} />
        <MiniKpi label="CVR Globale"     value={`${globalCvr}%`}                         color="#34d399" />
      </div>

      {/* Form creazione */}
      <div style={{ background: "#020617", border: `1px solid ${S.border}`, borderRadius: 10, padding: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: S.muted, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          📣 Nuova campagna influencer
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
          <input
            placeholder="Nome creator (es. Chiara Ferragni)"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            style={inp({ flex: "1 1 180px" })}
          />
          <input
            placeholder="Codice ref (es. CHIARA25)"
            value={form.codiceRif}
            onChange={(e) => setForm((f) => ({ ...f, codiceRif: e.target.value.toUpperCase() }))}
            style={inp({ width: 140, fontFamily: "monospace" })}
          />
          <input
            placeholder="Note"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            style={inp({ flex: "1 1 140px" })}
          />
          <button
            onClick={handleCrea}
            style={{ padding: "7px 18px", borderRadius: 7, border: "none", background: "#38bdf822", color: S.blue, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Crea 🚀
          </button>
        </div>
        {msg && <p style={{ fontSize: 12, marginTop: 8, color: msg.startsWith("✓") ? S.green : S.red }}>{msg}</p>}
      </div>

      {/* Tabella campagne */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.border}`, color: S.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {["Creator / Campagna", "Link Tracciato", "Click", "Conv.", "CVR", "Stato", "Azioni"].map((h) => (
                <th key={h} style={{ padding: "7px 10px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campagne.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 20, textAlign: "center", color: S.muted }}>Nessuna campagna ancora</td></tr>
            )}
            {campagne.map((c) => {
              const cvr = c.click > 0 ? ((c.conversioni / c.click) * 100).toFixed(1) : "—";
              const refUrl = `${baseUrl}?ref=${c.codiceRif}`;
              return (
                <tr key={c.id} style={{ borderBottom: `1px solid ${S.border}22`, opacity: c.attiva ? 1 : 0.45 }}>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ color: S.text, fontWeight: 600 }}>{c.nome}</span>
                    {c.note && <span style={{ display: "block", fontSize: 10, color: S.muted }}>{c.note}</span>}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: S.blue, background: "#38bdf811", padding: "2px 6px", borderRadius: 4 }}>
                        ?ref={c.codiceRif}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(refUrl)}
                        title="Copia link completo"
                        style={{ padding: "2px 6px", borderRadius: 4, border: "none", background: "#38bdf811", color: S.blue, fontSize: 10, cursor: "pointer" }}
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: "8px 10px", color: S.blue, fontWeight: 700 }}>{c.click.toLocaleString("it-IT")}</td>
                  <td style={{ padding: "8px 10px", color: S.orange, fontWeight: 700 }}>{c.conversioni.toLocaleString("it-IT")}</td>
                  <td style={{ padding: "8px 10px", color: cvr !== "—" ? "#34d399" : S.muted, fontWeight: cvr !== "—" ? 700 : 400 }}>{cvr}{cvr !== "—" ? "%" : ""}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: c.attiva ? S.green + "22" : S.muted + "22", color: c.attiva ? S.green : S.muted }}>
                      {c.attiva ? "Attiva" : "Inattiva"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button
                        onClick={() => handleToggle(c.id, c.attiva)}
                        disabled={pending === c.id}
                        style={{ padding: "3px 9px", borderRadius: 5, border: "none", background: c.attiva ? S.yellow + "22" : S.green + "22", color: c.attiva ? S.yellow : S.green, fontSize: 10, cursor: "pointer" }}
                      >
                        {pending === c.id ? "…" : c.attiva ? "Pausa" : "Attiva"}
                      </button>
                      <button
                        onClick={() => handleElimina(c.id, c.nome)}
                        style={{ padding: "3px 9px", borderRadius: 5, border: "none", background: S.red + "22", color: S.red, fontSize: 10, cursor: "pointer" }}
                      >
                        Elimina
                      </button>
                    </div>
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

function MiniKpi({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: "#020617", border: `1px solid ${color}22`, borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ margin: 0, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ margin: "3px 0 0", fontSize: "1.3rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
    </div>
  );
}
