import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { EventiTable } from "./EventiTable";

export const dynamic = "force-dynamic";

async function fetchKpi() {
  const [totaleMamme, eventiAttivi, totaleVoti, viewsAggregate] =
    await Promise.all([
      prisma.user.count(),
      prisma.event.count({ where: { stato: "IN_CORSO" } }),
      prisma.prediction.count(),
      prisma.event.aggregate({ _sum: { visualizzazioniLink: true } }),
    ]);

  const totalViews = viewsAggregate._sum.visualizzazioniLink ?? 0;
  const conversionRate =
    totalViews > 0 ? ((totaleVoti / totalViews) * 100).toFixed(1) : "0.0";

  return { totaleMamme, eventiAttivi, totaleVoti, totalViews, conversionRate };
}

async function fetchEventi() {
  return prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nomeBimbo: true,
      codiceCondivisione: true,
      stato: true,
      isPremium: true,
      visualizzazioniLink: true,
      createdAt: true,
      user: { select: { nome: true, email: true } },
      _count: { select: { predictions: true } },
    },
  });
}

export default async function RegiaDashboard() {
  const admin = await requireAdmin();
  const [kpi, eventi] = await Promise.all([fetchKpi(), fetchEventi()]);

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

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <section style={gridStyle}>
        <KpiCard label="Mamme Iscritte" value={kpi.totaleMamme} icon="👩" />
        <KpiCard label="Eventi Attivi" value={kpi.eventiAttivi} icon="🟢" />
        <KpiCard label="Voti Totali" value={kpi.totaleVoti} icon="🗳️" />
        <KpiCard label="Views Totali" value={kpi.totalViews} icon="👁️" />
        <KpiCard label="Conversion Rate" value={`${kpi.conversionRate}%`} icon="📊" />
      </section>

      {/* ── Tabella Moderazione ─────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Moderazione Eventi</h2>
        <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 0.5rem" }}>
          {eventi.length} eventi totali — usa la ricerca per filtrare
        </p>
        <EventiTable eventi={eventi} />
      </section>
    </div>
  );
}

// ── Componente KPI Card ───────────────────────────────────────────────────────

function KpiCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div style={cardStyle}>
      <span style={{ fontSize: "1.75rem" }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "1.75rem", fontWeight: 700, color: "#f1f5f9", lineHeight: 1 }}>
          {value}
        </p>
      </div>
    </div>
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
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "2rem",
  paddingBottom: "1.5rem",
  borderBottom: "1px solid #1e293b",
};

const badgeStyle: React.CSSProperties = {
  padding: "4px 12px",
  borderRadius: 20,
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  background: "#7c3aed",
  color: "#ede9fe",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem",
  marginBottom: "2.5rem",
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "1.25rem 1.5rem",
};

const sectionStyle: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "1.5rem",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 0.25rem",
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "#f1f5f9",
};
