"use client";

import { useState, useTransition } from "react";
import {
  aggiornaNomeGenitoreAction,
  aggiornaDppAction,
  aggiornaNomeBimboAction,
  toggleSwitchEventoAction,
  esportaDatiAction,
  eliminaAccountAction,
} from "./actions";

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

interface Evento {
  id: string;
  nomeBimbo: string | null;
  stato: string;
  dataPresuntaParto: Date;
  codiceCondivisione: string;
  classificaPrivata: boolean;
  hypeSpaceAnonimo: boolean;
  votiBloccati: boolean;
}

interface ProfiloClientProps {
  eventi: Evento[];
  emailUtente: string;
  nomeGenitore: string | null;
}

// ── Componente Switch ─────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 48, height: 28, borderRadius: 999, border: "none",
        background: checked ? "#874e58" : "rgba(44,44,46,0.15)",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 200ms", flexShrink: 0,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 4, left: checked ? 24 : 4,
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.20)",
        transition: "left 200ms",
        display: "block",
      }} />
    </button>
  );
}

// ── Riga switch ───────────────────────────────────────────────────────────────

function SwitchRow({
  label, description, checked, onChange, disabled, danger,
}: {
  label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void;
  disabled?: boolean; danger?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      gap: 16, padding: "16px 0",
      borderBottom: "1px solid rgba(44,44,46,0.06)",
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: danger ? "#b91c1c" : "#2C2C2E", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: "rgba(44,44,46,0.50)", margin: "3px 0 0", lineHeight: 1.5 }}>{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ── Card section ──────────────────────────────────────────────────────────────

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff", border: "1.5px solid #F1ECE4",
      borderRadius: 20, overflow: "hidden",
    }}>
      <div style={{
        padding: "18px 24px", borderBottom: "1px solid #F1ECE4",
        display: "flex", alignItems: "center", gap: 10,
        background: "#FDFBF7",
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#2C2C2E", fontFamily: QS, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: "4px 24px 8px" }}>{children}</div>
    </div>
  );
}

// ── Selettore evento ──────────────────────────────────────────────────────────

