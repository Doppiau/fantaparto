"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface EventoSidebar {
  id:               string;
  nomeBimbo:        string | null;
  stato:            string;
  dataPresuntaParto: Date;
}

interface UserSidebar {
  nome:      string | null;
  avatarUrl: string | null;
  email:     string;
}

interface SidebarProps {
  eventi: EventoSidebar[];
  user:   UserSidebar;
}

const NAV = [
  { href: "/dashboard", icon: "home",               label: "Home",         disabled: false },
  { href: "/dashboard/stats",    icon: "leaderboard",     label: "Statistiche", disabled: true },
  { href: "/dashboard/persone",  icon: "group",           label: "Persone",     disabled: true },
  { href: "/dashboard/settings", icon: "settings",        label: "Impostazioni",disabled: true },
  { href: "/dashboard/premium",  icon: "workspace_premium",label: "Premium",    disabled: true },
] as const;

// Palette colori per le pool (ciclica)
const POOL_COLORS = ["#FFD166", "#FF6B6B", "#6FA8DC", "#34C759", "#FF9F45"];

export default function Sidebar({ eventi, user }: SidebarProps) {
  const pathname = usePathname();

  const attivi  = eventi.filter((e) => e.stato !== "CONCLUSO");
  const initiali = (user.nome ?? user.email).slice(0, 2).toUpperCase();

  return (
    <aside
      className="h-screen w-64 fixed left-0 top-0 flex flex-col py-6 z-50"
      style={{
        background:  "#1A1A2E",
        color:       "#FFD166",
        boxShadow:   "inset -4px 0 12px rgba(0,0,0,0.20)",
      }}
    >
      {/* Logo */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #FF6B6B, #FF8787)", boxShadow: "0 4px 12px rgba(255,107,107,0.35)" }}
        >
          <span className="text-white text-lg font-black" style={{ fontFamily: "var(--font-fredoka)" }}>F</span>
        </div>
        <div>
          <h1
            className="leading-none font-black text-xl"
            style={{ fontFamily: "var(--font-fredoka)", color: "#FFD166", letterSpacing: "-0.01em" }}
          >
            FantaParto
          </h1>
          <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,209,102,0.45)" }}>
            Pregnancy Betting
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
        {NAV.map(({ href, icon, label, disabled }) => {
          const isActive = disabled
            ? false
            : href === "/dashboard"
              ? pathname === "/dashboard" || pathname.startsWith("/dashboard/")
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={disabled ? "#" : href}
              aria-disabled={disabled}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
              style={{
                background:    isActive ? "rgba(255,209,102,0.18)" : "transparent",
                color:         isActive ? "#FFD166" : "rgba(255,209,102,0.55)",
                pointerEvents: disabled ? "none" : "auto",
                boxShadow:     isActive ? "inset 2px 2px 4px rgba(0,0,0,0.25)" : "none",
              }}
            >
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
              <span className="text-sm font-bold">{label}</span>
            </Link>
          );
        })}

        {/* Active Pools */}
        {attivi.length > 0 && (
          <div className="pt-5 pb-2 px-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,209,102,0.40)" }}>
              I tuoi FantaParto
            </p>
            <div className="space-y-2">
              {attivi.map((ev, i) => {
                const isActive  = pathname.includes(ev.id);
                const remaining = Math.max(0, Math.round(
                  (new Date(ev.dataPresuntaParto).getTime() - Date.now()) / 86_400_000,
                ));
                const color = POOL_COLORS[i % POOL_COLORS.length];

                return (
                  <Link
                    key={ev.id}
                    href={`/dashboard/${ev.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                      border:     isActive ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                      style={{ background: color, boxShadow: "inset 0 1px 3px rgba(0,0,0,0.20)" }}
                    >
                      🍼
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#FFD166" }}>
                        {ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a"}
                      </p>
                      <p className="text-[11px]" style={{ color: "rgba(255,209,102,0.50)" }}>
                        {remaining > 0 ? `${remaining} giorni al parto` : "Oggi!"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-4 mt-4 space-y-3">
        <button
          className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{ background: "#FFD166", color: "#1A1A2E", boxShadow: "0 4px 0 rgba(0,0,0,0.15)" }}
        >
          ⭐ Upgrade Premium
        </button>

        <div
          className="flex items-center gap-3 p-2 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="avatar" className="w-9 h-9 rounded-full border-2" style={{ borderColor: "rgba(255,209,102,0.30)" }} />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: "rgba(255,209,102,0.20)", color: "#FFD166" }}
            >
              {initiali}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "#FFD166" }}>
              {user.nome ?? user.email.split("@")[0]}
            </p>
            <p className="text-[10px] truncate" style={{ color: "rgba(255,209,102,0.45)" }}>
              {user.email}
            </p>
          </div>
          <span className="material-symbols-outlined text-[18px]" style={{ color: "rgba(255,209,102,0.40)" }}>
            more_vert
          </span>
        </div>
      </div>
    </aside>
  );
}
