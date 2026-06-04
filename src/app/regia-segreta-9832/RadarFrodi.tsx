"use client";

import { useState, useTransition } from "react";
import { clearFlagSospettoAction, deletePredictionAdminAction, banIpFromPredictionAction } from "./actions";

interface FrodeRow {
  id: string;
  nomeInvitato: string;
  emailInvitato: string | null;
  ipAddress: string | null;
  vpnFlag: boolean;
  flagSospetto: boolean;
  motivazioneSospetto: string | null;
  createdAt: Date;
  event: { nomeBimbo: string | null; codiceCondivisione: string };
}

const S = { border: "#1e293b", text: "#f1f5f9", muted: "#64748b", red: "#ef4444", green: "#22c55e", yellow: "#eab308", orange: "#f97316", blue: "#38bdf8" };

export function RadarFrodi({ initialRows, kpi }: {
  initialRows: FrodeRow[];
  kpi: { totale: number; vpn: number; ipRapido: number };
}) {
  const [rows, setRows]       = useState(initialRows);
  const [pending, setPending] = useState<string | null>(null);
  const [msg, setMsg]         = useState<string | null>(null);
  const [, startTransition]   = useTransition();

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 4000); }

  function handleClearFlag(id: string) {
    setPending(id);
    setRows((l) => l.map((r) => r.id === id ? { ...r, flagSospetto: false, motivazioneSospetto: null } : r));
    startTransition(async () => {
      const res = await clearFlagSospettoAction(id);
      if (!res.success) { flash(`✗ ${res.error}`); }
      else { flash("✓ Flag rimosso"); setRows((l) => l.filter((r) => r.id !== id)); }
      setPending(null);
    });
  }

  function handleDelete(id: string, nome: string) {
    if (!confirm(`Eliminare il voto di "${nome}"?`)) return;
    setPending(id);
    setRows((l) => l.filter((r) => r.id !== id));
    startTransition(async () => {
      const res = await deletePredictionAdminAction(id);
      if (!res.success) flash(`✗ ${res.error}`);
      else flash("✓ Voto eliminato");
      setPending(null);
    });
  }

  function handleBanIp(id: string, ip: string | null) {
    if (!ip) { flash("✗ IP non disponibile"); return; }
    if (!confirm(`Bannare l'IP ${ip} per 24h?`)) return;
    setPending(id);
    startTransition(async () => {
      const res = await banIpFromPredictionAction(id, 24);
      if (!res.success) flash(`✗ ${res.error}`);
      else flash(`✓ IP ${ip} bannato per 24h`);
      setPending(null);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Mini KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <MiniKpi label="Sospetti Totali" value={kpi.totale}    color={S.orange} />
        <MiniKpi label="VPN Rilevati"    value={kpi.vpn}       color={S.red} />
        <MiniKpi label="IP Rapidi"       value={kpi.ipRapido}  color={S.yellow} />
      </div>

      {msg && (
        <p style={{ fontSize: 12, color: msg.startsWith("✓") ? S.green : S.red, margin: 0 }}>{msg}</p>
      )}

      {/* Tabella */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.border}`, color: S.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {["Votante", "Evento", "IP", "Flag", "Data", "Azioni"].map((h) => (
                <th key={h} style={{ padding: "7px 10px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "24px 10px", textAlign: "center", color: S.muted }}>
                  ✅ Nessun voto sospetto rilevato
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${S.border}22` }}>
                <td style={{ padding: "8px 10px" }}>
                  <span style={{ color: S.text, fontWeight: 600 }}>{r.nomeInvitato}</span>
                  {r.emailInvitato && (
                    <span style={{ display: "block", fontSize: 10, color: S.muted }}>{r.emailInvitato}</span>
                  )}
                </td>
                <td style={{ padding: "8px 10px", color: S.muted }}>
                  {r.event.nomeBimbo ?? "Fagiolino"}
                  <span style={{ display: "block", fontFamily: "monospace", fontSize: 10 }}>{r.event.codiceCondivisione}</span>
                </td>
                <td style={{ padding: "8px 10px" }}>
                  {r.ipAddress ? (
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: S.blue }}>{r.ipAddress}</span>
                  ) : (
                    <span style={{ color: S.muted }}>—</span>
                  )}
                </td>
                <td style={{ padding: "8px 10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {r.vpnFlag && (
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: S.red + "22", color: S.red, width: "fit-content" }}>
                        🛡️ VPN
                      </span>
                    )}
                    {r.motivazioneSospetto && !r.vpnFlag && (
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: S.orange + "22", color: S.orange, width: "fit-content" }}>
                        ⚡ {r.motivazioneSospetto}
                      </span>
                    )}
                    {r.motivazioneSospetto?.startsWith("VPN:") && (
                      <span style={{ fontSize: 9, color: S.muted }}>{r.motivazioneSospetto.replace("VPN:", "tipo: ")}</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "8px 10px", color: S.muted, fontSize: 11 }}>
                  {new Date(r.createdAt).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td style={{ padding: "8px 10px" }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleClearFlag(r.id)}
                      disabled={pending === r.id}
                      title="Rimuovi flag — voto legittimo"
                      style={{ padding: "3px 9px", borderRadius: 5, border: "none", background: S.green + "22", color: S.green, fontSize: 10, cursor: "pointer" }}
                    >
                      {pending === r.id ? "…" : "✓ Legittimo"}
                    </button>
                    <button
                      onClick={() => handleBanIp(r.id, r.ipAddress)}
                      disabled={pending === r.id || !r.ipAddress}
                      title="Banna IP per 24h"
                      style={{ padding: "3px 9px", borderRadius: 5, border: "none", background: S.orange + "22", color: S.orange, fontSize: 10, cursor: r.ipAddress ? "pointer" : "not-allowed" }}
                    >
                      🚫 Ban IP
                    </button>
                    <button
                      onClick={() => handleDelete(r.id, r.nomeInvitato)}
                      disabled={pending === r.id}
                      title="Elimina voto"
                      style={{ padding: "3px 9px", borderRadius: 5, border: "none", background: S.red + "22", color: S.red, fontSize: 10, cursor: "pointer" }}
                    >
                      Elimina
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
