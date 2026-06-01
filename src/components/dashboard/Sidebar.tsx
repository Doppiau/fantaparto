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

// ── Dark theme tokens ─────────────────────────────────────────────────────────
const S = {
  bg:        "#18101a",          // quasi-nero con tono caldo viola-rosato
  surface:   "#231520",          // surface slightly lighter
  surfHov:   "#2c1c28",          // hover state
  border:    "rgba(244,172,183,0.10)",
  primary:   "#f4acb7",          // light pink text on dark
  priDim:    "#c47886",
  onSurf:    "#f5eaed",          // testo principale
  muted:     "#9a7480",          // testo secondario
  dim:       "#5a3d48",          // testo disabilitato
  green:     "#4ade80",
  greenDim:  "rgba(74,222,128,0.12)",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

const NAV = [
  { href: "/dashboard",             icon: "dashboard",   label: "Panoramica",     disabled: false },
  { href: "/dashboard/stats",       icon: "analytics",   label: "Statistiche",    disabled: true  },
  { href: "/dashboard/invitati",    icon: "group",       label: "Invitati",       disabled: true  },
  { href: "/dashboard/settings",    icon: "settings",    label: "Configurazione", disabled: true  },
  { href: "/dashboard/rivelazione", icon: "celebration", label: "Rivelazione",    disabled: true  },
] as const;

export default function Sidebar({ eventi, user }: SidebarProps) {
  const pathname = usePathname();
  const attivi   = eventi.filter((e) => e.stato !== "CONCLUSO");
  const initiali = (user.nome ?? user.email).slice(0, 2).toUpperCase();

  return (
    <aside
      style={{
        position: "fixed", left: 0, top: 0, height: "100vh", width: 256,
        background: S.bg, display: "flex", flexDirection: "column", zIndex: 50,
        borderRight: `1px solid ${S.border}`,
        fontFamily: VN,
      }}
    >

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: `1px solid ${S.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Logo mark con glow */}
          <div
            style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg, #f4acb7 0%, #874e58 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(244,172,183,0.35), 0 8px 16px rgba(135,78,88,0.4)",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 19, fontFamily: QS }}>F</span>
          </div>
          <div>
            <p style={{ fontSize: 19, fontWeight: 700, color: S.onSurf, fontFamily: QS, margin: 0, lineHeight: 1.1 }}>
              FantaParto
            </p>
            <p style={{ fontSize: 10, fontWeight: 600, color: S.muted, margin: "3px 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              La Gioiosa Attesa
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "10px", overflowY: "auto" }}>

        {/* Link principali */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(({ href, icon, label, disabled }) => {
            const isActive = !disabled && (
              href === "/dashboard"
                ? pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                : pathname.startsWith(href)
            );

            return (
              <Link
                key={href}
                href={disabled ? "#" : href}
                aria-disabled={disabled}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10,
                  textDecoration: "none", transition: "all 150ms",
                  background:    isActive ? "rgba(244,172,183,0.12)" : "transparent",
                  color:         isActive ? S.primary : disabled ? S.dim : S.muted,
                  pointerEvents: disabled ? "none" : "auto",
                  border:        isActive ? `1px solid rgba(244,172,183,0.18)` : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !disabled) {
                    e.currentTarget.style.background = S.surfHov;
                    e.currentTarget.style.color = S.onSurf;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !disabled) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = S.muted;
                  }
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, flexShrink: 0, color: isActive ? S.primary : "inherit" }}
                >
                  {icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, letterSpacing: "0.01em" }}>
                  {label}
                </span>
                {disabled && (
                  <span
                    style={{
                      marginLeft: "auto", fontSize: 9, fontWeight: 700,
                      color: S.dim, textTransform: "uppercase", letterSpacing: "0.05em",
                      border: `1px solid ${S.dim}`, borderRadius: 999, padding: "1px 6px",
                    }}
                  >
                    Presto
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Separatore eventi */}
        {attivi.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p
              style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", color: S.dim, padding: "0 12px",
                marginBottom: 8,
              }}
            >
              I tuoi FantaParto
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {attivi.map((ev) => {
                const isActive  = pathname.includes(ev.id);
                const giorni    = Math.max(0, Math.round(
                  (new Date(ev.dataPresuntaParto).getTime() - Date.now()) / 86_400_000,
                ));
                const nome = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a";

                return (
                  <Link
                    key={ev.id}
                    href={`/dashboard/${ev.id}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10,
                      textDecoration: "none", transition: "all 150ms",
                      background:    isActive ? "rgba(244,172,183,0.12)" : "transparent",
                      border:        isActive ? `1px solid rgba(244,172,183,0.18)` : "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = S.surfHov;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Dot verde pulsante */}
                    <div style={{ position: "relative", flexShrink: 0, width: 8, height: 8 }}>
                      <div
                        style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: S.green,
                          boxShadow: `0 0 6px ${S.green}`,
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? S.primary : S.onSurf, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {nome}
                      </p>
                      <p style={{ fontSize: 10, color: S.muted, margin: "1px 0 0" }}>
                        {giorni > 0 ? `${giorni}g al parto` : "🎉 Oggi!"}
                      </p>
                    </div>

                    {/* Giorni pill */}
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                        padding: "2px 7px", borderRadius: 999,
                        background: isActive ? "rgba(244,172,183,0.20)" : S.surface,
                        color: isActive ? S.primary : S.muted,
                      }}
                    >
                      -{giorni}g
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ── Bottom ────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "12px 12px 16px",
          borderTop: `1px solid ${S.border}`,
          display: "flex", flexDirection: "column", gap: 8,
        }}
      >
        {/* CTA Nuova Sfida */}
        <Link
          href="/dashboard/nuovo-evento"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, padding: "11px 16px", borderRadius: 12,
            textDecoration: "none", fontWeight: 700, fontSize: 14, fontFamily: VN,
            color: "#fff",
            background: "linear-gradient(135deg, #874e58 0%, #5e2d3a 100%)",
            boxShadow: "0 4px 16px rgba(135,78,88,0.45), inset 0 1px 0 rgba(255,255,255,0.10)",
            transition: "opacity 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <span style={{ fontSize: 16, fontWeight: 400 }}>+</span>
          Nuova Sfida
        </Link>

        {/* User card */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 12,
            background: S.surface, border: `1px solid ${S.border}`,
          }}
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt="avatar"
              style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, border: `2px solid ${S.border}` }}
            />
          ) : (
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #874e58, #5e2d3a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 900, color: "#fff",
                border: `2px solid rgba(244,172,183,0.25)`,
              }}
            >
              {initiali}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: S.onSurf, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.nome ?? user.email.split("@")[0]}
            </p>
            <p style={{ fontSize: 10, color: S.muted, margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Logout"
              style={{
                border: "none", background: "none", cursor: "pointer",
                color: S.muted, padding: 4, borderRadius: 8, flexShrink: 0,
                transition: "color 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = S.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = S.muted)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, display: "block" }}>
                logout
              </span>
            </button>
          </form>
        </div>
      </div>

    </aside>
  );
}
