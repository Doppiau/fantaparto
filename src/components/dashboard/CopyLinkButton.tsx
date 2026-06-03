"use client";

import { useState } from "react";

interface Props {
  codice: string;
}

const VN = "var(--font-vietnam, sans-serif)";

export default function CopyLinkButton({ codice }: Props) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`https://fantaparto.com/vota/${codice}`);
    setState("copied");
    setTimeout(() => setState("idle"), 2500);
  };

  const copied = state === "copied";

  return (
    <button
      onClick={handleCopy}
      className="sm:!px-[22px]"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "11px 14px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontFamily: VN,
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: "0.02em",
        transition: "transform 150ms, box-shadow 150ms",
        transform: copied ? "scale(0.97)" : "scale(1)",
        color: "#fff",
        background: copied
          ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
          : "linear-gradient(135deg, #ff9f45 0%, #874e58 100%)",
        boxShadow: copied
          ? "0 4px 16px rgba(34,197,94,0.40), inset 0 1px 0 rgba(255,255,255,0.20)"
          : "0 4px 20px rgba(255,159,69,0.45), 0 2px 8px rgba(135,78,88,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      {/* Shimmer shine effect */}
      {!copied && (
        <span
          style={{
            position: "absolute",
            top: 0, left: "-100%",
            width: "60%", height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
            animation: "shimmer 2.4s infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Icona */}
      <span style={{ fontSize: 16, display: "flex", flexShrink: 0 }}>
        {copied ? "✅" : "🔗"}
      </span>

      {/* Testo — nascosto su mobile, visibile da sm in su */}
      <span className="hidden sm:inline">
        {copied ? "Link copiato!" : "Copia link invito"}
      </span>

      {/* Pulse ring when copied */}
      {copied && (
        <span style={{
          position: "absolute", inset: 0, borderRadius: 999,
          border: "2px solid rgba(34,197,94,0.60)",
          animation: "pulse-ring 0.6s ease-out forwards",
          pointerEvents: "none",
        }} />
      )}

      <style>{`
        @keyframes shimmer {
          0%   { left: -100%; }
          60%  { left: 160%; }
          100% { left: 160%; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 1; }
          100% { transform: scale(1.12); opacity: 0; }
        }
      `}</style>
    </button>
  );
}
