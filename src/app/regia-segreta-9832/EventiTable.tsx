"use client";

import { useState, useTransition } from "react";
import { closeEventAction, deleteEventAction } from "./actions";

type EventRow = {
  id: string;
  nomeBimbo: string | null;
  codiceCondivisione: string;
  stato: string;
  isPremium: boolean;
  visualizzazioniLink: number;
  createdAt: Date;
  user: { nome: string | null; email: string };
  _count: { predictions: number };
};

export function EventiTable({ eventi }: { eventi: EventRow[] }) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ id: string; msg: string } | null>(null);

  const filtrati = eventi.filter((e) => {
    const q = query.toLowerCase();
    return (
      (e.user.nome ?? "").toLowerCase().includes(q) ||
      e.user.email.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      (e.nomeBimbo ?? "").toLowerCase().includes(q)
    );
  });

  function handleClose(eventId: string) {
    startTransition(async () => {
      const res = await closeEventAction(eventId);
      setFeedback({ id: eventId, msg: res.success ? "Chiuso ✓" : res.error ?? "Errore" });
    });
  }

  function handleDelete(eventId: string) {
    if (!confirm("Eliminare definitivamente l'evento e tutti i voti? Azione irreversibile.")) return;
    startTransition(async () => {
      const res = await deleteEventAction(eventId);
      setFeedback({ id: eventId, msg: res.success ? "Eliminato ✓" : res.error ?? "Errore" });
    });
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <input
        type="search"
        placeholder="Cerca per nome mamma, email o ID evento…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "0.6rem 1rem",
          marginBottom: "1rem",
          fontSize: "0.95rem",
          border: "1px solid #334155",
          borderRadius: "8px",
          background: "#0f172a",
          color: "#f1f5f9",
        }}
      />

      {feedback && (
        <p style={{ color: "#86efac", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
          {feedback.msg}
        </p>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
              <th style={th}>Mamma</th>
              <th style={th}>Bimbo</th>
              <th style={th}>Codice</th>
              <th style={th}>Stato</th>
              <th style={th}>Piano</th>
              <th style={th}>Voti</th>
              <th style={th}>Views</th>
              <th style={th}>Creato</th>
              <th style={th}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtrati.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
                  Nessun evento trovato.
                </td>
              </tr>
            )}
            {filtrati.map((e) => (
              <tr
                key={e.id}
                style={{ borderBottom: "1px solid #1e293b", transition: "background 0.15s" }}
                onMouseEnter={(ev) => ((ev.currentTarget as HTMLElement).style.background = "#1e293b")}
                onMouseLeave={(ev) => ((ev.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <td style={td}>
                  <span style={{ display: "block", fontWeight: 600, color: "#f1f5f9" }}>{e.user.nome ?? "—"}</span>
                  <span style={{ color: "#64748b", fontSize: "0.75rem" }}>{e.user.email}</span>
                </td>
                <td style={td}>{e.nomeBimbo ?? <span style={{ color: "#475569" }}>—</span>}</td>
                <td style={td}>
                  <code style={{ background: "#1e293b", padding: "2px 6px", borderRadius: 4 }}>
                    {e.codiceCondivisione}
                  </code>
                </td>
                <td style={td}>
                  <span style={statoBadgeStyle(e.stato)}>{e.stato}</span>
                </td>
                <td style={td}>
                  <span style={{ color: e.isPremium ? "#fbbf24" : "#64748b" }}>
                    {e.isPremium ? "⭐ Premium" : "Free"}
                  </span>
                </td>
                <td style={{ ...td, textAlign: "center" }}>{e._count.predictions}</td>
                <td style={{ ...td, textAlign: "center" }}>{e.visualizzazioniLink}</td>
                <td style={td}>
                  {new Date(e.createdAt).toLocaleDateString("it-IT", {
                    day: "2-digit", month: "short", year: "2-digit",
                  })}
                </td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {e.stato === "IN_CORSO" && (
                    <button
                      onClick={() => handleClose(e.id)}
                      disabled={isPending}
                      style={btnWarning}
                    >
                      Chiudi
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(e.id)}
                    disabled={isPending}
                    style={{ ...btnDanger, marginLeft: "0.4rem" }}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Stili inline (nessuna dipendenza Tailwind richiesta in questa fase) ────────

function statoBadgeStyle(stato: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    IN_CORSO:           { bg: "#14532d", color: "#86efac" },
    PRONTO_RIVELAZIONE: { bg: "#451a03", color: "#fbbf24" },
    CONCLUSO:           { bg: "#1e293b", color: "#94a3b8" },
  };
  const { bg, color } = map[stato] ?? { bg: "#1e293b", color: "#94a3b8" };
  return {
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: "0.75rem",
    fontWeight: 600,
    background: bg,
    color,
  };
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.6rem 0.75rem",
  fontWeight: 500,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "0.75rem",
  color: "#cbd5e1",
  verticalAlign: "middle",
};

const btnWarning: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #d97706",
  background: "transparent",
  color: "#fbbf24",
  cursor: "pointer",
  fontSize: "0.8rem",
};

const btnDanger: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #dc2626",
  background: "transparent",
  color: "#f87171",
  cursor: "pointer",
  fontSize: "0.8rem",
};
