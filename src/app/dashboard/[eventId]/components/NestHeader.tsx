"use client";

import { useState } from "react";

interface NestHeaderProps {
  nomeBimbo: string | null;
  dataPresuntaParto: Date;
  codiceCondivisione: string;
  totVoti: number;
  visualizzazioniLink: number;
  nomeMamma?: string;
}

function BabyBottle() {
  return (
    <svg className="w-16 h-16 animate-bounce" viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="bbBody" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FAF8F5" />
          <stop offset="100%" stopColor="#E6E0D5" />
        </radialGradient>
        <radialGradient id="bbCap" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFA1A1" />
          <stop offset="50%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#D94E4E" />
        </radialGradient>
        <radialGradient id="bbNipple" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFE094" />
          <stop offset="60%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#D9A832" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="90" rx="18" ry="4" fill="rgba(44,44,46,0.08)" />
      <rect x="32" y="44" width="36" height="40" rx="14" fill="url(#bbBody)" stroke="#F1ECE4" strokeWidth="2" />
      <line x1="42" y1="54" x2="48" y2="54" stroke="#D3C9BC" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="62" x2="52" y2="62" stroke="#D3C9BC" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="70" x2="48" y2="70" stroke="#D3C9BC" strokeWidth="2" strokeLinecap="round" />
      <rect x="29" y="34" width="42" height="12" rx="6" fill="url(#bbCap)" />
      <path d="M42 34 C42 22, 58 22, 58 34" fill="url(#bbNipple)" />
      <polygon points="50,24 52,28 56,28 53,30 54,34 50,32 46,34 47,30 44,28 48,28" fill="#FDFBF7" opacity="0.85" />
    </svg>
  );
}

