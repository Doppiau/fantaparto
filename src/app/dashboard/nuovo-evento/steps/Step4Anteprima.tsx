"use client";

import { type NuovoEventoFormData } from "../types";

const C = {
  white:        "#ffffff",
  primary:      "#874e58",
  primaryFixed: "#ffd9de",
  primaryCont:  "#f4acb7",
  onPriCont:    "#733d47",
  secondary:    "#40627b",
  secCont:      "#bee1ff",
  onSecCont:    "#42647e",
  onSurf:       "#1b1c1a",
  onSurfVar:    "#514345",
  outlineVar:   "#d6c2c3",
  surfContLow:  "#f5f3ef",
  shadow:       "0px 12px 32px rgba(135,78,88,0.08)",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

const METRICHE_LABEL: Record<string, { emoji: string; nome: string }> = {
  sesso:     { emoji: "👶", nome: "Sesso" },
  data:      { emoji: "📅", nome: "Data" },
  peso:      { emoji: "⚖️", nome: "Peso" },
  ora:       { emoji: "🕐", nome: "Ora" },
  lunghezza: { emoji: "📏", nome: "Lunghezza" },
  capelli:   { emoji: "💇", nome: "Capelli" },
  occhi:     { emoji: "👁️", nome: "Occhi" },
};

// ── Riga riepilogo ────────────────────────────────────────────────────────────

function RigaRiepilogo({
  icona,
  label,
  valore,
  onModifica,
}: {
  icona: string;
  label: string;
  valore: React.ReactNode;
  onModifica: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: `1px solid ${C.surfContLow}` }}
    >
      <span className="text-[18px] flex-shrink-0 w-7">{icona}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.onSurfVar }}>
          {label}
        </p>
        <p className="text-[14px] font-semibold truncate" style={{ color: C.onSurf }}>
          {valore}
        </p>
      </div>
      <button
        onClick={onModifica}
        className="text-[12px] font-semibold flex-shrink-0 transition-opacity hover:opacity-70"
        style={{ color: C.primary, fontFamily: VN }}
      >
        Modifica
      </button>
    </div>
  );
}

// ── Preview simulata pagina /vota ─────────────────────────────────────────────

