"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleUserPremiumAction } from "./actions";

interface Utente {
  id: string;
  email: string;
  nome: string | null;
  isPremium: boolean;
  createdAt: Date;
  _count: { events: number; predictions?: number };
  events: { isPremium: boolean; _count: { predictions: number } }[];
}

interface UsersTableProps {
  utenti: Utente[];
}

const S = {
  surface: "#0f172a",
  border:  "#1e293b",
  text:    "#f1f5f9",
  muted:   "#64748b",
  green:   "#22c55e",
  yellow:  "#eab308",
  red:     "#ef4444",
  purple:  "#a78bfa",
};

export function UsersTable({ utenti }: UsersTableProps) {
  const [query, setQuery]         = useState("");
  const [filter, setFilter]       = useState<"all" | "free" | "premium">("all");
  const [lista, setLista]         = useState(utenti);
  const [pending, setPending]     = useState<string | null>(null);
  const [msg, setMsg]             = useState<Record<string, string>>({});
  const [, startTransition]       = useTransition();

  const filtered = lista.filter((u) => {
    const q = query.toLowerCase();
    const matchSearch =
      !q ||
      u.email.toLowerCase().includes(q) ||
      (u.nome ?? "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "premium" && u.isPremium) ||
      (filter === "free" && !u.isPremium);
    return matchSearch && matchFilter;
  });

  function togglePremium(userId: string, current: boolean) {
    setPending(userId);
    setLista((l) => l.map((u) => u.id === userId ? { ...u, isPremium: !current } : u));
    startTransition(async () => {
      const res = await toggleUserPremiumAction(userId, !current);
      if (!res.success) {
        setLista((l) => l.map((u) => u.id === userId ? { ...u, isPremium: current } : u));
        setMsg((m) => ({ ...m, [userId]: res.error ?? "Errore" }));
        setTimeout(() => setMsg((m) => { const n = { ...m }; delete n[userId]; return n; }), 3000);
      }
      setPending(null);
    });
  }

  const fmt = (d: Date) => new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "2-digit" });

  return (
    <div>
      {/* Filtri */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Cerca per email o nome…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "8px 14px", borderRadius: 8,
            border: `1px solid ${S.border}`, background: "#020617",
            color: S.text, fontSize: 13, outline: "none",
          }}
        />
        {(["all", "free", "premium"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${S.border}`,
              background: filter === f ? "#1e293b" : "transparent",
              color: filter === f ? S.text : S.muted,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {f === "all" ? "Tutti" : f === "premium" ? "⭐ Premium" : "🆓 Free"}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: S.muted, marginBottom: 12 }}>
        {filtered.length} utenti
      </p>

      {/* Tabella */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.border}`, color: S.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <th style={{ padding: "8px 12px", textAlign: "left" }}>Utente</th>
              <th style={{ padding: "8px 12px", textAlign: "left" }}>Iscritto</th>
              <th style={{ padding: "8px 12px", textAlign: "center" }}>Piano</th>
              <th style={{ padding: "8px 12px", textAlign: "center" }}>Eventi</th>
              <th style={{ padding: "8px 12px", textAlign: "center" }}>Voti</th>
              <th style={{ padding: "8px 12px", textAlign: "center" }}>Premium</th>
              <th style={{ padding: "8px 12px", textAlign: "center" }}>Support</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const totVoti = u.events.reduce((s, e) => s + e._count.predictions, 0);
              const isPremium = u.isPremium;
              return (
                <tr key={u.id} style={{ borderBottom: `1px solid ${S.border}22` }}>
                  <td style={{ padding: "10px 12px" }}>
                    <p style={{ margin: 0, fontWeight: 600, color: S.text }}>{u.nome ?? "—"}</p>
                    <p style={{ margin: "2px 0 0", color: S.muted, fontSize: 11 }}>{u.email}</p>
                    {msg[u.id] && <p style={{ margin: "2px 0 0", color: S.red, fontSize: 11 }}>{msg[u.id]}</p>}
                  </td>
                  <td style={{ padding: "10px 12px", color: S.muted }}>{fmt(u.createdAt)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: isPremium ? "#a78bfa22" : "#1e293b",
                      color: isPremium ? S.purple : S.muted,
                      border: `1px solid ${isPremium ? S.purple + "44" : S.border}`,
                    }}>
                      {isPremium ? "⭐ Premium" : "Free"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: S.muted }}>{u._count.events}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: S.muted }}>{totVoti}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <button
                      onClick={() => togglePremium(u.id, isPremium)}
                      disabled={pending === u.id}
                      style={{
                        padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                        fontSize: 11, fontWeight: 700,
                        background: isPremium ? "#ef444422" : "#a78bfa22",
                        color: isPremium ? S.red : S.purple,
                        opacity: pending === u.id ? 0.5 : 1,
                        transition: "opacity 150ms",
                      }}
                    >
                      {pending === u.id ? "…" : isPremium ? "Revoca" : "⭐ Upgrade"}
                    </button>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <Link
                      href={`/regia-segreta-9832/impersona/${u.id}`}
                      style={{
                        padding: "5px 12px", borderRadius: 6,
                        background: "#0284c722", color: "#38bdf8",
                        fontSize: 11, fontWeight: 700, textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      👁 Impersona
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: S.muted }}>
                  Nessun utente trovato
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
