"use client";

import { useState, useTransition } from "react";
import { eliminaPredictionAction } from "../actions";

interface Partecipante {
  id: string;
  nomeInvitato: string;
  emailInvitato: string | null;
  votoSesso: string | null;
  votoPeso: number | null;
  votoData: Date | null;
  messaggioAugurio: string | null;
  createdAt: Date;
}

interface TabGiuriaProps {
  partecipanti: Partecipante[];
  eventId: string;
}

export default function TabGiuria({ partecipanti: iniziali, eventId }: TabGiuriaProps) {
  const [lista, setLista] = useState(iniziali);
  const [removing, setRemoving] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function elimina(id: string) {
    setRemoving(id);
    startTransition(async () => {
      await eliminaPredictionAction(eventId, id);
      setLista((l) => l.filter((p) => p.id !== id));
      setRemoving(null);
    });
  }

  if (lista.length === 0) {
    return (
      <div className="fp-card p-8 text-center">
        <p className="text-4xl mb-3">🎪</p>
        <p className="text-sm font-semibold text-[var(--ink-60)]">Nessun giocatore ancora.</p>
        <p className="text-xs text-[var(--ink-45)] mt-1">Condividi il link per far votare i tuoi cari!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-[var(--ink-45)] uppercase tracking-widest px-1 mb-1">
        {lista.length} giocator{lista.length === 1 ? "e" : "i"}
      </p>
      {lista.map((p) => (
        <div
          key={p.id}
          className={`fp-card px-4 py-3 flex items-center gap-3 transition-all duration-300 ${
            removing === p.id ? "opacity-30 scale-95" : ""
          }`}
        >
          {/* Avatar iniziale */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: "linear-gradient(135deg, #FFD166, #FF9F2F)" }}
          >
            {p.nomeInvitato.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--ink)] truncate">{p.nomeInvitato}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {p.votoSesso && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: p.votoSesso === "MASCHIO" ? "#EBF4FC" : "#FDEEF6",
                    color: p.votoSesso === "MASCHIO" ? "#6FA8DC" : "#F296C2",
                  }}>
                  {p.votoSesso === "MASCHIO" ? "💙 Maschio" : "🩷 Femmina"}
                </span>
              )}
              {p.votoPeso && (
                <span className="text-[10px] text-[var(--ink-45)] font-medium">
                  {(p.votoPeso / 1000).toFixed(2).replace(".", ",")} kg
                </span>
              )}
              {p.votoData && (
                <span className="text-[10px] text-[var(--ink-45)] font-medium">
                  {new Date(p.votoData).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
            {p.messaggioAugurio && (
              <p className="text-[11px] text-[var(--ink-60)] italic mt-0.5 truncate">"{p.messaggioAugurio}"</p>
            )}
          </div>

          {/* Elimina */}
          <button
            onClick={() => elimina(p.id)}
            disabled={removing === p.id}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-45)] hover:bg-red-50 hover:text-red-400 transition-colors disabled:opacity-40"
            title="Elimina voto"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
