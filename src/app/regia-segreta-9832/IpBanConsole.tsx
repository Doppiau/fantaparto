"use client";

import { useState, useTransition } from "react";
import { unbanIpAction, banIpManualAction } from "./actions";

interface BannedIp {
  ip: string;
  ttl: number; // -1 = permanente, -2 = key non esiste, >0 = secondi rimasti
}

const S = {
  surface: "#0f172a", border: "#1e293b",
  text: "#f1f5f9", muted: "#64748b",
  red: "#ef4444", green: "#22c55e", yellow: "#eab308",
};

function ttlLabel(ttl: number): string {
  if (ttl === -1) return "♾ Permanente";
  if (ttl <= 0)   return "Scaduto";
  const h = Math.floor(ttl / 3600);
  const m = Math.floor((ttl % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function IpBanConsole({ initialIps }: { initialIps: BannedIp[] }) {
  const [ips, setIps]               = useState(initialIps);
  const [pending, setPending]       = useState<string | null>(null);
  const [msg, setMsg]               = useState<string | null>(null);
  const [newIp, setNewIp]           = useState("");
  const [newTtl, setNewTtl]         = useState("");
  const [, startTransition]         = useTransition();

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  }

  function handleUnban(ip: string) {
    setPending(ip);
    setIps((l) => l.filter((x) => x.ip !== ip));
    startTransition(async () => {
      const res = await unbanIpAction(ip);
      if (!res.success) {
        setIps((l) => [...l, { ip, ttl: -1 }]);
        flash(`✗ ${res.error}`);
      } else {
        flash(`✓ ${ip} rimosso dalla blacklist`);
      }
      setPending(null);
    });
  }

  function handleBan() {
    const ip = newIp.trim();
    if (!ip) return;
    const ttlOre = newTtl ? parseInt(newTtl) : undefined;
    startTransition(async () => {
      const res = await banIpManualAction(ip, ttlOre);
      if (res.success) {
        setIps((l) => [...l, { ip, ttl: ttlOre ? ttlOre * 3600 : -1 }]);
        setNewIp(""); setNewTtl("");
        flash(`✓ ${ip} bannato`);
      } else {
        flash(`✗ ${res.error}`);
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Form ban manuale */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="text" placeholder="IP da bannare (es. 1.2.3.4)"
          value={newIp} onChange={(e) => setNewIp(e.target.value)}
          style={{
            flex: 2, minWidth: 180, padding: "8px 12px", borderRadius: 8,
            border: `1px solid ${S.border}`, background: "#020617",
            color: S.text, fontSize: 13, outline: "none", fontFamily: "monospace",
          }}
        />
        <input
          type="number" placeholder="TTL ore (vuoto = ∞)"
          value={newTtl} onChange={(e) => setNewTtl(e.target.value)}
          min={1} max={8760}
          style={{
            width: 140, padding: "8px 12px", borderRadius: 8,
            border: `1px solid ${S.border}`, background: "#020617",
            color: S.text, fontSize: 13, outline: "none",
          }}
        />
        <button
          onClick={handleBan} disabled={!newIp.trim()}
          style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: "#ef444422", color: S.red,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            opacity: !newIp.trim() ? 0.4 : 1,
          }}
        >
          🚫 Banna IP
        </button>
      </div>

      {msg && (
        <p style={{ fontSize: 12, color: msg.startsWith("✓") ? S.green : S.red, margin: 0 }}>
          {msg}
        </p>
      )}

      {/* Lista IP bannati */}
      {ips.length === 0 ? (
        <p style={{ color: S.muted, fontSize: 13 }}>Nessun IP in blacklist.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>{ips.length} IP bannati</p>
          {ips.map(({ ip, ttl }) => (
            <div key={ip} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "#020617", border: `1px solid ${S.border}`,
              borderRadius: 8, padding: "8px 14px",
            }}>
              <span style={{ flex: 1, fontFamily: "monospace", fontSize: 13, color: S.text }}>{ip}</span>
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 999,
                background: ttl === -1 ? "#ef444418" : "#eab30818",
                color: ttl === -1 ? S.red : S.yellow,
                border: `1px solid ${ttl === -1 ? S.red + "33" : S.yellow + "33"}`,
              }}>
                {ttlLabel(ttl)}
              </span>
              <button
                onClick={() => handleUnban(ip)}
                disabled={pending === ip}
                style={{
                  padding: "4px 12px", borderRadius: 6, border: "none",
                  background: "#22c55e18", color: S.green,
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  opacity: pending === ip ? 0.4 : 1,
                }}
              >
                {pending === ip ? "…" : "✓ Unban"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
