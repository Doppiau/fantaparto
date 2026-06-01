import { calcolaPunteggio, PUNTI_MAX, type RisultatiReali, type EventToggle } from "@/lib/scoring";

// ── Tipi ─────────────────────────────────────────────────────────────────────

interface Prediction {
  id:                string;
  nomeInvitato:      string;
  punteggioOttenuto: number | null;
  messaggioAugurio:  string | null;
  votoSesso:         string | null;
  votoData:          Date   | null;
  votoOra:           string | null;
  votoPeso:          number | null;
  votoLunghezza:     number | null;
  votoCapelli:       string | null;
  votoOcchi:         string | null;
}

interface EventoConcluso extends RisultatiReali, EventToggle {
  nomeBimbo: string | null;
}

interface Props {
  evento:      EventoConcluso;
  predictions: Prediction[];
}

// ── Helper ────────────────────────────────────────────────────────────────────

function formatData(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
}

function formatPeso(g: number | null | undefined): string {
  if (!g) return "—";
  return `${(g / 1000).toFixed(3).replace(".", ",")} kg`;
}

function formatLunghezza(mm: number | null | undefined): string {
  if (!mm) return "—";
  return `${(mm / 10).toFixed(1)} cm`;
}

// ── Componente principale ─────────────────────────────────────────────────────

