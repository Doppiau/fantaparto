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

const FREE_LIMIT = 20;

const AVATAR_COLORS = [
  ["#FF6B6B", "#FF8787"],
  ["#6FA8DC", "#4A87BB"],
  ["#F296C2", "#D070A0"],
  ["#5BD97A", "#34C759"],
  ["#FF9F45", "#FF6B6B"],
];

function getAvatarGradient(name: string): [string, string] {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] as [string, string];
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
      <div className="fp-card-plain p-10 flex flex-col items-center gap-4 text-center">
        <div className="text-5xl select-none">🎪</div>
        <div>
          <p className="text-[15px] font-bold text-[var(--ink)]">
            Nessun giocatore ancora
          </p>
          <p className="text-[13px] mt-1" style={{ color: "rgba(44,44,46,0.50)" }}>
            Condividi il link per far votare i tuoi cari!
          </p>
        </div>
      </div>
    );
  }

  const atLimit = lista.length >= FREE_LIMIT;

  return (
    <div className="flex flex-col gap-2">
      {/* Contatore + indicatore soglia */}
      <div className="px-1 flex items-center justify-between">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.1em]"
          style={{ color: "rgba(44,44,46,0.40)" }}
        >
          {lista.length} giocator{lista.length === 1 ? "e" : "i"}
        </p>
        <span
          className="text-[11px] font-bold tabular-nums px-2.5 py-1 rounded-full"
          style={{
            background: atLimit ? "rgba(255,107,107,0.12)" : "rgba(44,44,46,0.06)",
            color: atLimit ? "#CC3333" : "rgba(44,44,46,0.42)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {lista.length} / {FREE_LIMIT}
        </span>
      </div>

      {/* Avviso limite raggiunto */}
      {atLimit && (
        <div
          className="mx-1 px-4 py-3 rounded-2xl flex items-center gap-3"
          style={{
            background: "rgba(255,107,107,0.07)",
            border: "1px solid rgba(255,107,107,0.16)",
          }}
        >
          <span className="text-xl select-none">🔒</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold" style={{ color: "#CC3333" }}>
              Limite raggiunto
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(44,44,46,0.50)" }}>
              Sblocca Premium per partecipanti illimitati
            </p>
          </div>
        </div>
      )}

      {/* Lista partecipanti */}
      {lista.map((p) => {
        const [c1, c2] = getAvatarGradient(p.nomeInvitato);
        return (
          <div
            key={p.id}
            className="fp-card-plain flex items-center gap-3.5 px-4 py-3.5 transition-all duration-300"
            style={{
              opacity: removing === p.id ? 0.3 : 1,
              transform: removing === p.id ? "scale(0.95)" : "scale(1)",
            }}
          >
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-[15px] flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${c1}, ${c2})`,
                boxShadow: `0 4px 12px -4px ${c1}88`,
              }}
            >
              {p.nomeInvitato.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-[var(--ink)] truncate">
                {p.nomeInvitato}
              </p>

              {/* Badge pronostici */}
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {p.votoSesso && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        p.votoSesso === "MASCHIO"
                          ? "rgba(111,168,220,0.14)"
                          : "rgba(242,150,194,0.14)",
                      color: p.votoSesso === "MASCHIO" ? "#4A87BB" : "#C060A0",
                    }}
                  >
                    {p.votoSesso === "MASCHIO" ? "💙 Maschio" : "🩷 Femmina"}
                  </span>
                )}
                {p.votoPeso && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(255,107,107,0.10)",
                      color: "#CC3333",
                    }}
                  >
                    ⚖️ {(p.votoPeso / 1000).toFixed(2).replace(".", ",")} kg
                  </span>
                )}
                {p.votoData && (
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: "rgba(44,44,46,0.45)" }}
                  >
                    📅{" "}
                    {new Date(p.votoData).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>

              {/* Messaggio di auguri */}
              {p.messaggioAugurio && (
                <p
                  className="text-[11px] italic truncate mt-1"
                  style={{ color: "rgba(44,44,46,0.50)" }}
                >
                  &ldquo;{p.messaggioAugurio}&rdquo;
                </p>
              )}
            </div>

            {/* Bottone elimina */}
            <button
              onClick={() => elimina(p.id)}
              disabled={removing === p.id}
              aria-label="Elimina voto"
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-red-50 active:scale-90 disabled:opacity-30"
              style={{ color: "rgba(44,44,46,0.32)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#E5484D";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(44,44,46,0.32)";
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
