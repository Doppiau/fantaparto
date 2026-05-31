interface CalendarioWidgetProps {
  dataPresuntaParto: Date;
  votiPerGiorno: Record<string, number>; // "YYYY-MM-DD" -> count
}

export default function CalendarioWidget({
  dataPresuntaParto,
  votiPerGiorno,
}: CalendarioWidgetProps) {
  const dpp = new Date(dataPresuntaParto);
  const anno = dpp.getFullYear();
  const mese = dpp.getMonth(); // 0-indexed

  const primoGiorno = new Date(anno, mese, 1);
  const ultimoGiorno = new Date(anno, mese + 1, 0).getDate();
  // Offset lunedì-first (0 = Lun, 6 = Dom)
  const offsetInizio =
    primoGiorno.getDay() === 0 ? 6 : primoGiorno.getDay() - 1;

  const allVoti = Object.values(votiPerGiorno);
  const maxVoti = Math.max(1, ...allVoti);
  const totalVoti = allVoti.reduce((a, b) => a + b, 0);

  const giorni = ["L", "M", "M", "G", "V", "S", "D"];

  const formatKey = (d: number) =>
    `${anno}-${String(mese + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getHeatStyle = (count: number): React.CSSProperties => {
    if (count === 0)
      return { background: "rgba(237,228,213,0.55)", color: "rgba(44,44,46,0.38)" };
    const intensity = count / maxVoti;
    const alpha = 0.16 + intensity * 0.76;
    const textDark = intensity > 0.55;
    return {
      background: `rgba(212,175,55,${alpha})`,
      color: textDark ? "#5C3D00" : "#7A5200",
      fontWeight: 700,
    };
  };

  const isDpp = (d: number) => d === dpp.getDate();

  return (
    <div className="fp-card-plain p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.1em]"
          style={{ color: "rgba(44,44,46,0.42)" }}
        >
          Calendario Voti
        </p>
        <div className="flex items-center gap-2">
          {totalVoti > 0 && (
            <span
              className="text-[11px] font-semibold"
              style={{ color: "rgba(44,44,46,0.45)" }}
            >
              {totalVoti} pronostici
            </span>
          )}
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(212,175,55,0.11)",
              color: "#9A7000",
            }}
          >
            {dpp.toLocaleDateString("it-IT", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Intestazione giorni della settimana */}
      <div className="grid grid-cols-7 gap-1">
        {giorni.map((g, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-bold py-0.5"
            style={{ color: "rgba(44,44,46,0.32)" }}
          >
            {g}
          </div>
        ))}
      </div>

      {/* Griglia giorni */}
      <div className="grid grid-cols-7 gap-1">
        {/* Celle di offset */}
        {Array.from({ length: offsetInizio }).map((_, i) => (
          <div key={`off-${i}`} />
        ))}

        {/* Giorni del mese */}
        {Array.from({ length: ultimoGiorno }, (_, i) => i + 1).map((giorno) => {
          const key = formatKey(giorno);
          const count = votiPerGiorno[key] ?? 0;
          const dppDay = isDpp(giorno);

          return (
            <div
              key={giorno}
              className="aspect-square rounded-xl flex items-center justify-center text-[11px] font-semibold relative transition-all duration-200"
              style={
                dppDay
                  ? {
                      background:
                        "linear-gradient(135deg, #D4AF37 0%, #C08A3E 100%)",
                      color: "white",
                      fontWeight: 800,
                      boxShadow: "0 4px 14px -4px rgba(212,175,55,0.60)",
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

      {/* Legenda heatmap */}
      <div
        className="flex items-center gap-2 pt-3 border-t"
        style={{ borderColor: "#EDE8E0" }}
      >
        <span
          className="text-[10px] font-semibold whitespace-nowrap"
          style={{ color: "rgba(44,44,46,0.38)" }}
        >
          Pochi voti
        </span>
        <div className="flex gap-0.5 flex-1">
          {[0.14, 0.30, 0.50, 0.68, 0.88].map((v, i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-sm"
              style={{ background: `rgba(212,175,55,${v})` }}
            />
          ))}
        </div>
        <span
          className="text-[10px] font-semibold whitespace-nowrap"
          style={{ color: "rgba(44,44,46,0.38)" }}
        >
          Tanti
        </span>
      </div>
    </div>
  );
}
