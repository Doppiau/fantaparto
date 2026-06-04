"use client";

import { useState, useTransition, useRef } from "react";
import {
  aggiornaNomeGenitoreAction,
  aggiornaDppAction,
  aggiornaNomeBimboAction,
  toggleSwitchEventoAction,
  esportaDatiAction,
  eliminaAccountAction,
  aggiornaTemaColoreAction,
  aggiornaCodiceCondivisioneAction,
  aggiornaDigestNotificheAction,
  riscattaCouponAction,
  disconnettiTuttiAction,
} from "./actions";

const QS = "var(--font-quicksand, sans-serif)";
const VN = "var(--font-vietnam, sans-serif)";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Evento {
  id: string;
  nomeBimbo: string | null;
  stato: string;
  dataPresuntaParto: Date;
  codiceCondivisione: string;
  temaColore: string;
  classificaPrivata: boolean;
  hypeSpaceAnonimo: boolean;
  votiBloccati: boolean;
  notificheVoto: boolean;
  digestNotifiche: string;
  avvisoDpp: boolean;
}

interface ProfiloClientProps {
  eventi:        Evento[];
  emailUtente:   string;
  nomeGenitore:  string | null;
  avatarUrl:     string | null;
  isPremium:     boolean;
  couponRiscattato: string | null;
  pianoAttivatoAt:  Date | null;
}

// ── Mini components ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
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
        boxShadow: "0 1px 4px rgba(0,0,0,0.20)", transition: "left 200ms", display: "block",
      }} />
    </button>
  );
}

function SwitchRow({ label, description, checked, onChange, disabled, danger }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "16px 0", borderBottom: "1px solid rgba(44,44,46,0.06)" }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: danger ? "#b91c1c" : "#2C2C2E", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: "rgba(44,44,46,0.50)", margin: "3px 0 0", lineHeight: 1.5 }}>{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #F1ECE4", borderRadius: 20, overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1ECE4", display: "flex", alignItems: "center", gap: 10, background: "#FDFBF7" }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#2C2C2E", fontFamily: QS, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: "4px 24px 8px" }}>{children}</div>
    </div>
  );
}

