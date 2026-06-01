"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

const C = {
  bg: "#fbf9f5", white: "#ffffff", border: "#e8e4e1",
  primary: "#874e58", priXLight: "#ffd9de", priLight: "#f4acb7",
  onSurf: "#1b1c1a", onSurfVar: "#6b5b5d", muted: "#b0a0a2",
} as const;
const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

interface Props { nomeFeto: string; codiceCondivisione: string; eventoId: string; }

export default function CelebrationScreen({ nomeFeto, codiceCondivisione, eventoId }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const fullUrl = `https://fantaparto.com/vota/${codiceCondivisione}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(`Ho creato il mio FantaParto! Fai il tuo pronostico su ${nomeFeto || "Baby"} qui: ${fullUrl}`)}`;

  useEffect(() => {
    confetti({ particleCount: 120, spread: 80, colors: ["#874e58","#f4acb7","#40627b","#bee1ff","#fbf9f5"], origin: { y: 0.4 } });
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: VN, animation: "celebFade 400ms ease both" }}>
      <style>{`@keyframes celebFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } } @keyframes celebPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }`}</style>

      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 20, alignItems: "center", textAlign: "center" }}>
        <span style={{ fontSize: 64, lineHeight: 1, animation: "celebPulse 1.2s ease-in-out infinite" }}>🎉</span>

        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: QS, color: C.onSurf, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Il tuo FantaParto è live! 🍼
          </h1>
          <p style={{ fontSize: 15, color: C.onSurfVar, lineHeight: 1.65, margin: 0 }}>
            Condividi il link con i tuoi cari e inizia a raccogliere i pronostici.
          </p>
        </div>

        {/* Link card */}
        <div style={{ width: "100%", background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.primary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
            fantaparto.com/vota/{codiceCondivisione}
          </p>
          <button
            onClick={handleCopy}
            style={{
              flexShrink: 0, border: "none", cursor: "pointer", borderRadius: 999,
              padding: "7px 16px", fontSize: 13, fontWeight: 700, fontFamily: VN,
              background: copied ? C.primary : C.priXLight,
              color: copied ? C.white : C.primary, transition: "all 150ms",
            }}
          >
            {copied ? "✓ Copiato!" : "📋 Copia"}
          </button>
        </div>

        {/* WhatsApp */}
        <a
          href={waHref} target="_blank" rel="noopener noreferrer"
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "#25D366", color: "#ffffff", borderRadius: 999,
            padding: "13px 24px", textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: VN,
            boxShadow: "0 8px 20px rgba(37,211,102,0.25)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.054.522 3.988 1.437 5.684L0 24l6.499-1.417A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.88 9.88 0 01-5.03-1.372l-.361-.214-3.738.814.844-3.627-.235-.374A9.84 9.84 0 012.106 12C2.106 6.532 6.532 2.106 12 2.106c5.468 0 9.894 4.426 9.894 9.894 0 5.468-4.426 9.894-9.894 9.894z"/>
          </svg>
          Condividi su WhatsApp
        </a>

        <button
          onClick={() => router.push(`/dashboard/${eventoId}`)}
          style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: C.primary, fontFamily: VN }}
        >
          Vai alla dashboard dell&apos;evento →
        </button>
      </div>
    </div>
  );
}
