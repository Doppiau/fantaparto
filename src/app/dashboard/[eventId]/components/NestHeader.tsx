"use client";

import { useState } from "react";

interface NestHeaderProps {
  nomeBimbo: string | null;
  dataPresuntaParto: Date;
  codiceCondivisione: string;
  totVoti: number;
  visualizzazioniLink: number;
}

export default function NestHeader({
  nomeBimbo,
  dataPresuntaParto,
  codiceCondivisione,
  totVoti,
  visualizzazioniLink,
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
    <div
      className="relative overflow-hidden p-6 flex flex-col gap-5"
      style={{
        background: "linear-gradient(145deg, #FFFFFF 0%, #FFF6F6 100%)",
        border: "1px solid #F1ECE4",
        borderRadius: 28,
        boxShadow: "0 24px 60px -16px rgba(255,107,107,0.16), 0 8px 24px -8px rgba(44,44,46,0.07)",
      }}
    >
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 w-52 h-52 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,107,107,0.14) 0%, transparent 68%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-10 w-44 h-44 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,135,135,0.08) 0%, transparent 68%)" }}
      />

      {/* Riga superiore: nome + stats monospace */}
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1"
            style={{ color: "rgba(44,44,46,0.38)" }}
          >
            Il tuo FantaParto
          </p>
          <h1
            className="text-[30px] font-black leading-tight tracking-tight text-[var(--ink)]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            {name}
          </h1>
          <p className="mt-1 text-[13px] font-medium" style={{ color: "rgba(44,44,46,0.50)" }}>
            {remaining > 0
              ? `Settimana ${week} · ${remaining} giorni al grande momento`
              : remaining === 0
              ? "Oggi è il grande giorno! 🎉"
              : `${Math.abs(remaining)} giorni dopo la DPP`}
          </p>
        </div>

        {/* Badge voti */}
        <div
          className="flex-shrink-0 flex flex-col items-center rounded-2xl px-3.5 py-2.5"
          style={{
            background: "var(--salmon-10)",
            border: "1.5px solid rgba(255,107,107,0.20)",
          }}
        >
          <span
            className="text-[32px] font-black leading-none"
            style={{ color: "var(--salmon)", fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            {totVoti}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-wide mt-0.5"
            style={{ color: "rgba(44,44,46,0.38)" }}
          >
            {totVoti === 1 ? "voto" : "voti"}
          </span>
        </div>
      </div>

      {/* Contatore visite • voti (monospace) */}
      <div
        className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl self-start"
        style={{ background: "rgba(44,44,46,0.04)" }}
      >
        <span
          className="text-[12px] font-semibold tabular-nums"
          style={{ fontFamily: "var(--font-mono, monospace)", color: "rgba(44,44,46,0.50)" }}
        >
          {visualizzazioniLink.toLocaleString("it-IT")} visite
        </span>
        <span style={{ color: "rgba(44,44,46,0.22)", fontSize: 10 }}>•</span>
        <span
          className="text-[12px] font-semibold tabular-nums"
          style={{ fontFamily: "var(--font-mono, monospace)", color: "rgba(44,44,46,0.50)" }}
        >
          {totVoti} voti
        </span>
      </div>

      {/* Timeline gravidanza */}
      <div className="relative flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span
            className="text-[11px] font-semibold"
            style={{ color: "rgba(44,44,46,0.42)" }}
          >
            Giorno {Math.min(elapsed, totalDays)} di {totalDays}
          </span>
          <span
            className="text-[12px] font-black tabular-nums"
            style={{ color: "var(--salmon)", fontFamily: "var(--font-mono, monospace)" }}
          >
            {progress}%
          </span>
        </div>

        {/* Barra progresso */}
        <div
          className="relative h-3 rounded-full overflow-visible"
          style={{ background: "#F0E8E8" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #FF6B6B 0%, #FF8787 100%)",
              transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          />
          {progress > 2 && progress < 98 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2"
              style={{
                left: `calc(${progress}% - 10px)`,
                borderColor: "#FF6B6B",
                boxShadow: "0 2px 10px rgba(255,107,107,0.45)",
                transition: "left 1s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            />
          )}
        </div>

        <div
          className="flex justify-between text-[10px] font-medium"
          style={{ color: "rgba(44,44,46,0.35)" }}
        >
          <span>
            {start.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
          </span>
          <span>
            DPP · {dpp.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Codice + bottone copia */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl flex-1 min-w-0"
          style={{ background: "rgba(44,44,46,0.04)", border: "1px solid rgba(44,44,46,0.06)" }}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(44,44,46,0.38)" }}>
            Codice
          </span>
          <span
            className="text-[15px] font-black tracking-[0.18em] truncate"
            style={{ color: "var(--ink)", fontFamily: "var(--font-mono, monospace)" }}
          >
            {codiceCondivisione}
          </span>
        </div>

        <button
          onClick={copyLink}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[14px] transition-all duration-300 active:scale-[0.96]"
          style={{
            background: copied
              ? "linear-gradient(100deg, #34C759 0%, #5BD97A 100%)"
              : "linear-gradient(100deg, #FF6B6B 0%, #FF8787 100%)",
            color: "white",
            boxShadow: copied
              ? "0 10px 26px -8px rgba(52,199,89,0.45)"
              : "0 10px 26px -8px rgba(255,107,107,0.42)",
            fontFamily: "var(--font-jakarta, sans-serif)",
            whiteSpace: "nowrap",
          }}
        >
          <span className="text-base leading-none">{copied ? "✓" : "🔗"}</span>
          {copied ? "Copiato!" : "Copia Link"}
        </button>
      </div>
    </div>
  );
}
