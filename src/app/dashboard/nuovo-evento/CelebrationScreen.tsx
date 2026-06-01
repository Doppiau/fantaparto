"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

const C = {
  surface:     "#fbf9f5",
  white:       "#ffffff",
  primary:     "#874e58",
  primaryFixed:"#ffd9de",
  outlineVar:  "#d6c2c3",
  onSurf:      "#1b1c1a",
  onSurfVar:   "#514345",
  shadow:      "0px 12px 32px rgba(135,78,88,0.08)",
} as const;

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

interface Props {
  nomeFeto:           string;
  codiceCondivisione: string;
  eventoId:           string;
}

export default function CelebrationScreen({ nomeFeto, codiceCondivisione, eventoId }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const fullUrl = `https://fantaparto.com/vota/${codiceCondivisione}`;

  const waText = encodeURIComponent(
    `Ho creato il mio FantaParto! Fai il tuo pronostico su ${nomeFeto || "Baby"} qui: ${fullUrl}`
  );
  const waHref = `https://wa.me/?text=${waText}`;

  useEffect(() => {
    confetti({
      particleCount: 120,
      spread:        80,
      colors:        ["#874e58", "#f4acb7", "#40627b", "#bee1ff", "#fbf9f5"],
      origin:        { y: 0.4 },
    });
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: C.surface,
        fontFamily: VN,
        animation:  "celebFadeIn 400ms ease both",
      }}
    >
      <style>{`
        @keyframes celebFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes celebPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.1); }
        }
      `}</style>

      <div className="flex flex-col items-center gap-6 w-full max-w-md text-center">

        {/* Emoji celebrazione */}
        <span
          className="text-[72px] select-none leading-none"
          style={{ animation: "celebPulse 1s ease-in-out infinite" }}
          aria-hidden
        >
          🎉
        </span>

        {/* Titolo */}
        <div>
          <h1
            className="text-[32px] font-bold leading-tight"
            style={{ fontFamily: QS, color: C.onSurf }}
          >
            Il tuo FantaParto è live! 🍼
          </h1>
          <p className="text-[16px] font-normal mt-2 max-w-sm mx-auto" style={{ color: C.onSurfVar }}>
            Condividi il link con i tuoi cari e inizia a raccogliere i pronostici.
          </p>
        </div>

        {/* Card link */}
        <div
          className="w-full rounded-[1.5rem] p-5 flex items-center gap-3"
          style={{ background: C.white, boxShadow: C.shadow }}
        >
          <p
            className="flex-1 text-[14px] font-semibold truncate text-left"
            style={{ color: C.primary }}
          >
            fantaparto.com/vota/{codiceCondivisione}
          </p>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all active:scale-95"
            style={{
              background: copied ? C.primary : C.primaryFixed,
              color:      copied ? "#ffffff" : C.primary,
              fontFamily: VN,
            }}
          >
            {copied ? "✓ Copiato!" : "📋 Copia"}
          </button>
        </div>

        {/* WhatsApp share */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full rounded-full py-3 text-[14px] font-semibold text-white transition-all active:scale-95 hover:opacity-90"
          style={{
            background: "#25D366",
            boxShadow:  "0 12px 32px rgba(37,211,102,0.25)",
            fontFamily: VN,
          }}
        >
          {/* WhatsApp icon SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.054.522 3.988 1.437 5.684L0 24l6.499-1.417A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.88 9.88 0 01-5.03-1.372l-.361-.214-3.738.814.844-3.627-.235-.374A9.84 9.84 0 012.106 12C2.106 6.532 6.532 2.106 12 2.106c5.468 0 9.894 4.426 9.894 9.894 0 5.468-4.426 9.894-9.894 9.894z"/>
          </svg>
          Condividi su WhatsApp
        </a>

        {/* Link dashboard evento */}
        <button
          onClick={() => router.push(`/dashboard/${eventoId}`)}
          className="text-[14px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: C.primary, fontFamily: VN }}
        >
          Vai alla dashboard dell&apos;evento →
        </button>

      </div>
    </div>
  );
}
