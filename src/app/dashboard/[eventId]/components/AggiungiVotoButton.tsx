"use client";

import { useState } from "react";
import AggiungiVotoModal from "./AggiungiVotoModal";

interface Props {
  eventId:         string;
  dppIso:          string;
  sessoAttivo:     boolean;
  dataAttiva:      boolean;
  pesoAttivo:      boolean;
  lunghezzaAttiva: boolean;
  oraAttiva:       boolean;
  capelliAttivo:   boolean;
  occhiAttivo:     boolean;
  isPremium:       boolean;
}

export default function AggiungiVotoButton(props: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, fontWeight: 700, color: "#874e58",
          background: "#fde8e6", border: "1.5px solid #f4acb7",
          borderRadius: 10, padding: "7px 14px", cursor: "pointer",
          fontFamily: "var(--font-vietnam, sans-serif)",
          flexShrink: 0,
        }}
      >
        ✏️ Aggiungi manuale
      </button>
      {open && <AggiungiVotoModal {...props} onClose={() => setOpen(false)} />}
    </>
  );
}
