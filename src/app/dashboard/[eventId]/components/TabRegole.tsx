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
    <div className="space-y-6">
      <div className="space-y-1">
        <h4 className="text-lg font-extrabold text-[#2C2C2E]">
          Parametri del Gioco
        </h4>
        <p className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.55)" }}>
          Regola quali opzioni sono attive per i pronostici degli invitati.
        </p>
      </div>

      {/* Toggle grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {toggles.map((t) => (
          <div
            key={t.key}
            className="flex items-center justify-between p-4 rounded-2xl border-2 border-[#F1ECE4]"
            style={{
              background: "#FDFBF7",
              boxShadow: "inset 2px 2px 6px rgba(44,44,46,0.04), inset -2px -2px 6px rgba(255,255,255,0.9)",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl w-7 text-center select-none">{t.emoji}</span>
              <span className="text-sm font-bold text-[#2C2C2E] capitalize">{t.label}</span>
            </div>

            {/* iOS toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={t.attivo}
              onClick={() => flip(t.key)}
              className="w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all flex-shrink-0"
              style={{
                background: t.attivo
                  ? "linear-gradient(100deg, #FF6B6B, #FF8787)"
                  : "#DED5C8",
                boxShadow: t.attivo
                  ? "inset 0 1px 3px rgba(0,0,0,0.12), 0 2px 8px rgba(255,107,107,0.35)"
                  : "inset 0 1px 3px rgba(0,0,0,0.10)",
              }}
            >
              <div
                className="bg-white w-5 h-5 rounded-full"
                style={{
                  transform: t.attivo ? "translateX(20px)" : "translateX(0px)",
                  transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                  boxShadow: t.attivo
                    ? "0 2px 8px rgba(255,107,107,0.38)"
                    : "0 2px 6px rgba(44,44,46,0.18)",
                }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Premium custom questions block */}
      <div className="relative">
        <div
          className="p-5 rounded-3xl border-2 border-[#F1ECE4] space-y-2.5"
          style={{
            background: "linear-gradient(135deg, rgba(255,107,107,0.04), rgba(255,209,102,0.04))",
            opacity: isPremium ? 1 : 0.65,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl select-none">✏️</span>
              <p className="text-[14px] font-bold text-[#2C2C2E]">Domande Personalizzate</p>
            </div>
            {!isPremium && (
              <span
                className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border"
                style={{
                  background: "rgba(212,175,55,0.12)",
                  color: "#9A7000",
                  borderColor: "rgba(212,175,55,0.25)",
                }}
              >
                Premium
              </span>
            )}
          </div>
          <p className="text-[13px] leading-snug" style={{ color: "rgba(44,44,46,0.55)" }}>
            Aggiungi domande uniche: nome del bebè, chi piange per primo, e altro.
          </p>
          {isPremium && (
            <button
              className="mt-1 text-[13px] font-bold self-start px-4 py-2 rounded-xl transition-all active:scale-95 text-white clay-btn-coral"
            >
              + Aggiungi domanda
            </button>
          )}
        </div>

        {/* Frosted glass lock for non-premium */}
        {!isPremium && (
          <>
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                background: "rgba(253,251,247,0.70)",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 border-[#F1ECE4]"
                style={{
                  background: "white",
                  boxShadow: "0 4px 16px rgba(44,44,46,0.10)",
                  animation: "gentle-float-1 3s ease-in-out infinite",
                }}
              >
                👑
              </div>
              <button
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] text-white transition-all active:scale-95"
                style={{
                  background: "linear-gradient(100deg, #D4AF37 0%, #C08A3E 100%)",
                  boxShadow: "0 12px 28px -8px rgba(212,175,55,0.45)",
                }}
              >
                Sblocca Premium · €2,99
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
