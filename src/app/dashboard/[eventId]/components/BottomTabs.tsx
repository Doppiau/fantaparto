"use client";

import { useState } from "react";
import TabRegole from "./TabRegole";
import TabGiuria from "./TabGiuria";
import TabGrandGiorno from "./TabGrandGiorno";

interface Toggle {
  key: string;
  label: string;
  emoji: string;
  attivo: boolean;
}

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

interface BottomTabsProps {
  eventId: string;
  isPremium: boolean;
  stato: string;
  toggles: Toggle[];
  partecipanti: Partecipante[];
  risultatiEsistenti: {
    realeSesso?: string | null;
    realeData?: Date | null;
    realePeso?: number | null;
    realeOra?: string | null;
  };
}

const TABS = [
  { id: "regole", label: "Regole", emoji: "⚙️" },
  { id: "giuria", label: "Giuria", emoji: "👥" },
  { id: "giorno", label: "Il Giorno", emoji: "🍼" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function BottomTabs({ eventId, isPremium, stato, toggles, partecipanti, risultatiEsistenti }: BottomTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("regole");

  return (
    <div className="flex flex-col gap-4">
      {/* Tab switcher */}
      <div className="fp-card p-1.5 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[18px] text-sm font-bold transition-all duration-200"
            style={{
              background: activeTab === tab.id ? "var(--honey)" : "transparent",
              color: activeTab === tab.id ? "white" : "var(--ink-60)",
            }}
          >
            <span>{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel */}
      <div>
        {activeTab === "regole" && (
          <TabRegole eventId={eventId} isPremium={isPremium} toggles={toggles} />
        )}
        {activeTab === "giuria" && (
          <TabGiuria partecipanti={partecipanti} eventId={eventId} />
        )}
        {activeTab === "giorno" && (
          <TabGrandGiorno eventId={eventId} stato={stato} risultatiEsistenti={risultatiEsistenti} />
        )}
      </div>
    </div>
  );
}
