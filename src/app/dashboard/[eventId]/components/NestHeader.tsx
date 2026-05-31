"use client";

import { useState } from "react";

interface NestHeaderProps {
  nomeBimbo: string | null;
  dataPresuntaParto: Date;
  codiceCondivisione: string;
  totVoti: number;
}

export default function NestHeader({
  nomeBimbo,
  dataPresuntaParto,
  codiceCondivisione,
  totVoti,
}: NestHeaderProps) {
  const [copied, setCopied] = useState(false);

  const dpp = new Date(dataPresuntaParto);
  const today = new Date();
  const start = new Date(dpp);
  start.setDate(start.getDate() - 280); // inizio gravidanza ~40 settimane prima

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
      className="fp-card-warm relative overflow-hidden p-6 flex flex-col gap-5"
    >
      {/* Ambient glow decorativo */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-10 w-40 h-40 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(192,138,62,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Riga superiore: nome + badge voti */}
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1"
            style={{ color: "rgba(44,44,46,0.40)" }}
          >
            Il tuo FantaParto
          </p>
          <h1
            className="text-[30px] font-black leading-tight tracking-tight text-[var(--ink)]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            {name}
          </h1>
          <p className="mt-1 text-[13px] font-medium" style={{ color: "rgba(44,44,46,0.55)" }}>
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
            background: "rgba(212,175,55,0.10)",
            border: "1.5px solid rgba(212,175,55,0.22)",
          }}
        >
          <span
            className="text-[32px] font-black leading-none"
            style={{
              color: "#D4AF37",
              fontFamily: "var(--font-fredoka, sans-serif)",
            }}
          >
            {totVoti}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-wide mt-0.5"
            style={{ color: "rgba(44,44,46,0.40)" }}
          >
            {totVoti === 1 ? "voto" : "voti"}
          </span>
        </div>
      </div>

      {/* Timeline gravidanza */}
      <div className="relative flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span
            className="text-[11px] font-semibold"
            style={{ color: "rgba(44,44,46,0.45)" }}
          >
            Giorno {Math.min(elapsed, totalDays)} di {totalDays}
          </span>
          <span
            className="text-[12px] font-black"
            style={{ color: "#D4AF37" }}
          >
            {progress}%
          </span>
        </div>

        {/* Barra progresso */}
        <div
          className="relative h-3 rounded-full overflow-visible"
          style={{ background: "#EDE4D5" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #D4AF37 0%, #C08A3E 100%)",
              transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          />
          {/* Knob */}
          {progress > 2 && progress < 98 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2"
              style={{
                left: `calc(${progress}% - 10px)`,
                borderColor: "#D4AF37",
                boxShadow: "0 2px 10px rgba(212,175,55,0.50)",
                transition: "left 1s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            />
          )}
        </div>

        <div
          className="flex justify-between text-[10px] font-medium"
          style={{ color: "rgba(44,44,46,0.38)" }}
        >
          <span>
            {start.toLocaleDateString("it-IT", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <span>
            DPP ·{" "}
            {dpp.toLocaleDateString("it-IT", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Codice condivisione */}
      <div
        className="relative flex items-center justify-between px-4 py-2.5 rounded-2xl"
        style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.15)" }}
      >
        <span className="text-[11px] font-semibold" style={{ color: "rgba(44,44,46,0.45)" }}>
          Codice
        </span>
        <span
          className="text-[15px] font-black tracking-[0.18em]"
          style={{ color: "#C08A3E", fontFamily: "var(--font-fredoka, sans-serif)" }}
        >
          {codiceCondivisione}
        </span>
      </div>

      {/* Bottone copia link */}
      <button
        onClick={copyLink}
        className="relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[15px] transition-all duration-300 active:scale-[0.97]"
        style={{
          background: copied
            ? "linear-gradient(100deg, #34C759 0%, #5BD97A 100%)"
            : "linear-gradient(100deg, #D4AF37 0%, #C08A3E 100%)",
          color: "white",
          boxShadow: copied
            ? "0 12px 30px -8px rgba(52,199,89,0.45)"
            : "0 12px 30px -8px rgba(212,175,55,0.42)",
          fontFamily: "var(--font-jakarta, sans-serif)",
        }}
      >
        <span className="text-lg leading-none">{copied ? "✓" : "🔗"}</span>
        {copied ? "Link copiato negli appunti!" : "Copia Link Invitati"}
      </button>
    </div>
  );
}
