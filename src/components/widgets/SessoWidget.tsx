interface SessoWidgetProps {
  maschio: number;
  femmina: number;
  totale: number;
}

export default function SessoWidget({ maschio, femmina, totale }: SessoWidgetProps) {
  const pctM = totale > 0 ? Math.round((maschio / totale) * 100) : 50;
  const pctF = 100 - pctM;
  const mWin = pctM >= pctF;

  return (
    <div className="clay-card p-6 flex flex-col gap-4">
      <div>
        <h3
          className="font-extrabold text-xl text-[#2C2C2E]"
          style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
        >
          Pronostico Sesso
        </h3>
        <p className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.50)" }}>
          {totale === 0 ? "In attesa dei primi pronostici" : `${totale} voti ricevuti`}
        </p>
      </div>

      {/* Bubble arena */}
      <div
        className="relative flex items-center justify-around overflow-hidden rounded-3xl border-2 border-[#F1ECE4] p-4"
        style={{
          background: "#FDFBF7",
          minHeight: 180,
          boxShadow: "inset 4px 4px 10px rgba(44,44,46,0.04), inset -4px -4px 10px rgba(255,255,255,0.9)",
        }}
      >
        {/* Boy bubble */}
        <div
          className={`flex flex-col items-center justify-center rounded-full clay-sphere-boy text-[#3A7EAF] relative ${
            mWin ? "animate-float-1" : "animate-float-2"
          }`}
          style={{
            width: totale === 0 ? 72 : mWin ? 110 : 80,
            height: totale === 0 ? 72 : mWin ? 110 : 80,
            opacity: totale === 0 ? 0.22 : 1,
            transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <span style={{ fontSize: mWin ? 22 : 16 }}>👶</span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest mt-0.5">Maschio</span>
          {totale > 0 && (
            <span
              className="text-[11px] font-black"
              style={{ fontFamily: "var(--font-mono, monospace)" }}
            >
              {pctM}%
            </span>
          )}
          {totale > 0 && (
            <div
              className="absolute -top-1 -right-1 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white"
              style={{ background: "#4EA8DE" }}
            >
              {maschio}
            </div>
          )}
        </div>

        {/* Girl bubble */}
        <div
          className={`flex flex-col items-center justify-center rounded-full clay-sphere-girl text-[#D35790] relative ${
            !mWin ? "animate-float-2" : "animate-float-1"
          }`}
          style={{
            width: totale === 0 ? 90 : !mWin ? 110 : 80,
            height: totale === 0 ? 90 : !mWin ? 110 : 80,
            opacity: totale === 0 ? 0.22 : 1,
            transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <span style={{ fontSize: !mWin ? 24 : 16 }}>{totale > 0 && !mWin ? "👶🩷" : "👶"}</span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest mt-0.5">Femmina</span>
          {totale > 0 && (
            <span
              className="text-[11px] font-black"
              style={{ fontFamily: "var(--font-mono, monospace)" }}
            >
              {pctF}%
            </span>
          )}
          {totale > 0 && (
            <div
              className="absolute -top-2 -right-2 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white"
              style={{
                background: "#F296C2",
                animation: !mWin ? "gentle-float-2 2s ease-in-out infinite" : undefined,
              }}
            >
              {!mWin ? `★ ${femmina}` : femmina}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
