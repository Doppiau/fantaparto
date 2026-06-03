"use client";

import { useState } from "react";

interface LogEntry {
  id: string;
  adminId: string;
  azione: string;
  dettagli: string;
  timestamp: Date;
}

const AZIONE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  UPGRADE_PREMIUM:     { color: "#a78bfa", bg: "#a78bfa22", label: "⭐ Upgrade" },
  REVOCA_PREMIUM:      { color: "#f87171", bg: "#f8717122", label: "⬇ Revoca" },
  GIFT_PREMIUM_EVENTO: { color: "#34d399", bg: "#34d39922", label: "🎁 Gift" },
  CHIUDI_EVENTO:       { color: "#fbbf24", bg: "#fbbf2422", label: "🔒 Chiude" },
  ELIMINA_EVENTO:      { color: "#ef4444", bg: "#ef444422", label: "🗑 Elimina" },
};

const S = { border: "#1e293b", muted: "#64748b", text: "#f1f5f9" };

export function AuditLogSection({ logs }: { logs: LogEntry[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const fmt = (d: Date) =>
    new Date(d).toLocaleString("it-IT", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ maxHeight: 420, overflowY: "auto" }}>
      {logs.length === 0 && (
        <p style={{ color: S.muted, fontSize: 13, padding: "16px 0" }}>Nessuna operazione registrata.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {logs.map((log) => {
          const style = AZIONE_STYLE[log.azione] ?? { color: S.muted, bg: "#1e293b", label: log.azione };
          const isOpen = expanded === log.id;
          return (
            <div
              key={log.id}
              onClick={() => setExpanded(isOpen ? null : log.id)}
              style={{
                background: "#020617", border: `1px solid ${S.border}`,
                borderRadius: 8, padding: "10px 14px", cursor: "pointer",
                transition: "border-color 150ms",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700,
                  background: style.bg, color: style.color, flexShrink: 0,
                }}>
                  {style.label}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: S.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.dettagli}
                </span>
                <span style={{ fontSize: 11, color: S.muted, flexShrink: 0 }}>{fmt(log.timestamp)}</span>
              </div>
              {isOpen && (
                <div style={{ marginTop: 8, fontSize: 11, color: S.muted, borderTop: `1px solid ${S.border}`, paddingTop: 8 }}>
                  <p style={{ margin: 0 }}><strong>Admin:</strong> {log.adminId}</p>
                  <p style={{ margin: "4px 0 0" }}><strong>Dettagli:</strong> {log.dettagli}</p>
                  <p style={{ margin: "4px 0 0" }}><strong>ID:</strong> {log.id}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
