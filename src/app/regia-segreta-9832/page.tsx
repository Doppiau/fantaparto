import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { EventiTable } from "./EventiTable";
import { UsersTable } from "./UsersTable";
import { AuditLogSection } from "./AuditLogSection";
import { IpBanConsole } from "./IpBanConsole";
import { fetchBannedIpsAction } from "./actions";

export const dynamic = "force-dynamic";

async function fetchKpi() {
  const [
    totaleMamme, premiumUtenti, eventiAttivi,
    totaleVoti, viewsAggregate,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPremium: true } }),
    prisma.event.count({ where: { stato: "IN_CORSO" } }),
    prisma.prediction.count(),
    prisma.event.aggregate({ _sum: { visualizzazioniLink: true } }),
  ]);

  const totalViews    = viewsAggregate._sum.visualizzazioniLink ?? 0;
  const conversionRate = totalViews > 0
    ? ((totaleVoti / totalViews) * 100).toFixed(1)
    : "0.0";

  return { totaleMamme, premiumUtenti, eventiAttivi, totaleVoti, totalViews, conversionRate };
}

async function fetchEventi() {
  return prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, nomeBimbo: true, codiceCondivisione: true,
      stato: true, isPremium: true, visualizzazioniLink: true, createdAt: true,
      user: { select: { nome: true, email: true } },
      _count: { select: { predictions: true } },
    },
  });
}

async function fetchUtenti() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, nome: true, isPremium: true, createdAt: true,
      _count: { select: { events: true } },
      events: { select: { isPremium: true, _count: { select: { predictions: true } } } },
    },
  });
}

async function fetchAuditLog() {
  return prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 100,
  });
}

export default async function RegiaDashboard() {
  const admin = await requireAdmin();
  const [kpi, eventi, utenti, auditLogs, bannedIpsResult] = await Promise.all([
    fetchKpi(), fetchEventi(), fetchUtenti(), fetchAuditLog(),
    fetchBannedIpsAction(),
  ]);
  const bannedIps = bannedIpsResult.ips ?? [];

  const premiumEventi = eventi.filter((e) => e.isPremium).length;

  return (
    <div style={pageStyle}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9" }}>
            🎬 Regia — FantaParto
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#475569" }}>
            Dashboard di controllo globale · {admin.email}
          </p>
        </div>
        <span style={badgeStyle}>ADMIN</span>
      </header>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <section style={gridStyle}>
        <KpiCard label="Iscritti Totali"   value={kpi.totaleMamme}    icon="👩"  accent="#38bdf8" />
        <KpiCard label="Utenti Premium"    value={kpi.premiumUtenti}  icon="⭐"  accent="#a78bfa" />
        <KpiCard label="Events Premium"    value={premiumEventi}      icon="💎"  accent="#a78bfa" />
        <KpiCard label="Eventi Attivi"     value={kpi.eventiAttivi}   icon="🟢"  accent="#22c55e" />
        <KpiCard label="Pronostici"        value={kpi.totaleVoti}     icon="🗳️"  accent="#f59e0b" />
        <KpiCard label="Views Totali"      value={kpi.totalViews}     icon="👁️"  accent="#64748b" />
        <KpiCard label="Conversion Rate"   value={`${kpi.conversionRate}%`} icon="📊" accent="#34d399" />
        <KpiCard label="Scrapbook Cartacei" value="—"                 icon="📦"  accent="#f87171" sub="prossimamente" />
      </section>

      {/* ── Anagrafica Utenti ───────────────────────────────────────────────── */}
      <section style={{ ...sectionStyle, marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h2 style={sectionTitle}>Anagrafica Utenti</h2>
            <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "2px 0 0" }}>
              {utenti.length} utenti registrati · {kpi.premiumUtenti} Premium
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Pill color="#a78bfa">{kpi.premiumUtenti} Premium</Pill>
            <Pill color="#64748b">{utenti.length - kpi.premiumUtenti} Free</Pill>
          </div>
        </div>
        <UsersTable utenti={utenti} />
      </section>

      {/* ── Moderazione Eventi ──────────────────────────────────────────────── */}
      <section style={{ ...sectionStyle, marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h2 style={sectionTitle}>Moderazione Eventi</h2>
            <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "2px 0 0" }}>
              {eventi.length} eventi totali — usa la ricerca per filtrare
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Pill color="#22c55e">{eventi.filter(e => e.stato === "IN_CORSO").length} attivi</Pill>
            <Pill color="#64748b">{eventi.filter(e => e.stato === "CONCLUSO").length} conclusi</Pill>
          </div>
        </div>
        <EventiTable eventi={eventi} />
      </section>

      {/* ── IP Ban Console ──────────────────────────────────────────────────── */}
      <section style={{ ...sectionStyle, marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h2 style={sectionTitle}>🛡️ IP Ban Console</h2>
            <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "2px 0 0" }}>
              Blacklist Redis in tempo reale · {bannedIps.length} IP bannati
            </p>
          </div>
          <Pill color="#ef4444">{bannedIps.length} bannati</Pill>
        </div>
        <IpBanConsole initialIps={bannedIps} />
      </section>

      {/* ── Audit Log ───────────────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h2 style={sectionTitle}>Audit Log</h2>
            <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "2px 0 0" }}>
              Registro immutabile delle operazioni admin · ultimi {auditLogs.length} eventi
            </p>
          </div>
          <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>🔒 READ-ONLY</span>
        </div>
        <AuditLogSection logs={auditLogs} />
      </section>
    </div>
  );
}

// ── Componenti ────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon, accent, sub,
}: { label: string; value: string | number; icon: string; accent: string; sub?: string }) {
  return (
    <div style={{ ...cardStyle, borderColor: accent + "22" }}>
      <span style={{ fontSize: "1.6rem" }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: "1.6rem", fontWeight: 800, color: accent, lineHeight: 1 }}>
          {value}
        </p>
        {sub && <p style={{ margin: "2px 0 0", fontSize: "0.65rem", color: "#475569" }}>{sub}</p>}
      </div>
    </div>
  );
}

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: color + "22", color, border: `1px solid ${color}33`,
    }}>
      {children}
    </span>
  );
}

// ── Stili ─────────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#020617",
  color: "#cbd5e1",
  fontFamily: "system-ui, -apple-system, sans-serif",
  padding: "2rem",
  maxWidth: "1400px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid #1e293b",
};

const badgeStyle: React.CSSProperties = {
  padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem",
  fontWeight: 700, letterSpacing: "0.1em", background: "#7c3aed", color: "#ede9fe",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "1rem",
  marginBottom: "2rem",
};

const cardStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "1rem",
  background: "#0f172a", border: "1px solid #1e293b",
  borderRadius: "12px", padding: "1rem 1.25rem",
};

const sectionStyle: React.CSSProperties = {
  background: "#0f172a", border: "1px solid #1e293b",
  borderRadius: "12px", padding: "1.5rem",
};

const sectionTitle: React.CSSProperties = {
  margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#f1f5f9",
};
