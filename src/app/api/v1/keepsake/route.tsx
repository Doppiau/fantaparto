import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-request";
import { createClient } from "@/lib/supabase/server";
import { withCors, optionsResponse } from "@/lib/cors";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

async function getAuthUser(req: NextRequest): Promise<{ id: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const result = await getUserFromRequest(req);
    if (result && !("reason" in result)) return result;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { id: user.id };
  return null;
}

// ── Stili PDF ─────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    backgroundColor: "#fbf9f5",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#874e58",
    textAlign: "center",
    marginBottom: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0e8e6",
    marginVertical: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0e8e6",
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#a89a9b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statBox: {
    backgroundColor: "#fde8e6",
    borderRadius: 8,
    padding: "6 12",
    minWidth: 90,
  },
  statLabel: {
    fontSize: 9,
    color: "#a89a9b",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#874e58",
    marginTop: 2,
  },
  podioRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  podioBox: {
    flex: 1,
    backgroundColor: "#f9f5ef",
    borderRadius: 8,
    padding: "10 8",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0e8e6",
  },
  podioFirst: {
    backgroundColor: "rgba(255,209,102,0.2)",
    borderColor: "#FFD166",
  },
  podioMedal: {
    fontSize: 18,
    marginBottom: 4,
  },
  podioNome: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
    textAlign: "center",
  },
  podioPunti: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#874e58",
    marginTop: 2,
  },
  rigaClassifica: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f5ef",
  },
  rigaPos: {
    width: 24,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#a89a9b",
  },
  rigaNome: {
    flex: 1,
    fontSize: 11,
    color: "#1a1a2e",
  },
  rigaPunti: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#874e58",
  },
  messaggioBox: {
    backgroundColor: "#f9f5ef",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  messaggioTesto: {
    fontSize: 10,
    color: "#3a3a3a",
    fontStyle: "italic",
    lineHeight: 1.5,
  },
  messaggioFirma: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#a89a9b",
    marginTop: 4,
  },
  footer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#f0e8e6",
    paddingTop: 12,
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    color: "#b0a0a2",
    textAlign: "center",
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtData(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtPeso(g: number | null | undefined): string {
  if (!g) return "—";
  return `${(g / 1000).toFixed(3).replace(".", ",")} kg`;
}

function fmtLunghezza(mm: number | null | undefined): string {
  if (!mm) return "—";
  return `${(mm / 10).toFixed(1)} cm`;
}

function capelliLabel(v: string | null): string {
  if (!v) return "—";
  return v === "LISCI" ? "Lisci" : v === "RICCI" ? "Ricci" : "Calvo";
}

function occhiLabel(v: string | null): string {
  if (!v) return "—";
  return v === "CHIARI" ? "Chiari" : "Scuri";
}

// ── Documento PDF ─────────────────────────────────────────────────────────────

function KeesakePdf({ event, classifica, messaggi }: {
  event: {
    nomeBimbo: string | null;
    realeSesso: string | null;
    realeData: Date | null;
    realeOra: string | null;
    realePeso: number | null;
    realeLunghezza: number | null;
    realeCapelli: string | null;
    realeOcchi: string | null;
    dataAttiva: boolean;
    pesoAttivo: boolean;
    oraAttiva: boolean;
    lunghezzaAttiva: boolean;
    capelliAttivo: boolean;
    occhiAttivo: boolean;
  };
  classifica: Array<{ nomeInvitato: string; punteggioOttenuto: number | null }>;
  messaggi: Array<{ nomeInvitato: string; messaggioAugurio: string | null }>;
}) {
  const isFemmina = event.realeSesso === "FEMMINA";
  const nome = event.nomeBimbo ?? (isFemmina ? "La Piccola" : "Il Piccolo");
  const nascitaTitolo = isFemmina ? `${nome} è nata! 🩷` : `${nome} è nato! 💙`;

  const top3 = classifica.slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Document title={`FantaParto — ${nome}`} author="FantaParto">
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.emoji}>{isFemmina ? "🩷" : "💙"}</Text>
          <Text style={S.title}>{nascitaTitolo}</Text>
          <Text style={S.subtitle}>FantaParto · Classifica Finale</Text>
        </View>

        <View style={S.divider} />

        {/* Dati nascita */}
        <View style={S.card}>
          <Text style={S.cardTitle}>I dati reali</Text>
          <View style={S.row}>
            {event.realeSesso && (
              <View style={S.statBox}>
                <Text style={S.statLabel}>Sesso</Text>
                <Text style={S.statValue}>{isFemmina ? "Femmina" : "Maschio"}</Text>
              </View>
            )}
            {event.dataAttiva && event.realeData && (
              <View style={S.statBox}>
                <Text style={S.statLabel}>Data</Text>
                <Text style={S.statValue}>{fmtData(event.realeData)}</Text>
              </View>
            )}
            {event.oraAttiva && event.realeOra && (
              <View style={S.statBox}>
                <Text style={S.statLabel}>Ora</Text>
                <Text style={S.statValue}>{event.realeOra}</Text>
              </View>
            )}
            {event.pesoAttivo && event.realePeso && (
              <View style={S.statBox}>
                <Text style={S.statLabel}>Peso</Text>
                <Text style={S.statValue}>{fmtPeso(event.realePeso)}</Text>
              </View>
            )}
            {event.lunghezzaAttiva && event.realeLunghezza && (
              <View style={S.statBox}>
                <Text style={S.statLabel}>Lunghezza</Text>
                <Text style={S.statValue}>{fmtLunghezza(event.realeLunghezza)}</Text>
              </View>
            )}
            {event.capelliAttivo && event.realeCapelli && (
              <View style={S.statBox}>
                <Text style={S.statLabel}>Capelli</Text>
                <Text style={S.statValue}>{capelliLabel(event.realeCapelli)}</Text>
              </View>
            )}
            {event.occhiAttivo && event.realeOcchi && (
              <View style={S.statBox}>
                <Text style={S.statLabel}>Occhi</Text>
                <Text style={S.statValue}>{occhiLabel(event.realeOcchi)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Podio */}
        {top3.length >= 2 && (
          <View style={S.card}>
            <Text style={S.cardTitle}>🏆 Podio</Text>
            <View style={S.podioRow}>
              {[top3[1], top3[0], top3[2]].map((p, i) => {
                if (!p) return <View key={i} style={{ flex: 1 }} />;
                const realIdx = top3.indexOf(p);
                return (
                  <View key={p.nomeInvitato} style={[S.podioBox, realIdx === 0 ? S.podioFirst : {}]}>
                    <Text style={S.podioMedal}>{medals[realIdx]}</Text>
                    <Text style={S.podioNome}>{p.nomeInvitato}</Text>
                    <Text style={S.podioPunti}>{p.punteggioOttenuto ?? 0} pt</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Classifica completa */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Classifica completa ({classifica.length} partecipanti)</Text>
          {classifica.map((p, i) => (
            <View key={p.nomeInvitato + i} style={S.rigaClassifica}>
              <Text style={S.rigaPos}>{i + 1}</Text>
              <Text style={S.rigaNome}>{p.nomeInvitato}</Text>
              <Text style={S.rigaPunti}>{p.punteggioOttenuto ?? 0} pt</Text>
            </View>
          ))}
        </View>

        {/* Messaggi d'auguri */}
        {messaggi.length > 0 && (
          <View style={S.card}>
            <Text style={S.cardTitle}>💌 Messaggi di auguri</Text>
            {messaggi.slice(0, 8).map((m, i) => (
              <View key={i} style={S.messaggioBox}>
                <Text style={S.messaggioTesto}>&ldquo;{m.messaggioAugurio}&rdquo;</Text>
                <Text style={S.messaggioFirma}>— {m.nomeInvitato}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={S.footer}>
          <Text style={S.footerText}>FantaParto · fantaparto.com · Il fanta-gioco preferito delle mamme 🍼</Text>
        </View>

      </Page>
    </Document>
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser(req);
  const eventId = req.nextUrl.searchParams.get("eventId");
  const codice  = req.nextUrl.searchParams.get("codice");

  if (!eventId && !codice) {
    return withCors(NextResponse.json({ success: false, error: "Parametro eventId o codice richiesto" }, { status: 400 }));
  }

  // Ricerca per eventId (autenticata) o per codice (pubblica)
  const whereClause = eventId
    ? { id: eventId }
    : { codiceCondivisione: codice! };

  const event = await prisma.event.findFirst({
    where: whereClause,
    select: {
      id: true, nomeBimbo: true, stato: true, codiceCondivisione: true,
      userId: true,
      realeSesso: true, realeData: true, realeOra: true,
      realePeso: true, realeLunghezza: true, realeCapelli: true, realeOcchi: true,
      dataAttiva: true, pesoAttivo: true, oraAttiva: true,
      lunghezzaAttiva: true, capelliAttivo: true, occhiAttivo: true,
      predictions: {
        where: { punteggioOttenuto: { not: null } },
        orderBy: { punteggioOttenuto: "desc" },
        select: { nomeInvitato: true, punteggioOttenuto: true, messaggioAugurio: true },
      },
    },
  });

  if (!event) {
    return withCors(NextResponse.json({ success: false, error: "Evento non trovato" }, { status: 404 }));
  }

  // Se autenticato via eventId, verifica ownership
  if (eventId && user && event.userId !== user.id) {
    return withCors(NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 403 }));
  }

  if (event.stato !== "CONCLUSO") {
    return withCors(NextResponse.json({ success: false, error: "L'evento non è ancora concluso" }, { status: 400 }));
  }

  const messaggi = event.predictions.filter((p) => p.messaggioAugurio?.trim());

  const pdfBuffer = await renderToBuffer(
    <KeesakePdf
      event={event}
      classifica={event.predictions}
      messaggi={messaggi}
    />
  );

  const nomeBimbo = event.nomeBimbo ?? "FantaParto";
  const filename  = `FantaParto_${nomeBimbo.replace(/\s+/g, "_")}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
