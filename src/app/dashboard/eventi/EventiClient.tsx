"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiviaEventoAction, duplicaEventoAction } from "../profilo/actions";

const VN = "var(--font-vietnam, sans-serif)";

interface Props {
  eventId:    string;
  archiviato: boolean;
}

export function EventoActions({ eventId, archiviato }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [msg, setMsg]       = useState("");
  const [busy, setBusy]     = useState(false);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  }

  function handleArchivia(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setBusy(true);
    startTransition(async () => {
      const res = await archiviaEventoAction(eventId, !archiviato);
      setBusy(false);
      if (!res.success) flash(`✗ ${res.error}`);
      else router.refresh();
    });
  }

  function handleDuplica(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setBusy(true);
    startTransition(async () => {
      const res = await duplicaEventoAction(eventId);
      setBusy(false);
      if (!res.success) flash(`✗ ${res.error}`);
      else router.push(`/dashboard/${res.nuovoId}`);
    });
  }

  return (
    <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      {msg && <span style={{ fontSize: 11, color: msg.startsWith("✗") ? "#b91c1c" : "#166534", fontFamily: VN }}>{msg}</span>}
      <button
        type="button"
        onClick={handleDuplica}
        disabled={busy}
        title="Duplica evento"
        style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #F1ECE4", background: "#fff", fontSize: 11, fontWeight: 700, color: "#40627b", cursor: busy ? "not-allowed" : "pointer", fontFamily: VN, opacity: busy ? 0.5 : 1 }}
      >
        📋 Duplica
      </button>
      <button
        type="button"
        onClick={handleArchivia}
        disabled={busy}
        title={archiviato ? "Ripristina evento" : "Archivia evento"}
        style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #F1ECE4", background: "#fff", fontSize: 11, fontWeight: 700, color: archiviato ? "#166534" : "#847375", cursor: busy ? "not-allowed" : "pointer", fontFamily: VN, opacity: busy ? 0.5 : 1 }}
      >
        {archiviato ? "↩️ Ripristina" : "📦 Archivia"}
      </button>
    </div>
  );
}
