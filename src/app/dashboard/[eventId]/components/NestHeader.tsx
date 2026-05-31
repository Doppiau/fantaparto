"use client";

import { useState } from "react";

interface NestHeaderProps {
  nomeBimbo: string | null;
  dataPresuntaParto: Date;
  codiceCondivisione: string;
  totVoti: number;
}

export default function NestHeader({ nomeBimbo, dataPresuntaParto, codiceCondivisione, totVoti }: NestHeaderProps) {
  const [copied, setCopied] = useState(false);

  const oggi = new Date();
  const dpp = new Date(dataPresuntaParto);
  const gravidanzaStart = new Date(dpp);
  gravidanzaStart.setDate(gravidanzaStart.getDate() - 280);

  const totGiorni = Math.max(1, Math.round((dpp.getTime() - gravidanzaStart.getTime()) / 86400000));
  const giorniPassati = Math.max(0, Math.round((oggi.getTime() - gravidanzaStart.getTime()) / 86400000));
  const giorniMancanti = Math.max(0, Math.round((dpp.getTime() - oggi.getTime()) / 86400000));
  const progresso = Math.min(100, Math.round((giorniPassati / totGiorni) * 100));

  const nomeDisplay = nomeBimbo ? `Baby ${nomeBimbo}` : "Fagiolino 🫘";

  async function copyLink() {
    const url = `https://fantaparto.com/vota/${codiceCondivisione}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback per browser senza clipboard API
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <div className="fp-card p-6 flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[var(--ink-45)] uppercase tracking-widest mb-0.5">Il tuo FantaParto</p>
          <h1 className="text-2xl font-bold text-[var(--ink)] leading-tight">{nomeDisplay}</h1>
          <p className="text-sm text-[var(--ink-60)] mt-0.5">
            {giorniMancanti > 0
              ? `Mancano ${giorniMancanti} giorni alla DPP`
              : giorniMancanti === 0
              ? "Oggi è il grande giorno! 🎉"
              : `${Math.abs(giorniMancanti)} giorni dal termine`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-3xl font-black text-[var(--honey)]">{totVoti}</span>
          <span className="text-xs text-[var(--ink-45)] font-medium">voti</span>
        </div>
      </div>

      {/* Progress arc / bar */}
      <div>
        <div className="flex justify-between text-[11px] font-semibold text-[var(--ink-45)] mb-1.5">
          <span>Inizio</span>
          <span className="text-[var(--honey)] font-bold">{progresso}%</span>
          <span>DPP</span>
        </div>
        <div className="relative h-3 rounded-full bg-[#F0E7D6] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{
              width: `${progresso}%`,
              background: "linear-gradient(90deg, #FFD166, #FFAA44)",
            }}
          />
          {/* thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[var(--honey)] shadow-sm transition-all duration-700"
            style={{ left: `calc(${progresso}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[var(--ink-45)] mt-1">
          <span>{gravidanzaStart.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</span>
          <span>{dpp.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* Copy link CTA */}
      <button
        onClick={copyLink}
        className="fp-btn-gold flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200 active:scale-95"
      >
        {copied ? (
          <>
            <span className="text-base">✅</span>
            <span>Link copiato!</span>
          </>
        ) : (
          <>
            <span className="text-base">🔗</span>
            <span>Copia Link Invitati</span>
          </>
        )}
      </button>
    </div>
  );
}
