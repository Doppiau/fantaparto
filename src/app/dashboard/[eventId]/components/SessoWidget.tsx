interface SessoWidgetProps {
  maschio: number;
  femmina: number;
  totale: number;
}

export default function SessoWidget({ maschio, femmina, totale }: SessoWidgetProps) {
  const pctM = totale > 0 ? Math.round((maschio / totale) * 100) : 50;
  const pctF = 100 - pctM;
  const mWin = pctM >= pctF;

  const sizeWin = 112;
  const sizeLose = 80;

  return (
    <div className="fp-card p-5 flex flex-col gap-3 overflow-hidden relative">
      {/* sfondo blob decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-[#F296C2] opacity-10 blur-2xl" />
        <div className="absolute -left-10 -top-10 w-32 h-32 rounded-full bg-[#6FA8DC] opacity-10 blur-2xl" />
      </div>

      <p className="text-xs font-semibold text-[var(--ink-45)] uppercase tracking-widest relative z-10">
        Totosesso
      </p>

      {totale === 0 ? (
        <p className="text-sm text-[var(--ink-45)] relative z-10">Nessun voto ancora</p>
      ) : (
        <div className="relative z-10 flex items-end gap-3 h-32">
          {/* Maschio */}
          <div className="flex flex-col items-center gap-1" style={{ order: mWin ? 1 : 2 }}>
            <div
              className="rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg transition-all duration-500"
              style={{
                width: mWin ? sizeWin : sizeLose,
                height: mWin ? sizeWin : sizeLose,
                background: "radial-gradient(circle at 32% 28%, #8FC0EC, #6FA8DC)",
                boxShadow: mWin ? "0 12px 28px -8px rgba(111,168,220,0.5)" : "0 8px 18px -8px rgba(111,168,220,0.3)",
              }}
            >
              <span style={{ fontSize: mWin ? 24 : 18 }}>{pctM}%</span>
              <span style={{ fontSize: 11, opacity: 0.9 }}>Maschio</span>
            </div>
            <span className="text-[11px] font-semibold text-[#6FA8DC]">{maschio} voti</span>
          </div>

          {/* Femmina */}
          <div className="flex flex-col items-center gap-1" style={{ order: mWin ? 2 : 1 }}>
            <div
              className="rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg transition-all duration-500"
              style={{
                width: mWin ? sizeLose : sizeWin,
                height: mWin ? sizeLose : sizeWin,
                background: "radial-gradient(circle at 32% 28%, #F8B4D4, #F296C2)",
                boxShadow: mWin ? "0 8px 18px -8px rgba(242,150,194,0.3)" : "0 12px 28px -8px rgba(242,150,194,0.5)",
              }}
            >
              <span style={{ fontSize: mWin ? 18 : 24 }}>{pctF}%</span>
              <span style={{ fontSize: 11, opacity: 0.9 }}>Femmina</span>
            </div>
            <span className="text-[11px] font-semibold text-[#F296C2]">{femmina} voti</span>
          </div>
        </div>
      )}
    </div>
  );
}
