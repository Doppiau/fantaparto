"use client";

import { useState, useTransition } from "react";
import { aggiornaToggleAction } from "../actions";

interface Toggle {
  key: string;
  label: string;
  emoji: string;
  attivo: boolean;
}

interface TabRegoleProps {
  eventId: string;
  isPremium: boolean;
  toggles: Toggle[];
}

export default function TabRegole({ eventId, isPremium, toggles: initialToggles }: TabRegoleProps) {
  const [toggles, setToggles] = useState(initialToggles);
  const [, startTransition] = useTransition();

  function flip(key: string) {
    const next = toggles.map((t) => t.key === key ? { ...t, attivo: !t.attivo } : t);
    setToggles(next);
    const changed = next.find((t) => t.key === key)!;
    startTransition(() => {
      aggiornaToggleAction(eventId, key, changed.attivo);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-[var(--ink-45)] uppercase tracking-widest px-1">Categorie attive</p>

      {toggles.map((t) => (
        <div key={t.key} className="fp-card px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">{t.emoji}</span>
            <span className="text-sm font-semibold text-[var(--ink)]">{t.label}</span>
          </div>
          {/* iOS-style toggle */}
          <button
            type="button"
            onClick={() => flip(t.key)}
            className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
            style={{ background: t.attivo ? "var(--honey)" : "#D9D0C2" }}
            aria-checked={t.attivo}
            role="switch"
          >
            <span
              className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-1"
              style={{ transform: t.attivo ? "translateX(26px)" : "translateX(4px)" }}
            />
          </button>
        </div>
      ))}

      {/* Domande Custom — bloccate se non premium */}
      <div className="relative mt-2">
        <div className={`fp-card p-5 flex flex-col gap-2 ${!isPremium ? "opacity-60" : ""}`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-[var(--ink-45)] uppercase tracking-widest">Domande Custom</p>
            {!isPremium && <span className="text-lg">🔒</span>}
          </div>
          <p className="text-sm text-[var(--ink-60)]">
            Aggiungi le tue domande personalizzate per rendere il FantaParto unico!
          </p>
          {!isPremium && (
            <p className="text-xs font-bold text-[var(--honey)]">Upgrade a Premium · €2,99</p>
          )}
        </div>
        {!isPremium && (
          <div
            className="absolute inset-0 rounded-[24px]"
            style={{
              backdropFilter: "blur(3px)",
              background: "rgba(253,251,247,0.55)",
            }}
          />
        )}
        {!isPremium && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[24px]">
            <button className="fp-btn-gold px-6 py-2.5 text-sm font-bold flex items-center gap-2">
              <span>🔒</span> Sblocca con Premium · €2,99
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
