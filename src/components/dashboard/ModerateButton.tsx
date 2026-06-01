"use client";

import { z } from "zod";
import { eliminaPredictionAction } from "@/app/dashboard/[eventId]/actions";

const ModerateSchema = z.object({
  predictionId: z.string().uuid(),
  eventId:      z.string().uuid(),
});

interface Props {
  predictionId: string;
  eventId:      string;
}

const VN = "var(--font-vietnam, sans-serif)";

export default function ModerateButton({ predictionId, eventId }: Props) {
  const handleModerate = async () => {
    const parsed = ModerateSchema.safeParse({ predictionId, eventId });
    if (!parsed.success) {
      console.error("[ModerateButton] ID non validi", parsed.error.flatten());
      return;
    }

    if (!window.confirm("Eliminare questo pronostico? L'azione non è reversibile.")) return;

    await eliminaPredictionAction(parsed.data.eventId, parsed.data.predictionId);
  };

  return (
    <button
      onClick={handleModerate}
      className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors hover:bg-[#ffdad6] hover:border-[#ba1a1a] hover:text-[#93000a]"
      style={{
        border:    "1px solid #d6c2c3",
        color:     "#514345",
        fontFamily: VN,
      }}
    >
      Modera
    </button>
  );
}
