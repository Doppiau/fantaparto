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
  { id: "regole",  label: "Regole",    emoji: "⚙️" },
  { id: "giuria",  label: "Giuria",    emoji: "👥" },
  { id: "giorno",  label: "Il Grande Giorno", emoji: "🏁" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function BottomTabs({
  eventId,
  isPremium,
  stato,
  toggles,
  partecipanti,
  risultatiEsistenti,
}: BottomTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("regole");

  return (
    <div className="clay-card p-6 sm:p-8 space-y-6">
      {/* Tab bar with underline style */}
      <div className="flex border-b-2 border-[#F1ECE4] gap-4 md:gap-8 overflow-x-auto pb-0.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="pb-4 text-xs sm:text-sm font-extrabold tracking-wider uppercase border-b-4 transition-all shrink-0 flex items-center gap-2"
              style={{
                borderBottomColor: isActive ? "#FF6B6B" : "transparent",
                color: isActive ? "#FF6B6B" : "rgba(44,44,46,0.38)",
              }}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {tab.id === "giuria" && partecipanti.length > 0 && (
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: "#FFD166", color: "#2C2C2E" }}
                >
                  {partecipanti.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "regole" && (
          <TabRegole eventId={eventId} isPremium={isPremium} toggles={toggles} />
        )}
        {activeTab === "giuria" && (
          <TabGiuria partecipanti={partecipanti} eventId={eventId} />
        )}
        {activeTab === "giorno" && (
          <TabGrandGiorno
            eventId={eventId}
            stato={stato}
            risultatiEsistenti={risultatiEsistenti}
            partecipanti={partecipanti}
          />
        )}
      </div>
    </div>
  );
}