function VotaPreview({ data }: { data: NuovoEventoFormData }) {
  const attive = Object.entries(data.metriche)
    .filter(([, v]) => v)
    .map(([k]) => METRICHE_LABEL[k])
    .filter(Boolean);

  const SCALE = 0.62;
  const INNER_W = 420;

  return (
    <div
      className="overflow-hidden rounded-[1.5rem]"
      style={{
        border:  `2px solid ${C.outlineVar}`,
        height:  280,
        position:"relative",
      }}
    >
      <div
        style={{
          transform:       `scale(${SCALE})`,
          transformOrigin: "top left",
          width:           `${100 / SCALE}%`,
          pointerEvents:   "none",
          userSelect:      "none",
        }}
      >
        <div
          style={{
            width:      INNER_W,
            background: C.white,
            padding:    "24px 28px",
            fontFamily: VN,
          }}
        >
          {/* Header mini */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
              style={{ background: `linear-gradient(135deg, ${C.primaryCont}, ${C.primary})` }}
            >
              F
            </div>
            <span className="text-[11px] font-bold" style={{ color: C.primary, fontFamily: QS }}>
              FantaParto
            </span>
          </div>

          {/* Titolo */}
          <h3
            className="text-[18px] font-bold mb-1"
            style={{ fontFamily: QS, color: C.onSurf }}
          >
            Il FantaParto di {data.nomeMamma || "..."}
          </h3>
          <p className="text-[13px] mb-3" style={{ color: C.onSurfVar }}>
            Fai il tuo pronostico per {data.nomeFeto ? `Baby ${data.nomeFeto}` : "..."} !
          </p>

          {/* Messaggio */}
          {data.messaggioBenvenuto.trim() && (
            <p
              className="text-[12px] italic mb-4 px-3 py-2 rounded-[12px]"
              style={{
                color:      C.onSurfVar,
                background: C.surfContLow,
                borderLeft: `3px solid ${C.primaryCont}`,
              }}
            >
              &ldquo;{data.messaggioBenvenuto.slice(0, 80)}{data.messaggioBenvenuto.length > 80 ? "..." : ""}&rdquo;
            </p>
          )}

          {/* Badge metriche */}
          <div className="flex flex-wrap gap-2 mb-5">
            {attive.map((m) => (
              <span
                key={m.nome}
                className="rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{ background: C.primaryFixed, color: C.onPriCont }}
              >
                {m.emoji} {m.nome}
              </span>
            ))}
          </div>

          {/* Bottone finto */}
          <div
            className="w-full rounded-full py-3 text-center text-[13px] font-bold text-white"
            style={{ background: C.outlineVar }}
          >
            Vota ora →
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 4 ────────────────────────────────────────────────────────────────────

interface Props {
  data:        NuovoEventoFormData;
  onGoToStep:  (step: number) => void;
  onSubmit:    () => void;
  isLoading:   boolean;
  error:       string | null;
}

export default function Step4Anteprima({ data, onGoToStep }: Props) {
  // Formatta DPP in italiano
  const dppFormatted = data.dpp
    ? new Date(data.dpp).toLocaleDateString("it-IT", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  // Riepilogo metriche attive
  const metrAttive = Object.entries(data.metriche)
    .filter(([k, v]) => v && ["sesso","data","peso"].includes(k))
    .map(([k]) => METRICHE_LABEL[k]?.nome)
    .filter(Boolean);

  const metrPremium = Object.entries(data.metriche)
    .filter(([k, v]) => v && !["sesso","data","peso"].includes(k))
    .length;

  const metrLabel = [
    ...metrAttive,
    metrPremium > 0 ? `+${metrPremium}🔒` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col xl:flex-row gap-6">

      {/* ── Colonna sinistra — Riepilogo ─────────────────────────────── */}
      <div
        className="flex-1 rounded-[2rem] p-8 flex flex-col"
        style={{ background: C.white, boxShadow: C.shadow }}
      >
        <h2
          className="text-[24px] font-semibold mb-1"
          style={{ fontFamily: QS, color: C.onSurf }}
        >
          Tutto pronto! 🎉
        </h2>
        <p className="text-[14px] mb-5" style={{ color: C.onSurfVar }}>
          Controlla i dettagli prima di creare il tuo FantaParto.
        </p>

        <RigaRiepilogo icona="👶" label="Soprannome" valore={data.nomeFeto || "—"}       onModifica={() => onGoToStep(0)} />
        <RigaRiepilogo icona="📅" label="DPP"        valore={dppFormatted}                onModifica={() => onGoToStep(0)} />
        <RigaRiepilogo icona="👤" label="Il tuo nome" valore={data.nomeMamma || "—"}      onModifica={() => onGoToStep(0)} />
        <RigaRiepilogo icona="🎯" label="Pronostici"  valore={metrLabel || "—"}           onModifica={() => onGoToStep(1)} />
        <RigaRiepilogo
          icona="💌"
          label="Messaggio"
          valore={
            data.messaggioBenvenuto.trim()
              ? `"${data.messaggioBenvenuto.slice(0, 40)}${data.messaggioBenvenuto.length > 40 ? "..." : ""}"`
              : "Nessun messaggio"
          }
          onModifica={() => onGoToStep(2)}
        />
      </div>

      {/* ── Colonna destra — Preview ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3">
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: C.onSurfVar, fontFamily: VN }}
        >
          Anteprima pagina invitati
        </p>
        <VotaPreview data={data} />

        {/* Info note */}
        <p className="text-[12px] font-medium" style={{ color: C.outlineVar, fontFamily: VN }}>
          L&apos;anteprima è una simulazione semplificata. La pagina reale sarà ottimizzata per mobile.
        </p>
      </div>

    </div>
  );
}
