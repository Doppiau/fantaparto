"use client";

import { useState, useTransition } from "react";
import { eliminaPredictionAction } from "@/app/dashboard/[eventId]/actions";

interface Props {
  predictionId: string;
  eventId:      string;
  nomeInvitato?: string;
}

export default function ModerateButton({ predictionId, eventId, nomeInvitato }: Props) {
  const [open, setOpen]               = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [pending, startTransition]    = useTransition();

  function conferma() {
    setError(null);
    startTransition(async () => {
      try {
        await eliminaPredictionAction(eventId, predictionId);
        setOpen(false);
      } catch {
        setError("Errore durante l'eliminazione. Riprova.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors hover:bg-[#fde8e6] hover:border-[#b5352c] hover:text-[#b5352c]"
        style={{ border: "1px solid #f0e8e6", color: "#a89a9b", fontFamily: "var(--font-vietnam, sans-serif)" }}
      >
        Modera
      </button>

      {open && (
        <div
          onClick={() => !pending && setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(15,10,5,0.45)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 20, padding: "32px 28px", maxWidth: 380, width: "100%", boxShadow: "0 24px 64px -16px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", border: "2px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 14px" }}>
                🗑️
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px", fontFamily: "var(--font-fredoka, sans-serif)" }}>
                Eliminare il pronostico{nomeInvitato ? ` di ${nomeInvitato}` : ""}?
              </h3>
              <p style={{ fontSize: 13, color: "#5a4e50", lineHeight: 1.6, margin: 0 }}>
                Il partecipante potrà <strong>votare di nuovo</strong> usando il link condiviso.
              </p>
            </div>
            {error && (
              <p style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", borderRadius: 8, padding: "8px 12px", margin: 0, textAlign: "center" }}>⚠️ {error}</p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#5a4e50", border: "2px solid #f0e8e6", background: "#fff", borderRadius: 12, padding: "10px", cursor: "pointer" }}
              >
                Annulla
              </button>
              <button
                onClick={conferma}
                disabled={pending}
                style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", border: "none", background: pending ? "#fca5a5" : "#b91c1c", borderRadius: 12, padding: "10px", cursor: pending ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(185,28,28,0.25)" }}
              >
                {pending ? "Eliminazione…" : "Elimina voto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