function EventSelector({
  eventi, selected, onChange,
}: { eventi: Evento[]; selected: string; onChange: (id: string) => void }) {
  if (eventi.length <= 1) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", display: "block", marginBottom: 6 }}>
        Evento
      </label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 12,
          border: "1.5px solid #F1ECE4", background: "#fff",
          fontSize: 14, fontWeight: 600, color: "#2C2C2E",
          fontFamily: VN, outline: "none", cursor: "pointer",
        }}
      >
        {eventi.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a"} — {ev.codiceCondivisione}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfiloClient({ eventi, emailUtente, nomeGenitore }: ProfiloClientProps) {
  const [selectedId, setSelectedId] = useState(eventi[0]?.id ?? "");
  const [localEventi, setLocalEventi] = useState(eventi);
  const ev = localEventi.find((e) => e.id === selectedId);

  const [dpp, setDpp] = useState(ev?.dataPresuntaParto.toISOString().split("T")[0] ?? "");
  const [nomeBimbo, setNomeBimbo] = useState(ev?.nomeBimbo ?? "");
  const [nomeGenitoreInput, setNomeGenitoreInput] = useState(nomeGenitore ?? "");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  // Aggiorna i campi locali quando cambia evento selezionato
  function selectEvento(id: string) {
    setSelectedId(id);
    const next = localEventi.find((e) => e.id === id);
    setDpp(next?.dataPresuntaParto.toISOString().split("T")[0] ?? "");
    setNomeBimbo(next?.nomeBimbo ?? "");
    setFeedback({});
  }

  function setMsg(key: string, msg: string) {
    setFeedback((prev) => ({ ...prev, [key]: msg }));
    setTimeout(() => setFeedback((prev) => { const n = { ...prev }; delete n[key]; return n; }), 3000);
  }

  function updateLocalEvento(patch: Partial<Evento>) {
    setLocalEventi((list) => list.map((e) => e.id === selectedId ? { ...e, ...patch } : e));
  }

  // ── Azioni ────────────────────────────────────────────────────────────────

  function handleDpp() {
    if (!ev) return;
    startTransition(async () => {
      const res = await aggiornaDppAction(ev.id, dpp);
      if (res.success) {
        updateLocalEvento({ dataPresuntaParto: new Date(dpp) });
        setMsg("dpp", "✓ Data aggiornata");
      } else {
        setMsg("dpp", `✗ ${res.error}`);
      }
    });
  }

  function handleNome() {
    if (!ev) return;
    startTransition(async () => {
      const res = await aggiornaNomeBimboAction(ev.id, nomeBimbo);
      if (res.success) {
        updateLocalEvento({ nomeBimbo: nomeBimbo.trim() || null });
        setMsg("nome", "✓ Nome aggiornato");
      } else {
        setMsg("nome", `✗ ${res.error}`);
      }
    });
  }

  function handleNomeGenitore() {
    startTransition(async () => {
      const res = await aggiornaNomeGenitoreAction(nomeGenitoreInput);
      if (res.success) {
        setMsg("nomeGenitore", "✓ Nome aggiornato");
      } else {
        setMsg("nomeGenitore", `✗ ${res.error}`);
      }
    });
  }

  function handleSwitch(campo: keyof Pick<Evento, "votiBloccati" | "classificaPrivata" | "hypeSpaceAnonimo">, valore: boolean) {
    if (!ev) return;
    updateLocalEvento({ [campo]: valore }); // ottimistico
    startTransition(async () => {
      const res = await toggleSwitchEventoAction(ev.id, campo, valore);
      if (!res.success) {
        updateLocalEvento({ [campo]: !valore }); // rollback
        setMsg(campo, `✗ ${res.error}`);
      }
    });
  }

  // ── Export dati ───────────────────────────────────────────────────────────

  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    const res = await esportaDatiAction();
    setExporting(false);
    if (!res.success) { alert(res.error); return; }
    const blob  = new Blob([res.json], { type: "application/json" });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href      = url;
    a.download  = `fantaparto-dati-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Elimina account ───────────────────────────────────────────────────────

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await eliminaAccountAction();
  }

  if (!ev) {
    return (
      <div style={{ textAlign: "center", padding: "64px 24px", color: "rgba(44,44,46,0.50)" }}>
        <p style={{ fontSize: 48 }}>🍼</p>
        <p style={{ fontSize: 15, fontWeight: 600 }}>Nessun evento trovato.</p>
      </div>
    );
  }

  const isConcluso = ev.stato === "CONCLUSO";
  const fmtDpp = (d: Date) => new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── 1. Parametri evento ─────────────────────────────────────────── */}
      <Card title="Parametri Evento" icon="🗓️">
        <div style={{ padding: "16px 0 8px", display: "flex", flexDirection: "column", gap: 16 }}>
          <EventSelector eventi={localEventi} selected={selectedId} onChange={selectEvento} />

          {/* DPP */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", display: "block", marginBottom: 6 }}>
              Data Presunta Parto
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="date" value={dpp}
                onChange={(e) => setDpp(e.target.value)}
                disabled={isConcluso}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 12,
                  border: "1.5px solid #F1ECE4", background: isConcluso ? "#f7f5f2" : "#fff",
                  fontSize: 14, fontFamily: VN, color: "#2C2C2E", outline: "none",
                }}
              />
              <button
                type="button" onClick={handleDpp} disabled={isConcluso}
                style={{
                  padding: "10px 20px", borderRadius: 12, border: "none",
                  background: isConcluso ? "#e0dbd6" : "#874e58", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: isConcluso ? "not-allowed" : "pointer",
                  fontFamily: VN, flexShrink: 0,
                }}
              >
                Salva
              </button>
            </div>
            {feedback.dpp && (
              <p style={{ fontSize: 12, marginTop: 6, color: feedback.dpp.startsWith("✓") ? "#166534" : "#b91c1c" }}>
                {feedback.dpp}
              </p>
            )}
            <p style={{ fontSize: 11, color: "rgba(44,44,46,0.40)", margin: "4px 0 0" }}>
              Attuale: {fmtDpp(ev.dataPresuntaParto)}
            </p>
          </div>

          {/* Nome bimbo */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", display: "block", marginBottom: 6 }}>
              Nome / Soprannome del Bimbo
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text" value={nomeBimbo} maxLength={60}
                placeholder="es. Mattia, Sofì, Fagiolino…"
                onChange={(e) => setNomeBimbo(e.target.value)}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 12,
                  border: "1.5px solid #F1ECE4", background: "#fff",
                  fontSize: 14, fontFamily: VN, color: "#2C2C2E", outline: "none",
                }}
              />
              <button
                type="button" onClick={handleNome}
                style={{
                  padding: "10px 20px", borderRadius: 12, border: "none",
                  background: "#874e58", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: VN, flexShrink: 0,
                }}
              >
                Salva
              </button>
            </div>
            {feedback.nome && (
              <p style={{ fontSize: 12, marginTop: 6, color: feedback.nome.startsWith("✓") ? "#166534" : "#b91c1c" }}>
                {feedback.nome}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ── 2. Privacy & Controllo Votazioni ───────────────────────────── */}
      <Card title="Privacy & Controllo Votazioni" icon="🔒">
        {feedback.votiBloccati && (
          <p style={{ fontSize: 12, color: "#b91c1c", padding: "8px 0 0" }}>{feedback.votiBloccati}</p>
        )}
        <SwitchRow
          label="🚫 Blocca nuovi voti"
          description="Chiudi anticipatamente le votazioni senza rivelare i risultati. Utile se la mamma viene ricoverata. Reversibile."
          checked={ev.votiBloccati}
          onChange={(v) => handleSwitch("votiBloccati", v)}
          disabled={isConcluso}
          danger={ev.votiBloccati}
        />
        {feedback.classificaPrivata && (
          <p style={{ fontSize: 12, color: "#b91c1c", padding: "8px 0 0" }}>{feedback.classificaPrivata}</p>
        )}
        <SwitchRow
          label="🏆 Classifica privata"
          description="La classifica finale sarà visibile solo a voi genitori, non tramite il link pubblico degli invitati."
          checked={ev.classificaPrivata}
          onChange={(v) => handleSwitch("classificaPrivata", v)}
        />
        {feedback.hypeSpaceAnonimo && (
          <p style={{ fontSize: 12, color: "#b91c1c", padding: "8px 0 0" }}>{feedback.hypeSpaceAnonimo}</p>
        )}
        <SwitchRow
          label="👻 Hype Space anonimo"
          description="Gli invitati non vedranno i grafici con le scommesse degli altri. Ognuno resta 'al buio' fino alla nascita."
          checked={ev.hypeSpaceAnonimo}
          onChange={(v) => handleSwitch("hypeSpaceAnonimo", v)}
        />
      </Card>

      {/* ── 3. GDPR & Account ───────────────────────────────────────────── */}
      <Card title="Account e Privacy (GDPR)" icon="⚖️">
        <div style={{ padding: "16px 0 8px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Nome genitore */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", display: "block", marginBottom: 6 }}>
              Il tuo nome
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                value={nomeGenitoreInput}
                onChange={(e) => setNomeGenitoreInput(e.target.value)}
                maxLength={80}
                placeholder="Come vuoi essere chiamata/o?"
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 12,
                  border: "1.5px solid #F1ECE4", background: "#fff",
                  fontSize: 14, fontFamily: VN, color: "#2C2C2E", outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleNomeGenitore}
                style={{
                  padding: "10px 20px", borderRadius: 12, border: "none",
                  background: "#874e58", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: VN, flexShrink: 0,
                }}
              >
                Salva
              </button>
            </div>
            {feedback.nomeGenitore && (
              <p style={{ fontSize: 12, marginTop: 6, color: feedback.nomeGenitore.startsWith("✓") ? "#166534" : "#b91c1c" }}>
                {feedback.nomeGenitore}
              </p>
            )}
          </div>

          {/* Email (read only) */}
          <div style={{ padding: "14px", background: "#f7f5f2", borderRadius: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", margin: "0 0 2px" }}>Email</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2E", margin: 0 }}>{emailUtente}</p>
          </div>

          {/* Export */}
          <button
            type="button" onClick={handleExport} disabled={exporting}
            style={{
              width: "100%", padding: "13px 20px", borderRadius: 12,
              border: "1.5px solid #F1ECE4", background: exporting ? "#f7f5f2" : "#fff",
              fontSize: 14, fontWeight: 700, cursor: exporting ? "not-allowed" : "pointer",
              color: "#2C2C2E", fontFamily: VN, textAlign: "left", display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <span>📦</span>
            {exporting ? "Preparazione archivio…" : "Esporta tutti i miei dati (JSON)"}
          </button>
          <p style={{ fontSize: 11, color: "rgba(44,44,46,0.38)", margin: "-6px 0 0" }}>
            Scarica un archivio con tutti i voti, messaggi e statistiche dei tuoi eventi.
          </p>

          {/* Divider */}
          <div style={{ height: 1, background: "#F1ECE4", margin: "4px 0" }} />

          {/* Delete account */}
          {!confirmDelete ? (
            <button
              type="button" onClick={handleDelete}
              style={{
                width: "100%", padding: "13px 20px", borderRadius: 12,
                border: "1.5px solid rgba(185,28,28,0.25)", background: "#fef2f2",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                color: "#b91c1c", fontFamily: VN, textAlign: "left", display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <span>🗑️</span>
              Elimina account definitivamente
            </button>
          ) : (
            <div style={{ background: "#fef2f2", border: "1.5px solid rgba(185,28,28,0.30)", borderRadius: 12, padding: "16px" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#b91c1c", margin: "0 0 8px" }}>
                ⚠️ Sei sicuro/a? Questa azione è irreversibile.
              </p>
              <p style={{ fontSize: 12, color: "rgba(185,28,28,0.70)", margin: "0 0 14px", lineHeight: 1.5 }}>
                Verranno eliminati permanentemente: account, tutti gli eventi, tutti i voti e i deviceFingerprint degli invitati.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button" onClick={handleDelete} disabled={deleting}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 10, border: "none",
                    background: deleting ? "#e0dbd6" : "#b91c1c", color: "#fff",
                    fontSize: 13, fontWeight: 800, cursor: deleting ? "not-allowed" : "pointer",
                    fontFamily: VN,
                  }}
                >
                  {deleting ? "Eliminazione…" : "Sì, elimina tutto"}
                </button>
                <button
                  type="button" onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 10,
                    border: "1.5px solid #F1ECE4", background: "#fff",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    color: "#2C2C2E", fontFamily: VN,
                  }}
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
