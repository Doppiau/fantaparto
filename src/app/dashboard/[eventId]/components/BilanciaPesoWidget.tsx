interface BilanciaPesoProps {
  mediaPeso: number | null; // grammi
  minPeso: number;
  maxPeso: number;
  totVotiPeso: number;
}

export default function BilanciaPesoWidget({
  mediaPeso,
  minPeso,
  maxPeso,
  totVotiPeso,
}: BilanciaPesoProps) {
  // Range visualizzato: 2,0 kg – 5,5 kg
  const RANGE_MIN = 2000;
  const RANGE_MAX = 5500;
  const valore = mediaPeso ?? 3500;
  const pct = Math.min(1, Math.max(0, (valore - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)));

  // Parametri SVG semicerchio
  const R = 66;
  const CX = 80;
  const CY = 80;
  const semiCirc = Math.PI * R; // ≈ 207.3

  // Angolo ago: da -130° (sinistra) a +130° (destra) = range 260°
  const needleAngle = -130 + pct * 260;

  return (
    <div className="fp-card-tinted-warm relative overflow-hidden p-5 flex flex-col gap-3">
      {/* Glow decorativo */}
      <div
        className="pointer-events-none absolute -bottom-8 -right-8 w-32 h-32 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.14), transparent 70%)",
        }}
      />

      <p
        className="relative z-10 text-[11px] font-bold uppercase tracking-[0.1em]"
        style={{ color: "rgba(44,44,46,0.42)" }}
      >
        Bilancia Media
      </p>

      {totVotiPeso === 0 ? (
        /* Stato vuoto */
        <div className="relative z-10 flex flex-col items-center justify-center py-5 gap-2">
          <span className="text-4xl opacity-30">⚖️</span>
          <p
            className="text-[11px] font-medium text-center"
            style={{ color: "rgba(44,44,46,0.40)" }}
          >
            Nessun voto<br />peso ancora
          </p>
        </div>
      ) : (
        <>
          {/* ── Gauge SVG ── */}
          <div className="relative z-10 flex justify-center -mx-1">
            <svg
              viewBox="0 0 160 94"
              className="w-[168px] h-[88px] overflow-visible"
              aria-label={`Media peso: ${(valore / 1000).toFixed(2)} kg`}
            >
              <defs>
                <linearGradient id="gaugeGradPremium" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#C08A3E" />
                </linearGradient>
              </defs>

              {/* Track di sfondo */}
              <path
                d={`M 14 ${CY} A ${R} ${R} 0 0 1 146 ${CY}`}
                fill="none"
                stroke="#E8DFD0"
                strokeWidth="11"
                strokeLinecap="round"
              />

              {/* Riempimento colorato */}
              {pct > 0.01 && (
                <path
                  d={`M 14 ${CY} A ${R} ${R} 0 0 1 146 ${CY}`}
                  fill="none"
                  stroke="url(#gaugeGradPremium)"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={`${pct * semiCirc} ${semiCirc}`}
                  strokeDashoffset="0"
                />
              )}

              {/* Ago */}
              <g transform={`rotate(${needleAngle}, ${CX}, ${CY})`}>
                {/* Corpo ago */}
                <line
                  x1={CX}
                  y1={CY}
                  x2={CX}
                  y2={CY - R + 16}
                  stroke="#C08A3E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Punta ago */}
                <circle cx={CX} cy={CY - R + 16} r="3" fill="#D4AF37" />
              </g>

              {/* Perno centrale */}
              <circle
                cx={CX}
                cy={CY}
                r="6"
                fill="white"
                stroke="#D4AF37"
                strokeWidth="2.5"
              />

              {/* Etichette scala */}
              <text
                x="8"
                y="90"
                fontSize="8"
                fill="rgba(44,44,46,0.38)"
                fontWeight="700"
                fontFamily="var(--font-jakarta, sans-serif)"
              >
                2,0
              </text>
              <text
                x="128"
                y="90"
                fontSize="8"
                fill="rgba(44,44,46,0.38)"
                fontWeight="700"
                fontFamily="var(--font-jakarta, sans-serif)"
              >
                5,5
              </text>
            </svg>
          </div>

          {/* Valore principale */}
          <div className="relative z-10 text-center -mt-1">
            <div className="flex items-baseline justify-center gap-1">
              <span
                className="text-[30px] font-black text-[var(--ink)] leading-none"
                style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
              >
                {(valore / 1000).toFixed(2).replace(".", ",")}
              </span>
              <span
                className="text-[13px] font-semibold"
                style={{ color: "rgba(44,44,46,0.50)" }}
              >
                kg
              </span>
            </div>
            <p
              className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
              style={{ color: "rgba(44,44,46,0.38)" }}
            >
              media della giuria
            </p>
          </div>

          {/* Min / voti / Max */}
          <div
            className="relative z-10 flex justify-between pt-3 border-t"
            style={{ borderColor: "#EDE4D8" }}
          >
            <div className="text-center">
              <p className="text-[14px] font-black text-[var(--ink)] tabular-nums">
                {(minPeso / 1000).toFixed(2).replace(".", ",")}
              </p>
              <p
                className="text-[9px] font-bold uppercase tracking-wide mt-0.5"
                style={{ color: "rgba(44,44,46,0.38)" }}
              >
                min kg
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-[14px] font-black tabular-nums"
                style={{ color: "#D4AF37" }}
              >
                {totVotiPeso}
              </p>
              <p
                className="text-[9px] font-bold uppercase tracking-wide mt-0.5"
                style={{ color: "rgba(44,44,46,0.38)" }}
              >
                voti
              </p>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-black text-[var(--ink)] tabular-nums">
                {(maxPeso / 1000).toFixed(2).replace(".", ",")}
              </p>
              <p
                className="text-[9px] font-bold uppercase tracking-wide mt-0.5"
                style={{ color: "rgba(44,44,46,0.38)" }}
              >
                max kg
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
