"use client";

import { useState, useEffect } from "react";
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
  isPremium: boolean;
}
interface SidebarProps {
  eventi: EventoSidebar[];
  user:   UserSidebar;
}

// ── Dark theme tokens ─────────────────────────────────────────────────────────
const S = {
  bg:      "#18101a",
  surface: "#231520",
  surfHov: "#2c1c28",
  border:  "rgba(244,172,183,0.10)",
  primary: "#f4acb7",
  onSurf:  "#f5eaed",
  muted:   "#9a7480",
  dim:     "#5a3d48",
  green:   "#4ade80",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

const NAV = [
  { href: "/dashboard",             icon: "dashboard",   label: "Dashboard",         disabled: false },
  { href: "/dashboard/eventi",      icon: "event_list",  label: "I miei eventi",     disabled: false },
  { href: "/dashboard/stats",       icon: "analytics",   label: "Statistiche",       disabled: true  },
  { href: "/dashboard/invitati",    icon: "group",       label: "Partecipanti",      disabled: true  },
  { href: "/dashboard/settings",    icon: "settings",    label: "Impostazioni",      disabled: false },
  { href: "/dashboard/rivelazione", icon: "celebration", label: "Grande Giorno",     disabled: false },
  { href: "/dashboard/profilo",     icon: "manage_accounts", label: "Gestione Profilo", disabled: false },
] as const;

export default function Sidebar({ eventi, user }: SidebarProps) {
  const showProBanner = !user.isPremium;
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const attivi   = eventi.filter((e) => e.stato !== "CONCLUSO");
  const initiali = (user.nome ?? user.email).slice(0, 2).toUpperCase();
  const close    = () => setMobileOpen(false);

  // Chiudi automaticamente su mobile ad ogni cambio di rotta
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      {/* ── Hamburger (mobile only) ─────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Apri menu"
        className={`md:hidden ${mobileOpen ? "!hidden" : "flex"} items-center justify-center`}
        style={{
          position: "fixed", top: 12, left: 12, zIndex: 60,
          width: 40, height: 40, borderRadius: 10,
          background: S.bg, border: `1px solid ${S.border}`,
          cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        <span className="material-symbols-outlined" style={{ color: S.primary, fontSize: 22 }}>menu</span>
      </button>

      {/* ── Backdrop (mobile only, when open) ───────────────────────────── */}
      {mobileOpen && (
        <div
          onClick={close}
          className="md:hidden"
          style={{
            position: "fixed", inset: 0, zIndex: 45,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed left-0 top-0 h-screen flex flex-col z-50 w-64
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
        style={{
          background: S.bg,
          borderRight: `1px solid ${S.border}`,
          fontFamily: VN,
        }}
      >
        {/* ── Brand ──────────────────────────────────────────────────────── */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0, overflow: "hidden",
              background: "#fff",
              boxShadow: "0 0 16px rgba(244,172,183,0.25), 0 4px 12px rgba(0,0,0,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="FantaParto" width={40} height={40} style={{ display: "block" }} />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: S.onSurf, fontFamily: QS, margin: 0, lineHeight: 1.1 }}>
                FantaParto
              </p>
              <p style={{ fontSize: 9, fontWeight: 600, color: S.muted, margin: "2px 0 0", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                La Gioiosa Attesa
              </p>
            </div>
          </div>

          {/* Close button — mobile only */}
          <button
            onClick={close}
            className="md:hidden"
            style={{ border: "none", background: "none", cursor: "pointer", color: S.muted, padding: 4 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV.map(({ href, icon, label, disabled }) => {
              const otherHrefs = NAV.filter((n) => n.href !== "/dashboard").map((n) => n.href);
              const isActive = !disabled && (
                href === "/dashboard"
                  ? pathname === "/dashboard" ||
                    (pathname.startsWith("/dashboard/") && !otherHrefs.some((r) => pathname.startsWith(r)))
                  : pathname.startsWith(href)
              );
              return (
                <Link
                  key={href}
                  href={disabled ? "#" : href}
                  onClick={disabled ? undefined : close}
                  aria-disabled={disabled}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 10,
                    textDecoration: "none", transition: "all 150ms",
                    background:    isActive ? "rgba(244,172,183,0.12)" : "transparent",
                    color:         isActive ? S.primary : disabled ? S.dim : S.muted,
                    pointerEvents: disabled ? "none" : "auto",
                    border:        isActive ? "1px solid rgba(244,172,183,0.18)" : "1px solid transparent",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0, color: isActive ? S.primary : "inherit" }}>
                    {icon}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, letterSpacing: "0.01em", flex: 1 }}>
                    {label}
                  </span>
                  {disabled && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: S.dim, textTransform: "uppercase", letterSpacing: "0.05em", border: `1px solid ${S.dim}`, borderRadius: 999, padding: "1px 6px" }}>
                      Presto
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── I tuoi FantaParto ──────────────────────────────────────────── */}
          {attivi.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: S.dim, padding: "0 12px", marginBottom: 8 }}>
                I tuoi FantaParto
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {attivi.map((ev) => {
                  const isActive = pathname.includes(ev.id);
                  const giorni   = Math.max(0, Math.round((new Date(ev.dataPresuntaParto).getTime() - Date.now()) / 86_400_000));
                  const nome     = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a";
                  return (
                    <Link
                      key={ev.id}
                      href={`/dashboard/${ev.id}`}
                      onClick={close}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 10,
                        textDecoration: "none", transition: "all 150ms",
                        background:    isActive ? "rgba(244,172,183,0.12)" : "transparent",
                        border:        isActive ? "1px solid rgba(244,172,183,0.18)" : "1px solid transparent",
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: S.green, boxShadow: `0 0 6px ${S.green}`, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? S.primary : S.onSurf, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {nome}
                        </p>
                        <p style={{ fontSize: 10, color: S.muted, margin: "1px 0 0" }}>
                          {giorni > 0 ? `${giorni}g al parto` : "🎉 Oggi!"}
                        </p>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0, padding: "2px 7px", borderRadius: 999, background: isActive ? "rgba(244,172,183,0.20)" : S.surface, color: isActive ? S.primary : S.muted }}>
                        -{giorni}g
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* ── PRO Plan upsell ─────────────────────────────────────────────── */}
        {showProBanner && (
          <div style={{ margin: "0 10px 10px", padding: "14px 14px 12px", borderRadius: 14, background: "linear-gradient(135deg, #2d1a2e 0%, #1f1226 100%)", border: "1px solid rgba(244,172,183,0.18)" }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: S.primary, margin: "0 0 6px" }}>
              PRO PLAN
            </p>
            <p style={{ fontSize: 12, color: S.onSurf, lineHeight: 1.5, margin: "0 0 10px" }}>
              Sblocca funzioni illimitate per il tuo evento.
            </p>
            <Link
              href="/dashboard/profilo"
              onClick={close}
              style={{
                display: "block", textAlign: "center",
                fontSize: 12, fontWeight: 700, color: "#fff",
                background: "linear-gradient(135deg, #b5352c, #874e58)",
                borderRadius: 8, padding: "8px 12px",
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(135,78,88,0.35)",
              }}
            >
              Passa a Premium
            </Link>
          </div>
        )}

        {/* ── Bottom ──────────────────────────────────────────────────────── */}
        <div style={{ padding: "12px 12px 16px", borderTop: `1px solid ${S.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
          <Link
            href="/dashboard/nuovo-evento"
            onClick={close}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, padding: "11px 16px", borderRadius: 12,
              textDecoration: "none", fontWeight: 700, fontSize: 14, fontFamily: VN,
              color: "#fff",
              background: "linear-gradient(135deg, #874e58 0%, #5e2d3a 100%)",
              boxShadow: "0 4px 16px rgba(135,78,88,0.45), inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
          >
            <span style={{ fontSize: 16 }}>+</span>
            Nuova Sfida
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12, background: S.surface, border: `1px solid ${S.border}` }}>
            {/* Avatar + nome/email → link a /dashboard/profilo */}
            <Link
              href="/dashboard/profilo"
              onClick={close}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                flex: 1, minWidth: 0, textDecoration: "none",
                borderRadius: 8, padding: "2px 4px",
              }}
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="avatar" style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, border: `2px solid ${S.border}` }} />
              ) : (
                <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #874e58, #5e2d3a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", border: `2px solid rgba(244,172,183,0.20)` }}>
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
            </Link>

            {/* Logout */}
            <form action={logoutAction}>
              <button type="submit" title="Logout" style={{ border: "none", background: "none", cursor: "pointer", color: S.muted, padding: 4, borderRadius: 8, flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, display: "block" }}>logout</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
