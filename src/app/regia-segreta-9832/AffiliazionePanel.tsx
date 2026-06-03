"use client";

import { useState, useTransition } from "react";
import { creaLinkAffiliazioneAction, toggleLinkAffiliazioneAction, eliminaLinkAffiliazioneAction, aggiornaCommissioniAction } from "./p2-actions";

interface LinkRow {
  id: string; nome: string; partner: string; url: string;
  tagTracciamento: string; click: number; categoria: string | null;
  commissioni: number | null; attivo: boolean; note: string | null;
}

const S = { border: "#1e293b", text: "#f1f5f9", muted: "#64748b", red: "#ef4444", green: "#22c55e", blue: "#38bdf8", yellow: "#eab308", amber: "#f59e0b" };

const PARTNER_META: Record<string, { label: string; color: string; icon: string }> = {
  AMAZON:      { label: "Amazon",      color: "#f97316", icon: "🛒" },
  NIDODIGRAZIA: { label: "Nidodigrazia", color: "#a78bfa", icon: "🏡" },
  ALTRO:       { label: "Altro",        color: "#64748b", icon: "🔗" },
};

export function AffiliazionePanel({ initialLinks }: { initialLinks: LinkRow[] }) {
  const [links, setLinks]           = useState(initialLinks);
  const [form, setForm]             = useState({ nome: "", partner: "AMAZON", url: "", tagTracciamento: "", categoria: "", commissioni: "", note: "" });
  const [msg, setMsg]               = useState<string | null>(null);
  const [pending, setPending]       = useState<string | null>(null);
  const [editComm, setEditComm]     = useState<{ id: string; val: string } | null>(null);
  const [, startTransition]         = useTransition();

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 4000); }

  function handleCrea() {
    if (!form.nome.trim() || !form.url.trim() || !form.tagTracciamento.trim()) {
      flash("✗ Nome, URL e tag tracciamento obbligatori"); return;
    }
    startTransition(async () => {
      const res = await creaLinkAffiliazioneAction({
        nome:            form.nome.trim(),
        partner:         form.partner as "AMAZON" | "NIDODIGRAZIA" | "ALTRO",
        url:             form.url.trim(),
        tagTracciamento: form.tagTracciamento.trim(),
        categoria:       form.categoria || undefined,
        commissioni:     form.commissioni ? parseFloat(form.commissioni) : undefined,
        note:            form.note || undefined,
      });
      if (res.success) {
        setLinks((prev) => [{
          id: crypto.randomUUID(), nome: form.nome.trim(), partner: form.partner,
          url: form.url.trim(), tagTracciamento: form.tagTracciamento.trim(),
          click: 0, categoria: form.categoria || null,
          commissioni: form.commissioni ? parseFloat(form.commissioni) : null,
          attivo: true, note: form.note || null,
        }, ...prev]);
        setForm({ nome: "", partner: "AMAZON", url: "", tagTracciamento: "", categoria: "", commissioni: "", note: "" });
        flash("✓ Link aggiunto!");
      } else {
        flash(`✗ ${res.error}`);
      }
    });
  }

  function handleToggle(id: string, attivo: boolean) {
    setPending(id);
    setLinks((l) => l.map((x) => x.id === id ? { ...x, attivo: !attivo } : x));
    startTransition(async () => {
      const res = await toggleLinkAffiliazioneAction(id, !attivo);
      if (!res.success) { setLinks((l) => l.map((x) => x.id === id ? { ...x, attivo } : x)); flash(`✗ ${res.error}`); }
      setPending(null);
    });
  }

  function handleElimina(id: string, nome: string) {
    if (!confirm(`Eliminare il link "${nome}"?`)) return;
    setLinks((l) => l.filter((x) => x.id !== id));
    startTransition(async () => {
      const res = await eliminaLinkAffiliazioneAction(id);
      if (!res.success) flash(`✗ ${res.error}`);
    });
  }

  function handleSaveComm(id: string) {
    if (!editComm) return;
    const val = parseFloat(editComm.val);
    if (isNaN(val) || val < 0) { flash("✗ Valore non valido"); return; }
    setLinks((l) => l.map((x) => x.id === id ? { ...x, commissioni: val } : x));
    setEditComm(null);
    startTransition(async () => {
      const res = await aggiornaCommissioniAction(id, val);
      if (!res.success) flash(`✗ ${res.error}`);
    });
  }

  const inp = (style?: React.CSSProperties): React.CSSProperties => ({
    padding: "7px 10px", borderRadius: 7, border: `1px solid ${S.border}`,
    background: "#020617", color: S.text, fontSize: 12, outline: "none", ...style,
  });

  const totaleCommissioni = links.reduce((s, l) => s + (l.commissioni ?? 0), 0);
  const totaleClick       = links.reduce((s, l) => s + l.click, 0);
  const linkAttivi        = links.filter((l) => l.attivo).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Mini KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <MiniKpi label="Link Attivi"          value={linkAttivi}                                         color={S.green} />
        <MiniKpi label="Click Totali"         value={totaleClick.toLocaleString("it-IT")}               color={S.blue} />
        <MiniKpi label="Commissioni Stimate"  value={`€ ${totaleCommissioni.toFixed(2)}`}               color={S.amber} />
      </div>

      {/* Form aggiunta */}
      <div style={{ background: "#020617", border: `1px solid ${S.border}`, borderRadius: 10, padding: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: S.muted, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          🔗 Aggiungi link affiliazione
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <select value={form.partner} onChange={(e) => setForm((f) => ({ ...f, partner: e.target.value }))} style={inp({ minWidth: 140 })}>
            <option value="AMAZON">🛒 Amazon</option>
            <option value="NIDODIGRAZIA">🏡 Nidodigrazia</option>
            <option value="ALTRO">🔗 Altro</option>
          </select>
          <input placeholder="Nome prodotto" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} style={inp({ flex: "1 1 180px" })} />
          <input placeholder="Tag tracciamento (es. fantaparto-21)" value={form.tagTracciamento} onChange={(e) => setForm((f) => ({ ...f, tagTracciamento: e.target.value }))} style={inp({ width: 160, fontFamily: "monospace" })} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
          <input placeholder="URL con tag affiliazione" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} style={inp({ flex: "1 1 280px" })} />
          <input placeholder="Categoria" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} style={inp({ width: 110 })} />
          <input type="number" placeholder="Commissioni € " value={form.commissioni} onChange={(e) => setForm((f) => ({ ...f, commissioni: e.target.value }))} style={inp({ width: 100 })} min={0} step={0.01} />
          <input placeholder="Note" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} style={inp({ flex: "1 1 120px" })} />
          <button
            onClick={handleCrea}
            style={{ padding: "7px 18px", borderRadius: 7, border: "none", background: S.amber + "22", color: S.amber, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Aggiungi ✨
          </button>
        </div>
        {msg && <p style={{ fontSize: 12, marginTop: 8, color: msg.startsWith("✓") ? S.green : S.red }}>{msg}</p>}
      </div>

      {/* Tabella link */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.border}`, color: S.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {["Partner", "Prodotto", "Tag", "Cat.", "Click", "Commissioni €", "Stato", "Azioni"].map((h) => (
                <th key={h} style={{ padding: "7px 10px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {links.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: S.muted }}>Nessun link ancora</td></tr>
            )}
            {links.map((l) => {
              const pm = PARTNER_META[l.partner] ?? PARTNER_META.ALTRO;
              return (
                <tr key={l.id} style={{ borderBottom: `1px solid ${S.border}22`, opacity: l.attivo ? 1 : 0.45 }}>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: pm.color + "22", color: pm.color, fontWeight: 700 }}>
                      {pm.icon} {pm.label}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ color: S.text, fontWeight: 600, textDecoration: "none" }} title={l.url}>
                      {l.nome.length > 38 ? l.nome.slice(0, 38) + "…" : l.nome}
                    </a>
                    {l.note && <span style={{ display: "block", fontSize: 10, color: S.muted }}>{l.note}</span>}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: S.blue, background: "#38bdf811", padding: "2px 6px", borderRadius: 4 }}>
                      {l.tagTracciamento}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px", color: S.muted }}>{l.categoria ?? "—"}</td>
                  <td style={{ padding: "8px 10px", color: S.blue, fontWeight: 700 }}>{l.click.toLocaleString("it-IT")}</td>
                  <td style={{ padding: "8px 10px" }}>
                    {editComm?.id === l.id ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <input
                          type="number"
                          value={editComm.val}
                          onChange={(e) => setEditComm({ id: l.id, val: e.target.value })}
                          style={{ ...inp(), width: 70 }}
                          min={0} step={0.01} autoFocus
                        />
                        <button onClick={() => handleSaveComm(l.id)} style={{ padding: "2px 7px", borderRadius: 4, border: "none", background: S.green + "22", color: S.green, fontSize: 10, cursor: "pointer" }}>✓</button>
                        <button onClick={() => setEditComm(null)} style={{ padding: "2px 7px", borderRadius: 4, border: "none", background: S.red + "22", color: S.red, fontSize: 10, cursor: "pointer" }}>✗</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditComm({ id: l.id, val: l.commissioni?.toString() ?? "0" })}
                        style={{ background: "none", border: "none", cursor: "pointer", color: l.commissioni ? S.amber : S.muted, fontWeight: l.commissioni ? 700 : 400, fontSize: 12, padding: 0 }}
                        title="Clicca per modificare"
                      >
                        {l.commissioni != null ? `€ ${l.commissioni.toFixed(2)}` : "—"}
                      </button>
                    )}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: l.attivo ? S.green + "22" : S.muted + "22", color: l.attivo ? S.green : S.muted }}>
                      {l.attivo ? "Attivo" : "Inattivo"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button
                        onClick={() => handleToggle(l.id, l.attivo)}
                        disabled={pending === l.id}
                        style={{ padding: "3px 9px", borderRadius: 5, border: "none", background: l.attivo ? S.yellow + "22" : S.green + "22", color: l.attivo ? S.yellow : S.green, fontSize: 10, cursor: "pointer" }}
                      >
                        {pending === l.id ? "…" : l.attivo ? "Pausa" : "Attiva"}
                      </button>
                      <button
                        onClick={() => handleElimina(l.id, l.nome)}
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
