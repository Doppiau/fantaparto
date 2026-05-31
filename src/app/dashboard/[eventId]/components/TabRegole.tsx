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

export default function TabRegole({
  eventId,
  isPremium,
  toggles: initialToggles,
}: TabRegoleProps) {
  const [toggles, setToggles] = useState(initialToggles);
  const [, startTransition] = useTransition();

  function flip(key: string) {
    const next = toggles.map((t) =>
      t.key === key ? { ...t, attivo: !t.attivo } : t
    );
    setToggles(next);
    const changed = next.find((t) => t.key === key)!;
    startTransition(() => {
      aggiornaToggleAction(eventId, key, changed.attivo);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Titolo sezione */}
      <p
        className="px-1 text-[11px] font-bold uppercase tracking-[0.1em]"
        style={{ color: "rgba(44,44,46,0.40)" }}
      >
        Categorie attive
      </p>

      {/* Toggle rows */}
      {toggles.map((t) => (
        <div
          key={t.key}
          className="fp-card-plain flex items-center gap-4 px-5 py-4"
        >
          {/* Icona + label */}
          <span className="text-xl w-7 text-center select-none">{t.emoji}</span>
          <span className="flex-1 text-[14px] font-semibold text-[var(--ink)]">
            {t.label}
          </span>

          {/* iOS-style toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={t.attivo}
            onClick={() => flip(t.key)}
            className="fp-toggle flex-shrink-0"
            style={{
              background: t.attivo
                ? "linear-gradient(100deg, #D4AF37, #C08A3E)"
                : "#DED5C8",
            }}
          >
            <span
              className="fp-toggle-thumb"
              style={{
                transform: t.attivo ? "translateX(22px)" : "translateX(3px)",
                boxShadow: t.attivo
                  ? "0 2px 8px rgba(212,175,55,0.42)"
                  : "0 2px 6px rgba(44,44,46,0.18)",
              }}
            />
          </button>
        </div>
      ))}

      {/* Domande Custom — blocco Premium */}
      <div className="relative mt-2">
        {/* Card contenuto sfumato */}
        <div
          className="fp-card-plain p-5 flex flex-col gap-2.5"
          style={{ opacity: isPremium ? 1 : 0.7 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl select-none">✏️</span>
              <p className="text-[14px] font-semibold text-[var(--ink)]">
                Domande Personalizzate
              </p>
            </div>
            {!isPremium && (
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(212,175,55,0.12)",
                  color: "#9A7000",
                }}
              >
                Premium
              </span>
            )}
          </div>
          <p
            className="text-[13px] leading-snug"
            style={{ color: "rgba(44,44,46,0.55)" }}
          >
            Aggiungi domande uniche al tuo FantaParto: nome del bebè, chi piange
            per primo, e altro ancora.
          </p>
          {isPremium && (
            <button
              className="mt-1 text-[13px] font-bold self-start px-4 py-2 rounded-xl transition-all active:scale-95"
              style={{
                background: "linear-gradient(100deg, #D4AF37, #C08A3E)",
                color: "white",
                boxShadow: "0 8px 20px -8px rgba(212,175,55,0.45)",
              }}
            >
              + Aggiungi domanda
            </button>
          )}
        </div>

        {/* Overlay frosted glass per utenti non-premium */}
        {!isPremium && (
          <>
            <div
              className="absolute inset-0 rounded-[24px] pointer-events-none"
              style={{
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                background: "rgba(253,251,247,0.72)",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[24px]">
              <span className="text-3xl select-none">🔒</span>
              <button
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] transition-all active:scale-95"
                style={{
                  background:
                    "linear-gradient(100deg, #D4AF37 0%, #C08A3E 100%)",
                  color: "white",
                  boxShadow: "0 12px 28px -8px rgba(212,175,55,0.45)",
                }}
              >
                🔒 Sblocca Premium · €2,99
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