function EventSelector({ eventi, selected, onChange }: { eventi: Evento[]; selected: string; onChange: (id: string) => void }) {
  if (eventi.length <= 1) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", display: "block", marginBottom: 6 }}>
        Evento
      </label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid #F1ECE4", background: "#fff", fontSize: 14, fontWeight: 600, color: "#2C2C2E", fontFamily: VN, outline: "none", cursor: "pointer" }}
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

function Msg({ text }: { text: string }) {
  if (!text) return null;
  const ok = text.startsWith("✓");
  return <p style={{ fontSize: 12, marginTop: 6, color: ok ? "#166534" : "#b91c1c" }}>{text}</p>;
}

function SaveBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: disabled ? "#e0dbd6" : "#874e58", color: "#fff", fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: VN, flexShrink: 0 }}>
      Salva
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfiloClient({
  eventi, emailUtente, nomeGenitore, avatarUrl: initialAvatarUrl, isPremium, couponRiscattato, pianoAttivatoAt,
}: ProfiloClientProps) {
  const [selectedId, setSelectedId]       = useState(eventi[0]?.id ?? "");
  const [localEventi, setLocalEventi]     = useState(eventi);
  const ev = localEventi.find((e) => e.id === selectedId);

  const [dpp, setDpp]                     = useState(ev?.dataPresuntaParto.toISOString().split("T")[0] ?? "");
  const [nomeBimbo, setNomeBimbo]         = useState(ev?.nomeBimbo ?? "");
  const [nomeGenitoreInput, setNG]        = useState(nomeGenitore ?? "");
  const [codiceCond, setCodiceCond]       = useState(ev?.codiceCondivisione ?? "");
  const [feedback, setFeedback]           = useState<Record<string, string>>({});
  const [avatarUrl, setAvatarUrl]         = useState(initialAvatarUrl);
  const [uploadingAvatar, setUploading]   = useState(false);
  const [qrVisible, setQrVisible]         = useState(false);
  const [waCopied, setWaCopied]           = useState(false);
  const [couponInput, setCouponInput]     = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const [, startTransition]               = useTransition();
  const fileRef                           = useRef<HTMLInputElement>(null);

  function selectEvento(id: string) {
    setSelectedId(id);
    const next = localEventi.find((e) => e.id === id);
    setDpp(next?.dataPresuntaParto.toISOString().split("T")[0] ?? "");
    setNomeBimbo(next?.nomeBimbo ?? "");
    setCodiceCond(next?.codiceCondivisione ?? "");
    setFeedback({});
  }

  function setMsg(key: string, msg: string) {
    setFeedback((prev) => ({ ...prev, [key]: msg }));
    setTimeout(() => setFeedback((prev) => { const n = { ...prev }; delete n[key]; return n; }), 3500);
  }

  function patchEvento(patch: Partial<Evento>) {
    setLocalEventi((list) => list.map((e) => e.id === selectedId ? { ...e, ...patch } : e));
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleDpp() {
    if (!ev) return;
    startTransition(async () => {
      const res = await aggiornaDppAction(ev.id, dpp);
      if (res.success) { patchEvento({ dataPresuntaParto: new Date(dpp) }); setMsg("dpp", "✓ Data aggiornata"); }
      else setMsg("dpp", `✗ ${res.error}`);
    });
  }

  function handleNome() {
    if (!ev) return;
    startTransition(async () => {
      const res = await aggiornaNomeBimboAction(ev.id, nomeBimbo);
      if (res.success) { patchEvento({ nomeBimbo: nomeBimbo.trim() || null }); setMsg("nome", "✓ Nome aggiornato"); }
      else setMsg("nome", `✗ ${res.error}`);
    });
  }

  function handleNomeGenitore() {
    startTransition(async () => {
      const res = await aggiornaNomeGenitoreAction(nomeGenitoreInput);
      if (res.success) setMsg("nomeGenitore", "✓ Nome aggiornato");
      else setMsg("nomeGenitore", `✗ ${res.error}`);
    });
  }

  function handleSwitch(campo: keyof Pick<Evento, "votiBloccati"|"classificaPrivata"|"hypeSpaceAnonimo"|"notificheVoto"|"avvisoDpp">, valore: boolean) {
    if (!ev) return;
    patchEvento({ [campo]: valore });
    startTransition(async () => {
      const res = await toggleSwitchEventoAction(ev.id, campo, valore);
      if (!res.success) { patchEvento({ [campo]: !valore }); setMsg(campo, `✗ ${res.error}`); }
    });
  }

  function handleTema(tema: string) {
    if (!ev) return;
    patchEvento({ temaColore: tema });
    startTransition(async () => {
      const res = await aggiornaTemaColoreAction(ev.id, tema);
      if (!res.success) { patchEvento({ temaColore: ev.temaColore }); setMsg("tema", `✗ ${res.error}`); }
      else setMsg("tema", "✓ Tema aggiornato");
    });
  }

  function handleCodice() {
    if (!ev) return;
    startTransition(async () => {
      const res = await aggiornaCodiceCondivisioneAction(ev.id, codiceCond);
      if (res.success) { patchEvento({ codiceCondivisione: codiceCond.trim().toLowerCase() }); setMsg("codice", "✓ Codice aggiornato"); }
      else setMsg("codice", `✗ ${res.error}`);
    });
  }

  function handleDigest(valore: string) {
    if (!ev) return;
    patchEvento({ digestNotifiche: valore });
    startTransition(async () => {
      const res = await aggiornaDigestNotificheAction(ev.id, valore);
      if (!res.success) { patchEvento({ digestNotifiche: ev.digestNotifiche }); setMsg("digest", `✗ ${res.error}`); }
    });
  }

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("avatar", file);
    const res = await fetch("/api/upload/avatar", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (data.url) { setAvatarUrl(data.url); setMsg("avatar", "✓ Foto aggiornata"); }
    else setMsg("avatar", `✗ ${data.error ?? "Errore upload"}`);
  }

  async function handleCoupon() {
    const res = await riscattaCouponAction(couponInput);
    if (res.success) setMsg("coupon", `✓ ${res.messaggio}`);
    else setMsg("coupon", `✗ ${res.error}`);
  }

  function handleWaCopy() {
    if (!ev) return;
    const link = `https://fantaparto.com/vota/${ev.codiceCondivisione}`;
    const nome = ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "il nostro bimbo/a";
    const testo = `🍼 *FantaParto – ${nome}*\nFai il tuo pronostico! Sesso, peso, data, ora... chi indovinerà di più?\n👉 ${link}`;
    navigator.clipboard.writeText(testo).then(() => {
      setWaCopied(true);
      setTimeout(() => setWaCopied(false), 2500);
    });
  }

  async function handleDisconnetti() {
    setDisconnecting(true);
    const res = await disconnettiTuttiAction();
    setDisconnecting(false);
    if (!res.success) setMsg("sicurezza", `✗ ${res.error}`);
    else window.location.href = "/login";
  }

  // ── Export / Delete ───────────────────────────────────────────────────────

  const [exporting, setExporting]     = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDelete, setConfirm]   = useState(false);

  async function handleExport() {
    setExporting(true);
    const res = await esportaDatiAction();
    setExporting(false);
    if (!res.success) { alert(res.error); return; }
    const blob = new Blob([res.json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `fantaparto-dati-${new Date().toISOString().split("T")[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirm(true); return; }
    setDeleting(true);
    await eliminaAccountAction();
  }

  const isConcluso = ev?.stato === "CONCLUSO";
  const fmtDate = (d: Date) => new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const initiali = ((nomeGenitore ?? emailUtente).slice(0, 2)).toUpperCase();

  const TEMI = [
    { key: "ROSA",    label: "Rosa", color: "#f4acb7", bg: "#fde8e6" },
    { key: "CELESTE", label: "Celeste", color: "#40627b", bg: "#bee1ff" },
    { key: "NEUTRO",  label: "Neutro",  color: "#847375", bg: "#efeeea" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── 0. Foto profilo ─────────────────────────────────────────── */}
      <Card title="Foto Profilo" icon="🖼️">
        <div style={{ padding: "16px 0 12px", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid #F1ECE4" }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #874e58, #5e2d3a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: "#fff", border: "3px solid #F1ECE4" }}>
                {initiali}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: "#874e58", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}
            >
              ✏️
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#2C2C2E", margin: "0 0 4px" }}>
              {nomeGenitore ?? emailUtente.split("@")[0]}
            </p>
            <p style={{ fontSize: 12, color: "rgba(44,44,46,0.50)", margin: "0 0 10px" }}>
              {uploadingAvatar ? "Caricamento…" : "Carica una foto (max 2 MB · JPEG, PNG, WebP)"}
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              style={{ fontSize: 12, fontWeight: 700, color: "#874e58", background: "#fde8e6", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}
            >
              {uploadingAvatar ? "Caricamento…" : "Cambia foto"}
            </button>
          </div>
        </div>
        <Msg text={feedback.avatar ?? ""} />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }}
        />
      </Card>

      {/* ── 1. Parametri evento ─────────────────────────────────────── */}
      {ev ? (
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
                  type="date" value={dpp} onChange={(e) => setDpp(e.target.value)} disabled={isConcluso}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1.5px solid #F1ECE4", background: isConcluso ? "#f7f5f2" : "#fff", fontSize: 14, fontFamily: VN, color: "#2C2C2E", outline: "none" }}
                />
                <SaveBtn onClick={handleDpp} disabled={isConcluso} />
              </div>
              <Msg text={feedback.dpp ?? ""} />
              <p style={{ fontSize: 11, color: "rgba(44,44,46,0.40)", margin: "4px 0 0" }}>Attuale: {fmtDate(ev.dataPresuntaParto)}</p>
            </div>

            {/* Nome bimbo */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", display: "block", marginBottom: 6 }}>
                Nome / Soprannome del Bimbo
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="text" value={nomeBimbo} maxLength={60} placeholder="es. Mattia, Sofì, Fagiolino…"
                  onChange={(e) => setNomeBimbo(e.target.value)}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1.5px solid #F1ECE4", background: "#fff", fontSize: 14, fontFamily: VN, color: "#2C2C2E", outline: "none" }}
                />
                <SaveBtn onClick={handleNome} />
              </div>
              <Msg text={feedback.nome ?? ""} />
            </div>

            {/* Codice condivisione */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", display: "block", marginBottom: 6 }}>
                Codice Condivisione
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="text" value={codiceCond} maxLength={40} placeholder="es. baby-sofia"
                  onChange={(e) => setCodiceCond(e.target.value.toLowerCase())}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1.5px solid #F1ECE4", background: "#fff", fontSize: 14, fontFamily: VN, color: "#2C2C2E", outline: "none" }}
                />
                <SaveBtn onClick={handleCodice} />
              </div>
              <Msg text={feedback.codice ?? ""} />
              <p style={{ fontSize: 11, color: "rgba(44,44,46,0.40)", margin: "4px 0 0" }}>
                Link: fantaparto.com/vota/<strong>{ev.codiceCondivisione}</strong>
              </p>
            </div>

            {/* Tema colore */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", display: "block", marginBottom: 10 }}>
                Tema Colore dell&apos;Evento
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {TEMI.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleTema(t.key)}
                    style={{
                      flex: 1, padding: "12px 8px", borderRadius: 12,
                      border: ev.temaColore === t.key ? `2px solid ${t.color}` : "2px solid transparent",
                      background: t.bg, cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      boxShadow: ev.temaColore === t.key ? `0 0 0 2px ${t.color}40` : "none",
                      transition: "all 150ms",
                    }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: t.color }} />
                    <span style={{ fontSize: 11, fontWeight: ev.temaColore === t.key ? 800 : 600, color: t.color }}>{t.label}</span>
                  </button>
                ))}
              </div>
              <Msg text={feedback.tema ?? ""} />
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ background: "#fdf8f5", border: "1.5px dashed #e8ddd8", borderRadius: 20, padding: "28px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <p style={{ fontSize: 32, margin: 0 }}>🍼</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2E", margin: 0 }}>Nessun evento ancora</p>
          <p style={{ fontSize: 13, color: "rgba(44,44,46,0.50)", margin: 0 }}>Crea il tuo primo FantaParto per configurare i parametri.</p>
          <a href="/dashboard/nuovo-evento" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 14, fontWeight: 700, color: "#fff", background: "#874e58", borderRadius: 12, padding: "11px 24px", textDecoration: "none" }}>
            + Crea il tuo FantaParto
          </a>
        </div>
      )}

      {/* ── 2. Privacy & Controllo Votazioni ──────────────────────── */}
      {ev && (
        <Card title="Privacy & Controllo Votazioni" icon="🔒">
          <SwitchRow
            label="🚫 Blocca nuovi voti"
            description="Chiudi anticipatamente le votazioni senza rivelare i risultati."
            checked={ev.votiBloccati} onChange={(v) => handleSwitch("votiBloccati", v)}
            disabled={isConcluso} danger={ev.votiBloccati}
          />
          <SwitchRow
            label="🏆 Classifica privata"
            description="La classifica finale sarà visibile solo a voi genitori."
            checked={ev.classificaPrivata} onChange={(v) => handleSwitch("classificaPrivata", v)}
          />
          <SwitchRow
            label="👻 Hype Space anonimo"
            description="Gli invitati non vedranno i grafici degli altri fino alla nascita."
            checked={ev.hypeSpaceAnonimo} onChange={(v) => handleSwitch("hypeSpaceAnonimo", v)}
          />
          {(feedback.votiBloccati || feedback.classificaPrivata || feedback.hypeSpaceAnonimo) && (
            <p style={{ fontSize: 12, color: "#b91c1c", padding: "4px 0" }}>
              {feedback.votiBloccati || feedback.classificaPrivata || feedback.hypeSpaceAnonimo}
            </p>
          )}
        </Card>
      )}

      {/* ── 3. Notifiche ───────────────────────────────────────────── */}
      {ev && (
        <Card title="Notifiche" icon="🔔">
          <SwitchRow
            label="✉️ Notifica nuovo voto"
            description="Ricevi un'email ogni volta che un invitato invia il suo pronostico."
            checked={ev.notificheVoto} onChange={(v) => handleSwitch("notificheVoto", v)}
          />
          <SwitchRow
            label="📅 Avviso DPP imminente"
            description="Ricevi un'email 7 giorni prima della data presunta del parto."
            checked={ev.avvisoDpp} onChange={(v) => handleSwitch("avvisoDpp", v)}
          />
          <div style={{ padding: "16px 0 8px" }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", display: "block", marginBottom: 10 }}>
              Digest riepilogativo
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["DISATTIVATO", "GIORNALIERO", "SETTIMANALE"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleDigest(v)}
                  style={{
                    flex: 1, padding: "10px 6px", borderRadius: 10, border: "none",
                    background: ev.digestNotifiche === v ? "#874e58" : "#f7f5f2",
                    color: ev.digestNotifiche === v ? "#fff" : "#2C2C2E",
                    fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 150ms",
                  }}
                >
                  {v === "DISATTIVATO" ? "Off" : v === "GIORNALIERO" ? "Giornaliero" : "Settimanale"}
                </button>
              ))}
            </div>
            <Msg text={feedback.digest ?? ""} />
          </div>
        </Card>
      )}

      {/* ── 4. Social & Condivisione ───────────────────────────────── */}
      {ev && (
        <Card title="Social & Condivisione" icon="📲">
          <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* WhatsApp */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#2C2C2E", margin: "0 0 4px" }}>💬 Messaggio WhatsApp pre-compilato</p>
              <p style={{ fontSize: 12, color: "rgba(44,44,46,0.50)", margin: "0 0 10px", lineHeight: 1.5 }}>
                Testo pronto con link incluso da copiare e incollare su WhatsApp.
              </p>
              <button
                type="button"
                onClick={handleWaCopy}
                style={{ width: "100%", padding: "13px 20px", borderRadius: 12, border: "1.5px solid #25D366", background: waCopied ? "#dcfce7" : "#f0fdf4", fontSize: 14, fontWeight: 700, cursor: "pointer", color: waCopied ? "#166534" : "#166534", fontFamily: VN, textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 200ms" }}
              >
                <span>📋</span>
                {waCopied ? "✓ Copiato negli appunti!" : "Copia messaggio WhatsApp"}
              </button>
            </div>

            {/* QR Code */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#2C2C2E", margin: "0 0 4px" }}>📱 QR Code evento</p>
              <p style={{ fontSize: 12, color: "rgba(44,44,46,0.50)", margin: "0 0 10px", lineHeight: 1.5 }}>
                Genera un QR code da stampare o proiettare alla festa baby shower.
              </p>
              <button
                type="button"
                onClick={() => setQrVisible(!qrVisible)}
                style={{ fontSize: 13, fontWeight: 700, color: "#874e58", background: "#fde8e6", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer" }}
              >
                {qrVisible ? "Nascondi QR" : "Mostra QR Code"}
              </button>
              {qrVisible && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/qr?url=${encodeURIComponent(`https://fantaparto.com/vota/${ev.codiceCondivisione}`)}`}
                    alt="QR Code"
                    width={180}
                    height={180}
                    style={{ borderRadius: 12, border: "1.5px solid #F1ECE4", padding: 8, background: "#fff" }}
                  />
                  <p style={{ fontSize: 11, color: "rgba(44,44,46,0.40)", margin: 0 }}>
                    fantaparto.com/vota/{ev.codiceCondivisione}
                  </p>
                  <a
                    href={`/api/qr?url=${encodeURIComponent(`https://fantaparto.com/vota/${ev.codiceCondivisione}`)}&download=1`}
                    download="qr-fantaparto.png"
                    style={{ fontSize: 12, fontWeight: 700, color: "#874e58", textDecoration: "none", background: "#fde8e6", borderRadius: 8, padding: "8px 16px" }}
                  >
                    Scarica PNG
                  </a>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── 5. Coupon & Piano ──────────────────────────────────────── */}
      <Card title="Coupon & Piano" icon="⭐">
        <div style={{ padding: "16px 0 8px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Stato piano */}
          <div style={{ padding: 14, borderRadius: 12, background: isPremium ? "#dcfce7" : "#fdf8f5", border: `1.5px solid ${isPremium ? "#86efac" : "#F1ECE4"}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: isPremium ? "#166534" : "rgba(44,44,46,0.40)", margin: "0 0 2px" }}>Piano attuale</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: isPremium ? "#166534" : "#2C2C2E", margin: 0 }}>
              {isPremium ? "⭐ Premium" : "🆓 Free"}
            </p>
            {isPremium && pianoAttivatoAt && (
              <p style={{ fontSize: 11, color: "#166534", margin: "4px 0 0" }}>Attivo dal {fmtDate(pianoAttivatoAt)}</p>
            )}
            {isPremium && couponRiscattato && (
              <p style={{ fontSize: 11, color: "rgba(22,101,52,0.60)", margin: "2px 0 0" }}>Coupon: {couponRiscattato}</p>
            )}
          </div>

          {/* Inserimento coupon */}
          {!isPremium && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", display: "block", marginBottom: 6 }}>
                Hai un codice coupon?
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  maxLength={32}
                  placeholder="es. BABY2025"
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1.5px solid #F1ECE4", background: "#fff", fontSize: 14, fontFamily: VN, color: "#2C2C2E", outline: "none", letterSpacing: "0.05em" }}
                />
                <button
                  type="button"
                  onClick={handleCoupon}
                  disabled={!couponInput.trim()}
                  style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: !couponInput.trim() ? "#e0dbd6" : "#874e58", color: "#fff", fontSize: 13, fontWeight: 700, cursor: !couponInput.trim() ? "not-allowed" : "pointer", fontFamily: VN, flexShrink: 0 }}
                >
                  Riscatta
                </button>
              </div>
              <Msg text={feedback.coupon ?? ""} />
            </div>
          )}
        </div>
      </Card>

      {/* ── 6. Account e Privacy (GDPR) ─────────────────────────────── */}
      <Card title="Account e Privacy (GDPR)" icon="⚖️">
        <div style={{ padding: "16px 0 8px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Nome genitore */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", display: "block", marginBottom: 6 }}>
              Il tuo nome
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text" value={nomeGenitoreInput} onChange={(e) => setNG(e.target.value)} maxLength={80} placeholder="Come vuoi essere chiamata/o?"
                style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1.5px solid #F1ECE4", background: "#fff", fontSize: 14, fontFamily: VN, color: "#2C2C2E", outline: "none" }}
              />
              <SaveBtn onClick={handleNomeGenitore} />
            </div>
            <Msg text={feedback.nomeGenitore ?? ""} />
          </div>

          {/* Email */}
          <div style={{ padding: 14, background: "#f7f5f2", borderRadius: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", margin: "0 0 2px" }}>Email</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2E", margin: 0 }}>{emailUtente}</p>
          </div>

          {/* Export */}
          <button type="button" onClick={handleExport} disabled={exporting}
            style={{ width: "100%", padding: "13px 20px", borderRadius: 12, border: "1.5px solid #F1ECE4", background: exporting ? "#f7f5f2" : "#fff", fontSize: 14, fontWeight: 700, cursor: exporting ? "not-allowed" : "pointer", color: "#2C2C2E", fontFamily: VN, textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}>
            <span>📦</span>
            {exporting ? "Preparazione archivio…" : "Esporta tutti i miei dati (JSON)"}
          </button>

          <div style={{ height: 1, background: "#F1ECE4", margin: "4px 0" }} />

          {/* Delete account */}
          {!confirmDelete ? (
            <button type="button" onClick={handleDelete}
              style={{ width: "100%", padding: "13px 20px", borderRadius: 12, border: "1.5px solid rgba(185,28,28,0.25)", background: "#fef2f2", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#b91c1c", fontFamily: VN, textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}>
              <span>🗑️</span> Elimina account definitivamente
            </button>
          ) : (
            <div style={{ background: "#fef2f2", border: "1.5px solid rgba(185,28,28,0.30)", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#b91c1c", margin: "0 0 8px" }}>⚠️ Sei sicuro/a? Questa azione è irreversibile.</p>
              <p style={{ fontSize: 12, color: "rgba(185,28,28,0.70)", margin: "0 0 14px", lineHeight: 1.5 }}>
                Verranno eliminati: account, tutti gli eventi, tutti i voti e i deviceFingerprint.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: deleting ? "#e0dbd6" : "#b91c1c", color: "#fff", fontSize: 13, fontWeight: 800, cursor: deleting ? "not-allowed" : "pointer", fontFamily: VN }}>
                  {deleting ? "Eliminazione…" : "Sì, elimina tutto"}
                </button>
                <button type="button" onClick={() => setConfirm(false)}
                  style={{ flex: 1, padding: 11, borderRadius: 10, border: "1.5px solid #F1ECE4", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#2C2C2E", fontFamily: VN }}>
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── 7. Sicurezza ───────────────────────────────────────────── */}
      <Card title="Sicurezza" icon="🛡️">
        <div style={{ padding: "16px 0 8px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ padding: 14, background: "#f7f5f2", borderRadius: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(44,44,46,0.40)", margin: "0 0 2px" }}>Sessione attiva</p>
            <p style={{ fontSize: 13, color: "#2C2C2E", margin: 0, lineHeight: 1.5 }}>
              Sei connessa su questo dispositivo. Premi il pulsante qui sotto per disconnettere tutti i dispositivi contemporaneamente (incluso quello attuale).
            </p>
          </div>
          <button
            type="button"
            onClick={handleDisconnetti}
            disabled={disconnecting}
            style={{ width: "100%", padding: "13px 20px", borderRadius: 12, border: "1.5px solid rgba(185,28,28,0.25)", background: "#fef2f2", fontSize: 14, fontWeight: 700, cursor: disconnecting ? "not-allowed" : "pointer", color: "#b91c1c", fontFamily: VN, textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
          >
            <span>🔐</span>
            {disconnecting ? "Disconnessione in corso…" : "Disconnetti tutti i dispositivi"}
          </button>
          <Msg text={feedback.sicurezza ?? ""} />
        </div>
      </Card>

    </div>
  );
}
