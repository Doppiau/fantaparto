"use client";

import { useEffect, useState } from "react";

interface Props {
  dataPresuntaParto: string; // ISO string
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function CountdownCard({ dataPresuntaParto }: Props) {
  const target = new Date(dataPresuntaParto).getTime();

  const [tick, setTick] = useState(() => compute(target));

  useEffect(() => {
    const id = setInterval(() => setTick(compute(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const dppLabel = new Date(dataPresuntaParto).toLocaleDateString("it-IT", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div
      className="rounded-3xl p-6 flex flex-col justify-between h-full"
      style={{ background: "#ae2f34", color: "white" }}
    >
      <div>
        <h6 className="font-bold text-base mb-0.5">Data Presunta</h6>
        <p className="text-[12px] font-semibold opacity-70">{dppLabel}</p>
      </div>

      {tick.delivered ? (
        <div className="py-4 text-center">
          <p className="text-2xl font-black" style={{ fontFamily: "var(--font-fredoka)" }}>
            È nato! 👶
          </p>
        </div>
      ) : (
        <div
          className="py-4 flex justify-between gap-1 font-black text-3xl"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}
        >
          {[
            { v: tick.days,    l: "Gg"  },
            { v: tick.hours,   l: "Ore" },
            { v: tick.minutes, l: "Min" },
            { v: tick.seconds, l: "Sec" },
          ].map(({ v, l }, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <span>{pad(v)}</span>
              <span className="text-[9px] font-bold opacity-60 uppercase mt-0.5" style={{ letterSpacing: "0.08em" }}>
                {l}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        className="flex items-center gap-2 p-2 rounded-xl"
        style={{ background: "rgba(255,255,255,0.12)" }}
      >
        <span className="material-symbols-outlined text-sm">schedule</span>
        <span className="text-[11px] font-semibold">In tempo reale</span>
      </div>
    </div>
  );
}

function compute(target: number) {
  const distance = target - Date.now();
  if (distance <= 0) return { delivered: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    delivered: false,
    days:    Math.floor(distance / 86_400_000),
    hours:   Math.floor((distance % 86_400_000) / 3_600_000),
    minutes: Math.floor((distance % 3_600_000)  / 60_000),
    seconds: Math.floor((distance % 60_000)      / 1000),
  };
}