export default function ClassificaView({ evento, predictions }: Props) {
  // Ordina per punteggio (usa punteggioOttenuto salvato in DB)
  const classifica = [...predictions]
    .map((p) => ({
      ...p,
      punteggio: p.punteggioOttenuto ?? 0,
      breakdown: calcolaPunteggio(evento, p, evento),
    }))
    .sort((a, b) => b.punteggio - a.punteggio);

  const messaggi = classifica.filter((p) => p.messaggioAugurio?.trim());
  const isFemmina = evento.realeSesso === "FEMMINA";
  const nomeBimbo = evento.nomeBimbo ?? (isFemmina ? "la piccola" : "il piccolo");

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--cream)" }}>
      <div className="max-w-lg mx-auto space-y-5">

        {/* ── Card nascita ──────────────────────────────────────────────── */}
        <div className="fp-card p-6 text-center space-y-4">
          <div className="text-5xl select-none">🎉</div>

          <div>
            <p
              className="text-2xl font-black"
              style={{ color: "var(--ink)", fontFamily: "var(--font-fredoka, sans-serif)" }}
            >
              {isFemmina ? `${nomeBimbo} è nata!` : `${nomeBimbo} è nato!`}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--ink-60)" }}>
              FantaParto · Classifica Finale
            </p>
          </div>

          {/* Chip sesso */}
          {evento.realeSesso && (
            <span
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-sm"
              style={{
                background: isFemmina ? "#FFE4EF" : "#E4EFFF",
                color:      isFemmina ? "#D63384" : "#1A56DB",
              }}
            >
              {isFemmina ? "🩷 Femmina" : "💙 Maschio"}
            </span>
          )}

          {/* Griglia stats */}
          <div className="grid grid-cols-2 gap-2 text-left mt-2">
            {evento.dataAttiva && evento.realeData && (
              <StatChip emoji="📅" label="Nata il" value={formatData(evento.realeData)} />
            )}
            {evento.oraAttiva && evento.realeOra && (
              <StatChip emoji="🕐" label="Ora" value={evento.realeOra} />
            )}
            {evento.pesoAttivo && evento.realePeso && (
              <StatChip emoji="⚖️" label="Peso" value={formatPeso(evento.realePeso)} />
            )}
            {evento.lunghezzaAttiva && evento.realeLunghezza && (
              <StatChip emoji="📏" label="Lunghezza" value={formatLunghezza(evento.realeLunghezza)} />
            )}
            {evento.capelliAttivo && evento.realeCapelli && (
              <StatChip emoji="✂️" label="Capelli" value={capelliLabel(evento.realeCapelli)} />
            )}
            {evento.occhiAttivo && evento.realeOcchi && (
              <StatChip emoji="👁️" label="Occhi" value={occhiLabel(evento.realeOcchi)} />
            )}
          </div>
        </div>

        {/* ── Card classifica ────────────────────────────────────────────── */}
        <div className="fp-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-black"
              style={{ color: "var(--ink)", fontFamily: "var(--font-fredoka, sans-serif)" }}
            >
              🏆 Classifica Finale
            </h2>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: "#F1ECE4", color: "var(--ink-60)" }}
            >
              {classifica.length} partecipanti
            </span>
          </div>

          {classifica.length === 0 ? (
            <p className="text-center text-sm py-4" style={{ color: "var(--ink-60)" }}>
              Nessun pronostico disponibile.
            </p>
          ) : (
            <>
              {/* Podio top 3 */}
              {classifica.length >= 2 && (
                <Podio top3={classifica.slice(0, 3)} />
              )}

              {/* Lista completa */}
              <div className="space-y-2 pt-2">
                {classifica.map((p, idx) => (
                  <RigaClassifica
                    key={p.id}
                    posizione={idx + 1}
                    nome={p.nomeInvitato}
                    punteggio={p.punteggio}
                    sessoCorretto={
                      evento.sessoAttivo && evento.realeSesso && p.votoSesso
                        ? p.votoSesso === evento.realeSesso
                        : null
                    }
                    isFemmina={isFemmina}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Card messaggi ──────────────────────────────────────────────── */}
        {messaggi.length > 0 && (
          <div className="fp-card p-6 space-y-4">
            <h2
              className="text-lg font-black"
              style={{ color: "var(--ink)", fontFamily: "var(--font-fredoka, sans-serif)" }}
            >
              💌 Messaggi di Auguri
            </h2>
            <div className="space-y-3">
              {messaggi.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl p-4"
                  style={{ background: "#F9F5EF", border: "1px solid #F1ECE4" }}
                >
                  <p className="text-sm" style={{ color: "var(--ink)" }}>
                    &ldquo;{p.messaggioAugurio}&rdquo;
                  </p>
                  <p className="text-xs font-bold mt-2" style={{ color: "var(--ink-60)" }}>
                    — {p.nomeInvitato}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs pb-4 font-semibold" style={{ color: "rgba(44,44,46,0.30)" }}>
          FantaParto · Il fanta-gioco preferito delle mamme 🍼
        </p>

      </div>
    </div>
  );
}

// ── Sub-componenti ────────────────────────────────────────────────────────────

function StatChip({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: "#F9F5EF", border: "1px solid #F1ECE4" }}
    >
      <span className="text-base">{emoji}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-60)" }}>
          {label}
        </p>
        <p className="text-sm font-black" style={{ color: "var(--ink)" }}>{value}</p>
      </div>
    </div>
  );
}

function Podio({ top3 }: { top3: Array<{ id: string; nomeInvitato: string; punteggio: number }> }) {
  const [secondo, primo, terzo] = [top3[1], top3[0], top3[2]];
  const medals   = ["🥇", "🥈", "🥉"];
  const ordered  = [secondo, primo, terzo];
  const heights  = [88, 112, 72]; // px

  return (
    <div className="flex items-end justify-center gap-3 pt-8 pb-2">
      {ordered.map((winner, visualIdx) => {
        if (!winner) return <div key={visualIdx} className="flex-1" />;
        const realIdx = top3.indexOf(winner);
        const isFirst = realIdx === 0;
        return (
          <div
            key={winner.id}
            className="flex-1 flex flex-col items-center justify-end gap-2 rounded-2xl px-2 py-3 relative"
            style={{
              height: heights[visualIdx],
              background: isFirst
                ? "linear-gradient(180deg, rgba(255,209,102,0.18), #FDFBF7)"
                : "#F9F5EF",
              border: isFirst ? "2px solid #FFD166" : "1px solid #F1ECE4",
              boxShadow: isFirst ? "0 6px 24px rgba(255,209,102,0.25)" : "none",
            }}
          >
            <div
              className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full text-lg border-4 border-white"
              style={{
                width:      isFirst ? 48 : 36,
                height:     isFirst ? 48 : 36,
                background: isFirst ? "#FFD166" : "#F1ECE4",
              }}
            >
              {medals[realIdx]}
            </div>
            <span
              className="text-xs font-black text-center leading-tight truncate w-full text-center px-1"
              style={{ color: "var(--ink)" }}
            >
              {winner.nomeInvitato}
            </span>
            <span
              className="text-xs font-black"
              style={{ color: "#FF6B6B", fontFamily: "var(--font-mono, monospace)" }}
            >
              {winner.punteggio} pt
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RigaClassifica({
  posizione,
  nome,
  punteggio,
  sessoCorretto,
  isFemmina,
}: {
  posizione:    number;
  nome:         string;
  punteggio:    number;
  sessoCorretto: boolean | null;
  isFemmina:    boolean;
}) {
  const barWidth = `${Math.round((punteggio / PUNTI_MAX) * 100)}%`;
  const isPodio  = posizione <= 3;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{
        background: isPodio ? "#F9F5EF" : "transparent",
        border:     isPodio ? "1px solid #F1ECE4" : "none",
      }}
    >
      {/* Posizione */}
      <span
        className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-black shrink-0"
        style={{
          background: posizione === 1 ? "#FFD166"
                    : posizione === 2 ? "#E2E8F0"
                    : posizione === 3 ? "#FDDCB5"
                    : "transparent",
          color: posizione <= 3 ? "#2C2C2E" : "var(--ink-60)",
        }}
      >
        {posizione <= 3 ? ["🥇","🥈","🥉"][posizione - 1] : posizione}
      </span>

      {/* Nome + sesso */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold truncate" style={{ color: "var(--ink)" }}>
            {nome}
          </span>
          {sessoCorretto !== null && (
            <span className="text-xs">
              {sessoCorretto ? (isFemmina ? "🩷" : "💙") : "❌"}
            </span>
          )}
        </div>
        {/* Score bar */}
        <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#F1ECE4" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: barWidth, background: posizione === 1 ? "#FFD166" : "#FF6B6B" }}
          />
        </div>
      </div>

      {/* Punti */}
      <span
        className="text-sm font-black shrink-0"
        style={{ color: "#FF6B6B", fontFamily: "var(--font-mono, monospace)", minWidth: 44, textAlign: "right" }}
      >
        {punteggio} pt
      </span>
    </div>
  );
}

// ── Label helpers ─────────────────────────────────────────────────────────────

function capelliLabel(v: string): string {
  return v === "LISCI" ? "Lisci" : v === "RICCI" ? "Ricci" : "Calvo";
}

function occhiLabel(v: string): string {
  return v === "CHIARI" ? "Chiari" : "Scuri";
}
