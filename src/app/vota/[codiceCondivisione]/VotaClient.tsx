"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface VotaClientProps {
  eventId: string;
  nomeBimbo: string | null;
  dataPresuntaParto: string; // ISO string da Prisma
  sessoAttivo: boolean;
  dataAttiva: boolean;
  pesoAttivo: boolean;
  lunghezzaAttiva: boolean;
  oraAttiva: boolean;
  capelliAttivo: boolean;
  occhiAttivo: boolean;
}

type Phase = "form" | "submitting" | "success" | "already_voted";
type Sesso = "MASCHIO" | "FEMMINA";
type Capelli = "LISCI" | "RICCI" | "CALVO";
type Occhi = "CHIARI" | "SCURI";

function fmtPeso(g: number): string {
  return (g / 1000).toFixed(2).replace(".", ",");
}

function fmtLunghezza(mm: number): string {
  return (mm / 10).toFixed(1).replace(".", ",");
}

export default function VotaClient({
  eventId,
  nomeBimbo,
  dataPresuntaParto,
  sessoAttivo,
  dataAttiva,
  pesoAttivo,
  lunghezzaAttiva,
  oraAttiva,
  capelliAttivo,
  occhiAttivo,
}: VotaClientProps) {
  const [phase, setPhase] = useState<Phase>("form");
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  // Dati invitato
  const [nomeInvitato, setNomeInvitato] = useState("");
  const [emailInvitato, setEmailInvitato] = useState("");
  const [messaggioAugurio, setMessaggioAugurio] = useState("");

  // Pronostici
  const [votoSesso, setVotoSesso] = useState<Sesso | "">("");
  const [votoData, setVotoData] = useState(dataPresuntaParto.split("T")[0]);
  const [votoPeso, setVotoPeso] = useState(3200);
  const [votoLunghezza, setVotoLunghezza] = useState(500);
  const [votoOra, setVotoOra] = useState("");
  const [votoCapelli, setVotoCapelli] = useState<Capelli | "">("");
  const [votoOcchi, setVotoOcchi] = useState<Occhi | "">("");

  const [error, setError] = useState<string | null>(null);

  // Fingerprint: generato una volta sola e persistito in localStorage
  useEffect(() => {
    const votedKey = `fp_voted_${eventId}`;
    if (localStorage.getItem(votedKey)) {
      setPhase("already_voted");
      return;
    }

    const fpKey = `fp_${eventId}`;
    let fp = localStorage.getItem(fpKey);
    if (!fp) {
      fp = [
        Date.now().toString(36),
        Math.random().toString(36).slice(2, 10),
        window.screen.width,
        window.screen.height,
        navigator.hardwareConcurrency ?? 0,
      ].join("-");
      localStorage.setItem(fpKey, fp);
    }
    setFingerprint(fp);
  }, [eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fingerprint || !nomeInvitato.trim()) return;

    setPhase("submitting");
    setError(null);

    const body: Record<string, unknown> = {
      eventId,
      nomeInvitato: nomeInvitato.trim(),
      deviceFingerprint: fingerprint,
    };
    if (emailInvitato) body.emailInvitato = emailInvitato;
    if (messaggioAugurio) body.messaggioAugurio = messaggioAugurio;
    if (sessoAttivo && votoSesso) body.votoSesso = votoSesso;
    if (dataAttiva && votoData) body.votoData = votoData;
    if (pesoAttivo) body.votoPeso = votoPeso;
    if (lunghezzaAttiva) body.votoLunghezza = votoLunghezza;
    if (oraAttiva && votoOra) body.votoOra = votoOra;
    if (capelliAttivo && votoCapelli) body.votoCapelli = votoCapelli;
    if (occhiAttivo && votoOcchi) body.votoOcchi = votoOcchi;

    try {
      const res = await fetch("/api/v1/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json: { success: boolean; error?: string } = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Errore imprevisto. Riprova.");
        setPhase("form");
        return;
      }

      localStorage.setItem(`fp_voted_${eventId}`, "1");
      setPhase("success");
    } catch {
      setError("Errore di connessione. Controlla la rete e riprova.");
      setPhase("form");
    }
  }

  const nomeDisplay = nomeBimbo ? `Baby ${nomeBimbo}` : "Fagiolino 🫘";
  const dppFormatted = new Date(dataPresuntaParto).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (phase === "already_voted") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--cream)" }}
      >
        <div className="fp-card p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
          <span className="text-5xl">✅</span>
          <h1
            className="text-xl font-black text-[var(--ink)]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            Hai già votato!
          </h1>
          <p className="text-sm text-[var(--ink-60)]">
            Hai già espresso il tuo pronostico per{" "}
            <strong>{nomeDisplay}</strong>.<br />
            Aspetta la nascita per scoprire chi ha vinto!
          </p>
        </div>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--cream)" }}
      >
        <div className="fp-card p-8 max-w-sm w-full text-center flex flex-col items-center gap-5">
          <span className="text-6xl">🎉</span>
          <h1
            className="text-3xl font-black text-[var(--ink)]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            Pronostico inviato!
          </h1>
          <p className="text-sm text-[var(--ink-60)]">
            Il tuo voto per <strong>{nomeDisplay}</strong> è salvato.
            <br />
            Tornerai qui dopo la nascita per scoprire chi ha indovinato!
          </p>
          <div className="w-full border-t border-[var(--border)] pt-5 flex flex-col gap-3">
            <p className="text-xs font-bold text-[var(--ink-45)] uppercase tracking-widest">
              Aspetta una gravidanza in famiglia?
            </p>
            <Link
              href="/"
              className="fp-btn-gold flex items-center justify-center gap-2 text-sm font-bold"
            >
              🍼 Crea il tuo FantaParto
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Blobs decorativi */}
      <div className="bg-blobs" aria-hidden="true">
        <div className="blob b1" />
        <div className="blob b2" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-10 flex flex-col gap-5">
        {/* Header */}
        <header className="text-center pt-2 pb-1">
          <p className="text-xs font-semibold text-[var(--ink-45)] uppercase tracking-widest mb-2">
            FantaParto
          </p>
          <h1
            className="text-3xl font-black text-[var(--ink)]"
            style={{ fontFamily: "var(--font-fredoka, sans-serif)" }}
          >
            {nomeDisplay}
          </h1>
          <p className="text-sm text-[var(--ink-60)] mt-1">
            Data Presunta Parto · {dppFormatted}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ─ Chi sei ──────────────────────────────────────────────── */}
          <section className="fp-card p-5 flex flex-col gap-3">
            <p className="text-xs font-bold text-[var(--ink-45)] uppercase tracking-widest">
              Chi sei? *
            </p>
            <input
              type="text"
              placeholder="Il tuo nome"
              value={nomeInvitato}
              onChange={(e) => setNomeInvitato(e.target.value)}
              className="fp-input w-full"
              maxLength={80}
              required
            />
            <input
              type="email"
              placeholder="Email (opzionale)"
              value={emailInvitato}
              onChange={(e) => setEmailInvitato(e.target.value)}
              className="fp-input w-full"
            />
          </section>

          {/* ─ Sesso ────────────────────────────────────────────────── */}
          {sessoAttivo && (
            <section className="fp-card p-5 flex flex-col gap-3">
              <p className="text-xs font-bold text-[var(--ink-45)] uppercase tracking-widest">
                Maschio o femmina?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setVotoSesso(votoSesso === "MASCHIO" ? "" : "MASCHIO")
                  }
                  className="py-6 rounded-2xl font-bold text-lg border-2 transition-all duration-200 active:scale-95"
                  style={{
                    borderColor:
                      votoSesso === "MASCHIO" ? "#6FA8DC" : "var(--border)",
                    background:
                      votoSesso === "MASCHIO" ? "#EBF4FC" : "white",
                    color:
                      votoSesso === "MASCHIO" ? "#6FA8DC" : "var(--ink-60)",
                    boxShadow:
                      votoSesso === "MASCHIO"
                        ? "0 8px 20px -8px rgba(111,168,220,0.45)"
                        : "none",
                  }}
                >
                  💙 Maschio
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVotoSesso(votoSesso === "FEMMINA" ? "" : "FEMMINA")
                  }
                  className="py-6 rounded-2xl font-bold text-lg border-2 transition-all duration-200 active:scale-95"
                  style={{
                    borderColor:
                      votoSesso === "FEMMINA" ? "#F296C2" : "var(--border)",
                    background:
                      votoSesso === "FEMMINA" ? "#FDEEF6" : "white",
                    color:
                      votoSesso === "FEMMINA" ? "#F296C2" : "var(--ink-60)",
                    boxShadow:
                      votoSesso === "FEMMINA"
                        ? "0 8px 20px -8px rgba(242,150,194,0.45)"
                        : "none",
                  }}
                >
                  🩷 Femmina
                </button>
              </div>
            </section>
          )}

          {/* ─ Data ─────────────────────────────────────────────────── */}
          {dataAttiva && (
            <section className="fp-card p-5 flex flex-col gap-3">
              <p className="text-xs font-bold text-[var(--ink-45)] uppercase tracking-widest">
                Quando nascerà?
              </p>
              <input
                type="date"
                value={votoData}
                onChange={(e) => setVotoData(e.target.value)}
                className="fp-input w-full text-center text-lg font-bold"
              />
            </section>
          )}

          {/* ─ Peso ─────────────────────────────────────────────────── */}
          {pesoAttivo && (
            <section className="fp-card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--ink-45)] uppercase tracking-widest">
                  Peso alla nascita
                </p>
                <span className="text-2xl font-black text-[var(--honey)]">
                  {fmtPeso(votoPeso)}{" "}
                  <span className="text-base font-semibold text-[var(--ink-60)]">
                    kg
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={6000}
                step={50}
                value={votoPeso}
                onChange={(e) => setVotoPeso(Number(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer"
                style={{ accentColor: "var(--honey)" }}
              />
              <div className="flex justify-between text-[11px] font-semibold text-[var(--ink-45)]">
                <span>1,00 kg</span>
                <span>6,00 kg</span>
              </div>
            </section>
          )}

          {/* ─ Lunghezza ────────────────────────────────────────────── */}
          {lunghezzaAttiva && (
            <section className="fp-card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--ink-45)] uppercase tracking-widest">
                  Lunghezza
                </p>
                <span className="text-2xl font-black text-[var(--honey)]">
                  {fmtLunghezza(votoLunghezza)}{" "}
                  <span className="text-base font-semibold text-[var(--ink-60)]">
                    cm
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={700}
                step={5}
                value={votoLunghezza}
                onChange={(e) => setVotoLunghezza(Number(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer"
                style={{ accentColor: "var(--honey)" }}
              />
              <div className="flex justify-between text-[11px] font-semibold text-[var(--ink-45)]">
                <span>30,0 cm</span>
                <span>70,0 cm</span>
              </div>
            </section>
          )}

          {/* ─ Ora ──────────────────────────────────────────────────── */}
          {oraAttiva && (
            <section className="fp-card p-5 flex flex-col gap-3">
              <p className="text-xs font-bold text-[var(--ink-45)] uppercase tracking-widest">
                Ora di nascita (opzionale)
              </p>
              <input
                type="time"
                value={votoOra}
                onChange={(e) => setVotoOra(e.target.value)}
                className="fp-input w-full text-center text-lg font-bold"
              />
            </section>
          )}

          {/* ─ Capelli ──────────────────────────────────────────────── */}
          {capelliAttivo && (
            <section className="fp-card p-5 flex flex-col gap-3">
              <p className="text-xs font-bold text-[var(--ink-45)] uppercase tracking-widest">
                Capelli
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["LISCI", "RICCI", "CALVO"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVotoCapelli(votoCapelli === v ? "" : v)}
                    className="py-3 rounded-2xl font-bold text-sm border-2 transition-all duration-200"
                    style={{
                      borderColor:
                        votoCapelli === v ? "var(--honey)" : "var(--border)",
                      background:
                        votoCapelli === v ? "#FFF8E7" : "white",
                      color:
                        votoCapelli === v ? "var(--honey)" : "var(--ink-60)",
                    }}
                  >
                    {v === "LISCI"
                      ? "💇 Lisci"
                      : v === "RICCI"
                      ? "🌀 Ricci"
                      : "✨ Calvo"}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ─ Occhi ────────────────────────────────────────────────── */}
          {occhiAttivo && (
            <section className="fp-card p-5 flex flex-col gap-3">
              <p className="text-xs font-bold text-[var(--ink-45)] uppercase tracking-widest">
                Colore occhi
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["CHIARI", "SCURI"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVotoOcchi(votoOcchi === v ? "" : v)}
                    className="py-4 rounded-2xl font-bold text-sm border-2 transition-all duration-200"
                    style={{
                      borderColor:
                        votoOcchi === v ? "var(--honey)" : "var(--border)",
                      background: votoOcchi === v ? "#FFF8E7" : "white",
                      color:
                        votoOcchi === v ? "var(--honey)" : "var(--ink-60)",
                    }}
                  >
                    {v === "CHIARI" ? "🔵 Chiari" : "🟤 Scuri"}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ─ Messaggio ────────────────────────────────────────────── */}
          <section className="fp-card p-5 flex flex-col gap-3">
            <p className="text-xs font-bold text-[var(--ink-45)] uppercase tracking-widest">
              Messaggio di auguri 💕
            </p>
            <textarea
              placeholder="Scrivi un pensiero alla mamma..."
              value={messaggioAugurio}
              onChange={(e) => setMessaggioAugurio(e.target.value)}
              className="fp-input w-full resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-right text-[11px] text-[var(--ink-45)]">
              {messaggioAugurio.length}/500
            </p>
          </section>

          {/* ─ Errore ───────────────────────────────────────────────── */}
          {error && (
            <div
              className="fp-card px-4 py-3 text-center"
              style={{ background: "#FFF0F0", borderColor: "#FFD5D5" }}
            >
              <p className="text-sm text-red-500 font-semibold">{error}</p>
            </div>
          )}

          {/* ─ Submit ───────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={
              phase === "submitting" || !fingerprint || !nomeInvitato.trim()
            }
            className="fp-btn-gold w-full py-5 font-black disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontFamily: "var(--font-fredoka, sans-serif)",
              fontSize: "1.1rem",
            }}
          >
            {phase === "submitting"
              ? "⏳ Invio in corso..."
              : "🚀 Invia il mio pronostico!"}
          </button>

          <p className="text-center text-xs text-[var(--ink-45)] pb-6">
            Powered by{" "}
            <Link
              href="/"
              className="font-bold hover:underline"
              style={{ color: "var(--honey)" }}
            >
              FantaParto
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
