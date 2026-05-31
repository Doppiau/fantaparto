interface BilanciaPesoProps {
  mediaPeso: number | null; // grammi
  minPeso: number;
  maxPeso: number;
  totVotiPeso: number;
}

export default function BilanciaPesoWidget({ mediaPeso, minPeso, maxPeso, totVotiPeso }: BilanciaPesoProps) {
  const rangeMin = 2000;
  const rangeMax = 5000;
  const valore = mediaPeso ?? 3200;
  const pct = Math.min(100, Math.max(0, ((valore - rangeMin) / (rangeMax - rangeMin)) * 100));

  // Angolo ago: da -130° a +130° (260° totali)
  const angolo = -130 + (pct / 100) * 260;

  return (
    <div className="fp-card p-5 flex flex-col gap-3">
      <p className="text-xs font-semibold text-[var(--ink-45)] uppercase tracking-widest">Bilancia Peso</p>

      {totVotiPeso === 0 ? (
        <p className="text-sm text-[var(--ink-45)]">Nessun voto peso ancora</p>
      ) : (
        <>
          {/* Semicircle gauge */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-40 h-20 overflow-visible">
              <svg viewBox="0 0 160 90" className="w-full h-full overflow-visible">
                {/* Track */}
                <path
                  d="M 14 80 A 66 66 0 0 1 146 80"
                  fill="none" stroke="#F0E7D6" strokeWidth="10" strokeLinecap="round"
                />
                {/* Fill */}
                <path
                  d="M 14 80 A 66 66 0 0 1 146 80"
                  fill="none"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 207} 207`}
                />
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFD166" />
                    <stop offset="100%" stopColor="#FF9F2F" />
                  </linearGradient>
                </defs>
                {/* Ago */}
                <g transform={`rotate(${angolo}, 80, 80)`}>
                  <line x1="80" y1="80" x2="80" y2="24" stroke="#FF9F2F" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="80" cy="80" r="6" fill="white" stroke="#FF9F2F" strokeWidth="2.5" />
                </g>
                {/* Labels */}
                <text x="10" y="90" fontSize="9" fill="rgba(44,44,46,0.45)" fontWeight="600">2,0</text>
                <text x="130" y="90" fontSize="9" fill="rgba(44,44,46,0.45)" fontWeight="600">5,0</text>
              </svg>
            </div>

            <div className="text-center">
              <span className="text-3xl font-black text-[var(--ink)]" style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}>
                {(valore / 1000).toFixed(2).replace(".", ",")}
              </span>
              <span className="text-sm font-medium text-[var(--ink-45)] ml-1">kg media</span>
            </div>
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-[var(--ink-45)] border-t border-[var(--border)] pt-3 mt-1">
            <div className="text-center">
              <p className="text-[var(--ink)] font-bold">{(minPeso / 1000).toFixed(2).replace(".", ",")} kg</p>
              <p>minimo</p>
            </div>
            <div className="text-center">
              <p className="text-[var(--ink)] font-bold">{totVotiPeso}</p>
              <p>voti peso</p>
            </div>
            <div className="text-center">
              <p className="text-[var(--ink)] font-bold">{(maxPeso / 1000).toFixed(2).replace(".", ",")} kg</p>
              <p>massimo</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
