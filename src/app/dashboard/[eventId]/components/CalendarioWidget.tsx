interface CalendarioWidgetProps {
  dataPresuntaParto: Date;
  votiPerGiorno: Record<string, number>;
}

export default function CalendarioWidget({
  dataPresuntaParto,
  votiPerGiorno,
}: CalendarioWidgetProps) {
  const dpp = new Date(dataPresuntaParto);
  const anno = dpp.getFullYear();
  const mese = dpp.getMonth();

  const primoGiorno = new Date(anno, mese, 1);
  const ultimoGiorno = new Date(anno, mese + 1, 0).getDate();
  const offsetInizio = primoGiorno.getDay() === 0 ? 6 : primoGiorno.getDay() - 1;

  const allVoti = Object.values(votiPerGiorno);
  const maxVoti = Math.max(1, ...allVoti);
  const totalVoti = allVoti.reduce((a, b) => a + b, 0);

  const giorni = ["L", "M", "M", "G", "V", "S", "D"];

  const formatKey = (d: number) =>
    `${anno}-${String(mese + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getHeatStyle = (count: number) => {
    if (count === 0)
      return { background: "transparent", color: "rgba(44,44,46,0.28)" };
    const intensity = count / maxVoti;
    // Honey/gold heatmap scale: #FFF1D0 → #FFC952 → #FF9F45
    const r = Math.round(255);
    const g = Math.round(241 - intensity * 100);
    const b = Math.round(208 - intensity * 140);
    return {
      background: `rgb(${r},${g},${b})`,
      color: intensity > 0.5 ? "white" : "#2C2C2E",
      fontWeight: 700,
      boxShadow: intensity > 0.5 ? "0 2px 8px rgba(255,159,69,0.30)" : undefined,
    };
  };

  const isDpp = (d: number) => d === dpp.getDate();

  return (
    <div className="clay-card p-6 flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3
            className="font-extrabold text-xl text-[#2C2C2E]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            TotoData
          </h3>
          <p className="text-xs font-semibold" style={{ color: "rgba(44,44,46,0.50)" }}>
            Densità scommesse su{" "}
            {dpp.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalVoti > 0 && (
            <span className="text-[11px] font-semibold" style={{ color: "rgba(44,44,46,0.45)" }}>
              {totalVoti} scommesse
            </span>
          )}
          <span
            className="text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border"
            style={{
              background: "rgba(255,209,102,0.18)",
              color: "#FF9F45",
              borderColor: "rgba(255,209,102,0.38)",
            }}
          >
            Heatmap
          </span>
        </div>
      </div>

      {/* Calendar grid — clay inset */}
      <div className="clay-inset-panel p-4 space-y-4 flex-1">
        {/* Month label */}
        <div
          className="text-center text-[10px] font-extrabold uppercase tracking-widest"
          style={{ color: "rgba(44,44,46,0.55)" }}
        >
          {dpp.toLocaleDateString("it-IT", { month: "long", year: "numeric" }).toUpperCase()}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {giorni.map((g, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-black py-0.5 uppercase"
              style={{ color: "rgba(44,44,46,0.28)" }}
            >
              {g}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Offset cells */}
          {Array.from({ length: offsetInizio }).map((_, i) => (
            <div key={`off-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: ultimoGiorno }, (_, i) => i + 1).map((giorno) => {
            const key = formatKey(giorno);
            const count = votiPerGiorno[key] ?? 0;
            const dppDay = isDpp(giorno);

            return (
              <div
                key={giorno}
                className="aspect-square rounded-xl flex items-center justify-center text-[11px] font-extrabold relative transition-all duration-200 hover:scale-105 cursor-default"
                style={
                  dppDay
                    ? {
                        background: "linear-gradient(135deg, #D4AF37 0%, #C08A3E 100%)",
                        color: "white",
                        boxShadow: "0 4px 14px -4px rgba(212,175,55,0.55)",
                      }
                    : getHeatStyle(count)
                }
                title={
                  count > 0
                    ? `${count} vot${count === 1 ? "o" : "i"}`
                    : dppDay
                    ? "Data Presunta Parto"
                    : undefined
                }
              >
                {giorno}
                {dppDay && (
                  <span className="absolute -top-1 -right-0.5 text-[8px] leading-none select-none">
                    🍼
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider p-3 rounded-2xl border-2 border-[#F1ECE4]"
        style={{ background: "#FDFBF7", color: "rgba(44,44,46,0.42)" }}
      >
        <span>Pochi Voti</span>
        <div className="flex gap-1.5">
          {[
            "rgba(255,255,255,0.6)",
            "#FFF1D0",
            "#FFE29F",
            "#FFC952",
            "#FF9F45",
          ].map((bg, i) => (
            <span
              key={i}
              className="w-4 h-4 rounded-full border border-[#F1ECE4]"
              style={{ background: bg, boxShadow: i > 2 ? "0 2px 4px rgba(255,159,69,0.20)" : undefined }}
            />
          ))}
        </div>
        <span>Molti</span>
      </div>
    </div>
  );
}
