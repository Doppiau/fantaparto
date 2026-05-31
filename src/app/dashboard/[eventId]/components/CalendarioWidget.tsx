interface CalendarioWidgetProps {
  dataPresuntaParto: Date;
  votiPerGiorno: Record<string, number>; // "YYYY-MM-DD" -> count
}

export default function CalendarioWidget({ dataPresuntaParto, votiPerGiorno }: CalendarioWidgetProps) {
  const dpp = new Date(dataPresuntaParto);
  const anno = dpp.getFullYear();
  const mese = dpp.getMonth(); // 0-indexed

  const primoGiorno = new Date(anno, mese, 1);
  const ultimoGiorno = new Date(anno, mese + 1, 0).getDate();
  const offsetInizio = primoGiorno.getDay() === 0 ? 6 : primoGiorno.getDay() - 1; // lunedì=0

  const maxVoti = Math.max(1, ...Object.values(votiPerGiorno));
  const giorni = ["L", "M", "M", "G", "V", "S", "D"];

  const formatKey = (d: number) => `${anno}-${String(mese + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const intensita = (count: number) => {
    if (count === 0) return "bg-[#F0E7D6]";
    const pct = count / maxVoti;
    if (pct < 0.25) return "bg-[#FFD166] opacity-30";
    if (pct < 0.5)  return "bg-[#FFD166] opacity-55";
    if (pct < 0.75) return "bg-[#FFAA44] opacity-75";
    return "bg-[#FF9F2F]";
  };

  const isDpp = (d: number) => d === dpp.getDate();

  return (
    <div className="fp-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--ink-45)] uppercase tracking-widest">Calendario Voti</p>
        <span className="text-xs font-bold text-[var(--honey)] bg-[#FFF8E7] px-2 py-0.5 rounded-full">
          {dpp.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
        </span>
      </div>

      {/* Intestazione giorni */}
      <div className="grid grid-cols-7 gap-0.5">
        {giorni.map((g, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-[var(--ink-45)]">{g}</div>
        ))}
      </div>

      {/* Griglia giorni */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* offset iniziale */}
        {Array.from({ length: offsetInizio }).map((_, i) => <div key={`off-${i}`} />)}

        {Array.from({ length: ultimoGiorno }, (_, i) => i + 1).map((giorno) => {
          const key = formatKey(giorno);
          const count = votiPerGiorno[key] ?? 0;
          return (
            <div
              key={giorno}
              className={`
                aspect-square rounded-md flex items-center justify-center
                text-[10px] font-semibold relative transition-all
                ${isDpp(giorno)
                  ? "ring-2 ring-[var(--honey)] ring-offset-1 bg-[var(--honey)] text-white font-black"
                  : `${intensita(count)} text-[var(--ink-60)]`}
              `}
              title={count > 0 ? `${count} voti` : undefined}
            >
              {giorno}
              {isDpp(giorno) && (
                <span className="absolute -top-1 -right-1 text-[8px]">🍼</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] text-[var(--ink-45)] font-medium">Pochi voti</span>
        <div className="flex gap-0.5 flex-1">
          {[0.15, 0.35, 0.6, 0.85, 1].map((v, i) => (
            <div key={i} className="flex-1 h-2 rounded-sm" style={{ background: `rgba(255, 170, 68, ${v})` }} />
          ))}
        </div>
        <span className="text-[10px] text-[var(--ink-45)] font-medium">Tanti</span>
      </div>
    </div>
  );
}
