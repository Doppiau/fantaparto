"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";

interface EventoSidebar {
  id:                string;
  nomeBimbo:         string | null;
  stato:             string;
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
  { href: "/dashboard",          icon: "dashboard",         label: "Panoramica",    disabled: false },
  { href: "/dashboard/stats",    icon: "analytics",         label: "Statistiche",   disabled: true  },
  { href: "/dashboard/invitati", icon: "group",             label: "Invitati",      disabled: true  },
  { href: "/dashboard/settings", icon: "settings",          label: "Configurazione",disabled: true  },
  { href: "/dashboard/rivelazione", icon: "celebration",    label: "Rivelazione",   disabled: true  },
] as const;

// Primary color palette
const P = {
  bg:        "#fbf9f5",
  primary:   "#874e58",
  priCont:   "#f4acb7",
  priFixed:  "#ffd9de",
  onSurf:    "#1b1c1a",
  onSurfVar: "#514345",
  outline:   "#d6c2c3",
  surfCont:  "#efeeea",
} as const;

export default function Sidebar({ eventi, user }: SidebarProps) {
  const pathname = usePathname();

  const attivi   = eventi.filter((e) => e.stato !== "CONCLUSO");
  const initiali = (user.nome ?? user.email).slice(0, 2).toUpperCase();

  return (
    <aside
      className="h-screen w-64 fixed left-0 top-0 flex flex-col z-50"
      style={{
        background: P.bg,
        borderRight: `1px solid ${P.outline}`,
        boxShadow: "12px 0 32px rgba(135,78,88,0.05)",
        fontFamily: "var(--font-vietnam, sans-serif)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 mb-2">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #f4acb7, #874e58)", boxShadow: "0 8px 20px rgba(135,78,88,0.28)" }}
        >
          <span className="text-white text-xl font-black" style={{ fontFamily: "var(--font-quicksand, sans-serif)" }}>F</span>
        </div>
        <div>
          <h1
            className="text-[22px] font-bold leading-tight"
            style={{ fontFamily: "var(--font-quicksand, sans-serif)", color: P.primary }}
          >
            FantaParto
          </h1>
          <p className="text-[11px] font-semibold" style={{ color: P.onSurfVar }}>
            La Gioiosa Attesa
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
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
              className="flex items-center gap-3 px-4 py-3 rounded-full transition-all"
              style={{
                background:    isActive ? P.priFixed : "transparent",
                color:         isActive ? P.primary  : disabled ? `${P.onSurfVar}70` : P.onSurfVar,
                pointerEvents: disabled ? "none" : "auto",
                fontWeight:    isActive ? "700" : "600",
              }}
            >
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
              <span className="text-[14px] tracking-[0.03em]">{label}</span>
            </Link>
          );
        })}

        {/* Active events list */}
        {attivi.length > 0 && (
          <div className="pt-5 pb-2">
            <p
              className="text-[11px] font-bold uppercase tracking-widest px-4 mb-3"
              style={{ color: P.outline }}
            >
              I tuoi FantaParto
            </p>
            <div className="space-y-1">
              {attivi.map((ev) => {
                const isActive = pathname.includes(ev.id);
                const remaining = Math.max(0, Math.round(
                  (new Date(ev.dataPresuntaParto).getTime() - Date.now()) / 86_400_000,
                ));
                return (
                  <Link
                    key={ev.id}
                    href={`/dashboard/${ev.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-full transition-all"
                    style={{
                      background: isActive ? P.priFixed : "transparent",
                      color: isActive ? P.primary : P.onSurfVar,
                    }}
                  >
                    <span className="text-base flex-shrink-0">🍼</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold truncate" style={{ color: isActive ? P.primary : P.onSurf }}>
                        {ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a"}
                      </p>
                      <p className="text-[10px] font-medium" style={{ color: P.onSurfVar }}>
                        {remaining > 0 ? `${remaining}g al parto` : "Oggi!"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* CTA + user */}
      <div className="px-4 pb-5 pt-3 space-y-3">
        <button
          className="w-full py-3.5 rounded-full text-[15px] font-bold transition-all active:scale-95"
          style={{
            background: P.primary,
            color: "#ffffff",
            boxShadow: "0 12px 32px rgba(135,78,88,0.22)",
            fontFamily: "var(--font-quicksand, sans-serif)",
          }}
        >
          Nuova Sfida
        </button>

        <div
          className="flex items-center gap-2.5 px-3 py-2 rounded-full"
          style={{ background: P.surfCont }}
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full flex-shrink-0" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: P.priFixed, color: P.primary }}
            >
              {initiali}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold truncate" style={{ color: P.onSurf }}>
              {user.nome ?? user.email.split("@")[0]}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Logout"
              className="rounded-full p-1 transition-colors"
              style={{ color: P.onSurfVar }}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
