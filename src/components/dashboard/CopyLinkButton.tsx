"use client";

import { useState } from "react";

interface Props {
  codice: string;
}

const VN = "var(--font-vietnam, sans-serif)";

export default function CopyLinkButton({ codice }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`https://fantaparto.com/vota/${codice}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-all active:scale-95"
      style={{
        border:        "2px solid #874e58",
        color:         copied ? "#ffffff" : "#874e58",
        background:    copied ? "#874e58" : "transparent",
        fontFamily:    VN,
        letterSpacing: "0.03em",
      }}
    >
      {copied ? "✓ Link copiato!" : "📋 Copia link invito"}
    </button>
  );
}
