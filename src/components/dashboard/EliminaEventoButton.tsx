"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eliminaEventoAction } from "@/app/dashboard/[eventId]/actions";

interface Props {
  eventId: string;
  nomeEvento: string;
}

export default function EliminaEventoButton({ eventId, nomeEvento }: Props) {
  const [open, setOpen]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function conferma() {
    setError(null);
    startTransition(async () => {
      const res = await eliminaEventoAction(eventId);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      {/* Bottone trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Elimina evento"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, fontWeight: 600, color: "#b91c1c",
          border: "1px solid #fecaca", borderRadius: 10,
          padding: "6px 14px", background: "#fff", cursor: "pointer",
          transition: "all 150ms",
        }}
      >
        <span style={{ fontSize: 15 }}>🗑️</span>
        Elimina
      </button>

      {/* Modale di conferma */}
      {open && (
        <div
          onClick={() => !pending && setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
            background: "rgba(15,10,5,0.45)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 24,
              padding: "36px 32px", maxWidth: 420, width: "100%",
              boxShadow: "0 24px 64px -16px rgba(0,0,0,0.30)",
              display: "flex", flexDirection: "column", gap: 20,
            }}
          >
            {/* Icona */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "#fef2f2", border: "2px solid #fecaca",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26,
              }}>
                🗑️
              </div>
            </div>

            {/* Testo */}
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", margin: "0 0 10px", fontFamily: "var(--font-fredoka, sans-serif)" }}>
                Eliminare &ldquo;{nomeEvento}&rdquo;?
              </h3>
              <p style={{ fontSize: 14, color: "#5a4e50", lineHeight: 1.6, margin: 0 }}>
                Questa azione è <strong>irreversibile</strong>. Verranno eliminati l&apos;evento e tutti i pronostici ricevuti dagli invitati.
              </p>
            </div>

            {/* Errore */}
            {error && (
              <p style={{ fontSize: 13, color: "#b91c1c", background: "#fef2f2", borderRadius: 10, padding: "10px 14px", margin: 0, textAlign: "center" }}>
                ⚠️ {error}
              </p>
            )}

            {/* Azioni */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                style={{
                  flex: 1, fontSize: 14, fontWeight: 600, color: "#5a4e50",
                  border: "2px solid #f0e8e6", background: "#fff",
                  borderRadius: 14, padding: "12px", cursor: "pointer",
                }}
              >
                Annulla
              </button>
              <button
                onClick={conferma}
                disabled={pending}
                style={{
                  flex: 1, fontSize: 14, fontWeight: 700, color: "#fff",
                  border: "none", background: pending ? "#fca5a5" : "#b91c1c",
                  borderRadius: 14, padding: "12px", cursor: pending ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(185,28,28,0.30)",
                  transition: "background 200ms",
                }}
              >
                {pending ? "Eliminazione…" : "Sì, elimina"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
