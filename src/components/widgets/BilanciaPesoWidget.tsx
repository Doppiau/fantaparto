interface BilanciaPesoProps {
  mediaPeso: number | null;
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
  const RANGE_MIN = 2500;
  const RANGE_MAX = 4500;
  const valore = mediaPeso ?? 3380;
  const pct = Math.min(100, Math.max(0, ((valore - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100));

  return (
    <div className="clay-card p-6 flex flex-col gap-4">
      <div>
        <h3
          className="font-extrabold text-xl text-[#2C2C2E]"
          style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
        >
          Scommessa Peso
        </h3>
        <p className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.50)" }}>
          Media aggregata di tutti i pronostici
        </p>
      </div>

      <div className="clay-inset-panel p-4 flex flex-col items-center gap-4">
        {totVotiPeso === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <span className="text-4xl" style={{ opacity: 0.28 }}>⚖️</span>
            <p
              className="text-xs font-semibold text-center"
              style={{ color: "rgba(44,44,46,0.40)" }}
            >
              Nessun voto peso ancora
            </p>
          </div>
        ) : (
          <>
            {/* Value display */}
            <div className="text-center">
              <span
                className="text-[9px] font-extrabold uppercase tracking-widest block mb-1"
                style={{ color: "rgba(44,44,46,0.40)" }}
              >
                Peso Medio
              </span>
              <span
                className="text-3xl font-black"
                style={{ color: "#FF6B6B", fontFamily: "var(--font-mono, monospace)" }}
              >
                {(valore / 1000).toFixed(2).replace(".", ",")}
                <span
                  className="text-sm font-bold ml-1"
                  style={{ color: "rgba(44,44,46,0.45)" }}
                >
                  kg
                </span>
              </span>
            </div>

            {/* Linear gauge bar */}
            <div className="w-full space-y-2">
              <div
                className="relative h-8 rounded-xl overflow-hidden flex items-center justify-between px-3 text-[10px] font-bold"
                style={{
                  background: "#F1ECE4",
                  boxShadow: "inset 0 2px 6px rgba(44,44,46,0.08)",
                  fontFamily: "var(--font-mono, monospace)",
                  color: "rgba(44,44,46,0.42)",
                }}
              >
                <span>2,5</span>
                <span>3,0</span>
                <span
                  className="px-1 rounded font-extrabold"
                  style={{ color: "#FF6B6B", background: "rgba(255,255,255,0.65)" }}
                >
                  {(valore / 1000).toFixed(2).replace(".", ",")}
                </span>
                <span>4,0</span>
                <span>4,5</span>
                {/* Position marker */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 rounded-full"
                  style={{
                    left: `${pct}%`,
                    background: "#FF6B6B",
                    boxShadow: "0 0 6px rgba(255,107,107,0.6)",
                  }}
                />
              </div>
              <p
                className="text-[9px] text-center font-bold"
                style={{ color: "rgba(44,44,46,0.38)" }}
              >
                Min: {(minPeso / 1000).toFixed(2).replace(".", ",")} kg &bull; Max: {(maxPeso / 1000).toFixed(2).replace(".", ",")} kg
              </p>
            </div>

            {/* Stats row */}
            <div
              className="w-full flex justify-between pt-3 border-t"
              style={{ borderColor: "#EDE4D8" }}
            >
              <div className="text-center">
                <p
                  className="text-[14px] font-black text-[#2C2C2E] tabular-nums"
                  style={{ fontFamily: "var(--font-mono, monospace)" }}
                >
                  {(minPeso / 1000).toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "rgba(44,44,46,0.38)" }}>
                  min kg
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-[14px] font-black tabular-nums"
                  style={{ color: "var(--salmon)", fontFamily: "var(--font-mono, monospace)" }}
                >
                  {totVotiPeso}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "rgba(44,44,46,0.38)" }}>
                  voti
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-[14px] font-black text-[#2C2C2E] tabular-nums"
                  style={{ fontFamily: "var(--font-mono, monospace)" }}
                >
                  {(maxPeso / 1000).toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "rgba(44,44,46,0.38)" }}>
                  max kg
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
