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
      <div className="flex flex-col items-center gap-4 text-center py-12">
        <div className="text-5xl select-none">🎪</div>
        <div>
          <p className="text-[15px] font-bold text-[#2C2C2E]">Nessun giocatore ancora</p>
          <p className="text-[13px] mt-1" style={{ color: "rgba(44,44,46,0.50)" }}>
            Condividi il link per far votare i tuoi cari!
          </p>
        </div>
      </div>
    );
  }

  const atLimit = lista.length >= FREE_LIMIT;
  const pct = Math.round((lista.length / FREE_LIMIT) * 100);

  return (
    <div className="space-y-6">
      {/* Limit progress bar */}
      <div
        className="p-4 rounded-2xl border-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          background: atLimit ? "rgba(255,107,107,0.06)" : "rgba(255,209,102,0.08)",
          borderColor: atLimit ? "rgba(255,107,107,0.20)" : "rgba(255,209,102,0.30)",
        }}
      >
        <div className="space-y-0.5">
          <span
            className="text-xs font-bold flex items-center gap-1.5"
            style={{ color: atLimit ? "#CC3333" : "#9A7000" }}
          >
            {atLimit ? "⚠️ Limite giuria raggiunto" : "📊 Capienza giuria gratuita"}
          </span>
          <p className="text-[11px] font-semibold" style={{ color: "rgba(44,44,46,0.60)" }}>
            {atLimit
              ? "Sblocca Premium per partecipanti illimitati."
              : `Il piano gratuito permette fino a ${FREE_LIMIT} scommettitori.`}
          </p>
        </div>
        <div className="w-full md:w-56 space-y-1 flex-shrink-0">
          <div
            className="flex justify-between items-center text-[10px] font-bold"
            style={{ color: atLimit ? "#CC3333" : "#9A7000", fontFamily: "var(--font-mono, monospace)" }}
          >
            <span>Partecipanti: {lista.length}/{FREE_LIMIT}</span>
            <span>{pct}%</span>
          </div>
          <div
            className="w-full h-2.5 rounded-full overflow-hidden p-0.5"
            style={{ background: "rgba(44,44,46,0.10)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: atLimit
                  ? "linear-gradient(90deg, #FF6B6B, #FF8787)"
                  : "linear-gradient(90deg, #FFD166, #FF9F45)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Participants table */}
      <div className="overflow-x-auto rounded-2xl border-2 border-[#F1ECE4]">
        <table className="w-full border-collapse">
          <thead>
            <tr
              className="text-[10px] font-extrabold uppercase tracking-widest text-left border-b-2 border-[#F1ECE4]"
              style={{ background: "#FDFBF7", color: "rgba(44,44,46,0.38)" }}
            >
              <th className="px-4 py-3">Partecipante</th>
              <th className="px-4 py-3">Sesso</th>
              <th className="px-4 py-3">Peso</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-center">×</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1ECE4]/60">
            {lista.map((p) => (
              <tr
                key={p.id}
                className="text-xs transition-all duration-300"
                style={{
                  opacity: removing === p.id ? 0.25 : 1,
                  transform: removing === p.id ? "scale(0.98)" : "scale(1)",
                }}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-[12px] flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(${(p.nomeInvitato.charCodeAt(0) * 37) % 360}, 65%, 62%), hsl(${(p.nomeInvitato.charCodeAt(0) * 37 + 30) % 360}, 65%, 52%))`,
                      }}
                    >
                      {p.nomeInvitato.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-[#2C2C2E] truncate max-w-[120px]">
                        {p.nomeInvitato}
                      </p>
                      {p.messaggioAugurio && (
                        <p
                          className="text-[10px] italic truncate max-w-[120px]"
                          style={{ color: "rgba(44,44,46,0.45)" }}
                        >
                          &ldquo;{p.messaggioAugurio}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-semibold">
                  {p.votoSesso ? (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={
                        p.votoSesso === "MASCHIO"
                          ? { background: "rgba(78,168,222,0.14)", color: "#3A7EAF" }
                          : { background: "rgba(242,150,194,0.14)", color: "#C060A0" }
                      }
                    >
                      {p.votoSesso === "MASCHIO" ? "♂ Maschio" : "♀ Femmina"}
                    </span>
                  ) : (
                    <span style={{ color: "rgba(44,44,46,0.28)" }}>—</span>
                  )}
                </td>
                <td
                  className="px-4 py-3.5 font-bold"
                  style={{ fontFamily: "var(--font-mono, monospace)", color: "#2C2C2E" }}
                >
                  {p.votoPeso ? `${(p.votoPeso / 1000).toFixed(2).replace(".", ",")} kg` : "—"}
                </td>
                <td className="px-4 py-3.5 font-bold" style={{ color: "rgba(44,44,46,0.70)" }}>
                  {p.votoData
                    ? new Date(p.votoData).toLocaleDateString("it-IT", { day: "numeric", month: "short" })
                    : "—"}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => elimina(p.id)}
                    disabled={removing === p.id}
                    aria-label="Elimina voto"
                    className="p-1.5 rounded-xl transition-all hover:bg-red-50 active:scale-90 disabled:opacity-30"
                    style={{ color: "rgba(44,44,46,0.30)" }}
                    onMouseEnter={(e) => { (e.currentTarget).style.color = "#E5484D"; }}
                    onMouseLeave={(e) => { (e.currentTarget).style.color = "rgba(44,44,46,0.30)"; }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
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