export default function NestHeader({
  nomeBimbo,
  dataPresuntaParto,
  codiceCondivisione,
  totVoti,
  visualizzazioniLink,
  nomeMamma = "Mamma",
}: NestHeaderProps) {
  const [copied, setCopied] = useState(false);

  const dpp = new Date(dataPresuntaParto);
  const today = new Date();
  const start = new Date(dpp);
  start.setDate(start.getDate() - 280);

  const totalDays = Math.max(1, Math.round((dpp.getTime() - start.getTime()) / 86_400_000));
  const elapsed = Math.max(0, Math.round((today.getTime() - start.getTime()) / 86_400_000));
  const remaining = Math.max(0, Math.round((dpp.getTime() - today.getTime()) / 86_400_000));
  const progress = Math.min(100, Math.round((elapsed / totalDays) * 100));
  const week = Math.min(40, Math.ceil(elapsed / 7));

  const name = nomeBimbo ? `Baby ${nomeBimbo}` : "Fagiolino 🫘";

  async function copyLink() {
    const url = `https://fantaparto.com/vota/${codiceCondivisione}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  }

  return (
    <div className="clay-card p-6 sm:p-8 flex flex-col gap-6">
      {/* Header row: info + baby bottle */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-1.5">
          <span
            className="text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-widest border"
            style={{ background: "#FFF0F0", color: "#FF6B6B", borderColor: "rgba(255,107,107,0.20)" }}
          >
            Evento Attivo
          </span>
          <h1
            className="text-3xl font-extrabold text-[#2C2C2E] mt-2"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            {name}
          </h1>
          <p className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.55)" }}>
            Amministrato con amore da{" "}
            <strong className="text-[#2C2C2E]">{nomeMamma}</strong>
          </p>
        </div>

        {/* Baby bottle */}
        <div
          className="w-24 h-24 flex items-center justify-center rounded-3xl border border-[#F1ECE4] p-2 flex-shrink-0 self-center sm:self-start"
          style={{
            background: "#FDFBF7",
            boxShadow: "inset 3px 3px 8px rgba(44,44,46,0.05), inset -3px -3px 8px rgba(255,255,255,0.9)",
          }}
        >
          <BabyBottle />
        </div>
      </div>

      {/* Gestation timeline — clay inset */}
      <div className="clay-inset-panel p-4 space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-[#2C2C2E]">
          <span>Stato della Gestazione</span>
          <span
            className="px-2 py-0.5 rounded-md text-[#FF6B6B]"
            style={{
              fontFamily: "var(--font-mono, monospace)",
              background: "rgba(255,255,255,0.9)",
              boxShadow: "0 1px 4px rgba(44,44,46,0.08)",
            }}
          >
            Settimana {week} di 40
          </span>
        </div>

        <div
          className="w-full h-4 rounded-full overflow-hidden p-0.5"
          style={{ background: "#F1ECE4", boxShadow: "inset 0 2px 4px rgba(44,44,46,0.08)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #FF6B6B 0%, #FFD166 100%)",
            }}
          />
        </div>

        <div
          className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "rgba(44,44,46,0.42)" }}
        >
          <span>
            {remaining > 0
              ? `Mancano ${remaining} giorni al parto`
              : remaining === 0
              ? "Oggi è il grande giorno! 🎉"
              : `${Math.abs(remaining)} giorni dopo la DPP`}
          </span>
          <span style={{ fontFamily: "var(--font-mono, monospace)" }}>
            {visualizzazioniLink.toLocaleString("it-IT")} visite
          </span>
        </div>
      </div>

      {/* Stats chips */}
      <div className="flex gap-3">
        <div className="clay-inset-panel flex-1 p-3 text-center">
          <p
            className="text-[28px] font-black leading-none"
            style={{ color: "#FF6B6B", fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            {totVoti}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "rgba(44,44,46,0.38)" }}>
            {totVoti === 1 ? "Pronostico" : "Pronostici"}
          </p>
        </div>
        <div className="clay-inset-panel flex-1 p-3 text-center">
          <p
            className="text-[28px] font-black leading-none"
            style={{ color: "#FF6B6B", fontFamily: "var(--font-mono, monospace)" }}
          >
            {visualizzazioniLink}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "rgba(44,44,46,0.38)" }}>
            Visite link
          </p>
        </div>
        <div className="clay-inset-panel flex-1 p-3 text-center">
          <p
            className="text-[28px] font-black leading-none"
            style={{ color: "#FFD166", fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            {week}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "rgba(44,44,46,0.38)" }}>
            Settimana
          </p>
        </div>
      </div>

      {/* Link copier */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div
          className="w-full px-4 py-3 rounded-2xl flex items-center justify-between gap-2 min-w-0"
          style={{
            background: "#FDFBF7",
            border: "2px solid #F1ECE4",
            boxShadow: "inset 2px 2px 6px rgba(44,44,46,0.04), inset -2px -2px 6px rgba(255,255,255,0.9)",
          }}
        >
          <span
            className="text-xs font-bold truncate"
            style={{ fontFamily: "var(--font-mono, monospace)", color: "rgba(44,44,46,0.55)" }}
          >
            fantaparto.com/vota/{codiceCondivisione}
          </span>
          <span
            className="text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline flex-shrink-0"
            style={{ color: "#FF6B6B", background: "rgba(255,107,107,0.10)" }}
          >
            WhatsApp
          </span>
        </div>

        <button
          onClick={copyLink}
          className={`w-full sm:w-auto flex-shrink-0 px-6 py-3.5 font-bold text-xs tracking-wide text-white flex items-center justify-center gap-2 transition-all rounded-[20px] ${copied ? "" : "clay-btn-coral"}`}
          style={copied ? { background: "#06D6A0", boxShadow: "0 8px 16px rgba(6,214,160,0.25)" } : {}}
        >
          {copied ? (
            <><span>✓</span><span>Link Copiato!</span></>
          ) : (
            <><span>🔗</span><span>Condividi con Amici</span></>
          )}
        </button>
      </div>
    </div>
  );
}
