interface SessoWidgetProps {
  maschio: number;
  femmina: number;
  totale: number;
}

export default function SessoWidget({ maschio, femmina, totale }: SessoWidgetProps) {
  const pctM = totale > 0 ? Math.round((maschio / totale) * 100) : 50;
  const pctF = 100 - pctM;
  const mWin = pctM > pctF;
  const tie = pctM === pctF;

  const BIG = 110;
  const SMALL = 74;

  return (
    <div
      className="fp-card-tinted-blue relative overflow-hidden p-5 flex flex-col gap-3"
    >
      {/* Ambient blobs */}
      <div
        className="pointer-events-none absolute -right-10 -bottom-10 w-36 h-36 rounded-full"
        style={{ background: "rgba(242,150,194,0.14)", filter: "blur(18px)" }}
      />
      <div
        className="pointer-events-none absolute -left-10 -top-10 w-32 h-32 rounded-full"
        style={{ background: "rgba(111,168,220,0.14)", filter: "blur(18px)" }}
      />

      <p
        className="relative z-10 text-[11px] font-bold uppercase tracking-[0.1em]"
        style={{ color: "rgba(44,44,46,0.42)" }}
      >
        Totosesso
      </p>

      {totale === 0 ? (
        /* Stato vuoto */
        <div className="relative z-10 flex flex-col items-center justify-center py-3 gap-3">
          <div className="flex items-end gap-2">
            <div
              className="w-[68px] h-[68px] rounded-full opacity-25"
              style={{
                background: "radial-gradient(circle at 32% 28%, #8FC0EC, #6FA8DC)",
              }}
            />
            <div
              className="w-[50px] h-[50px] rounded-full opacity-25 mb-1"
              style={{
                background: "radial-gradient(circle at 32% 28%, #F8B4D4, #F296C2)",
              }}
            />
          </div>
          <p
            className="text-xs font-semibold text-center"
            style={{ color: "rgba(44,44,46,0.40)" }}
          >
            Nessun voto ancora
          </p>
        </div>
      ) : (
        /* Bolle animate */
        <div className="relative z-10 flex items-end justify-center gap-3 h-[130px]">
          {/* ── Maschio ── */}
          <div
            className="flex flex-col items-center gap-1.5"
            style={{ order: mWin ? 1 : 2 }}
          >
            <div
              className="rounded-full flex flex-col items-center justify-center text-white font-bold"
              style={{
                width: mWin || tie ? BIG : SMALL,
                height: mWin || tie ? BIG : SMALL,
                background:
                  "radial-gradient(circle at 32% 28%, #8FC0EC 0%, #6FA8DC 100%)",
                boxShadow: mWin
                  ? "0 18px 36px -8px rgba(111,168,220,0.55)"
                  : "0 8px 20px -8px rgba(111,168,220,0.28)",
                animation:
                  mWin || tie
                    ? "float-a 5.5s ease-in-out infinite"
                    : "float-b 5.5s ease-in-out infinite",
                transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <span
                style={{
                  fontSize: mWin || tie ? 22 : 15,
                  lineHeight: 1,
                  fontWeight: 800,
                }}
              >
                {pctM}%
              </span>
              <span style={{ fontSize: 10, opacity: 0.88, marginTop: 2 }}>
                💙 Maschio
              </span>
            </div>
            <span
              className="text-[10px] font-bold tabular-nums"
              style={{ color: "#5B96CA" }}
            >
              {maschio} voti
            </span>
          </div>

          {/* ── Femmina ── */}
          <div
            className="flex flex-col items-center gap-1.5"
            style={{ order: mWin ? 2 : 1 }}
          >
            <div
              className="rounded-full flex flex-col items-center justify-center text-white font-bold"
              style={{
                width: !mWin || tie ? BIG : SMALL,
                height: !mWin || tie ? BIG : SMALL,
                background:
                  "radial-gradient(circle at 32% 28%, #F8B4D4 0%, #F296C2 100%)",
                boxShadow: !mWin
                  ? "0 18px 36px -8px rgba(242,150,194,0.55)"
                  : "0 8px 20px -8px rgba(242,150,194,0.28)",
                animation:
                  !mWin || tie
                    ? "float-a 6.2s ease-in-out infinite"
                    : "float-b 6.2s ease-in-out infinite",
                transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <span
                style={{
                  fontSize: !mWin || tie ? 22 : 15,
                  lineHeight: 1,
                  fontWeight: 800,
                }}
              >
                {pctF}%
              </span>
              <span style={{ fontSize: 10, opacity: 0.88, marginTop: 2 }}>
                🩷 Femmina
              </span>
            </div>
            <span
              className="text-[10px] font-bold tabular-nums"
              style={{ color: "#D878A8" }}
            >
              {femmina} voti
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
