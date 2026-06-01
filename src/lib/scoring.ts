// ============================================================
// FantaParto — Motore di Scoring
//
// Regole punteggio (max 100 pt quando tutti i campi sono attivi):
//   Sesso     30 pt  (esatto/sbagliato)
//   Data      25 pt  (0 giorni → 25 | ±1 → 20 | ±2 → 12 | ±3 → 6 | oltre → 0)
//   Ora       15 pt  (entro 30min → 15 | 1h → 10 | 2h → 5 | oltre → 0)
//   Peso      20 pt  (entro 50g → 20 | 100g → 15 | 200g → 10 | 500g → 5 | oltre → 0)
//   Lunghezza  5 pt  (entro 5mm → 5 | 10mm → 3 | 20mm → 1 | oltre → 0)
//   Capelli    3 pt  (esatto/sbagliato)
//   Occhi      2 pt  (esatto/sbagliato)
//
// Un campo contribuisce allo score SOLO SE:
//   - il toggle corrispondente è attivo sull'evento
//   - il risultato reale è stato inserito dalla mamma
//   - l'invitato ha effettivamente votato quel campo
// ============================================================

export const PUNTI = {
  sesso:     30,
  data:      { esatta: 25, giorni1: 20, giorni2: 12, giorni3: 6 },
  ora:       { min30: 15, ore1: 10, ore2: 5 },
  peso:      { g50: 20, g100: 15, g200: 10, g500: 5 },
  lunghezza: { mm5: 5, mm10: 3, mm20: 1 },
  capelli:   3,
  occhi:     2,
} as const;

export const PUNTI_MAX = 100;

// ── Tipi ────────────────────────────────────────────────────────────────────

export interface EventToggle {
  sessoAttivo:     boolean;
  dataAttiva:      boolean;
  oraAttiva:       boolean;
  pesoAttivo:      boolean;
  lunghezzaAttiva: boolean;
  capelliAttivo:   boolean;
  occhiAttivo:     boolean;
}

export interface RisultatiReali {
  realeSesso?:     string | null;
  realeData?:      Date   | null;
  realeOra?:       string | null;
  realePeso?:      number | null;
  realeLunghezza?: number | null;
  realeCapelli?:   string | null;
  realeOcchi?:     string | null;
}

export interface VotoCampi {
  votoSesso?:     string | null;
  votoData?:      Date   | null;
  votoOra?:       string | null;
  votoPeso?:      number | null;
  votoLunghezza?: number | null;
  votoCapelli?:   string | null;
  votoOcchi?:     string | null;
}

export interface ScoreBreakdown {
  sesso:     number;
  data:      number;
  ora:       number;
  peso:      number;
  lunghezza: number;
  capelli:   number;
  occhi:     number;
  total:     number;
}

// ── Helper interni ───────────────────────────────────────────────────────────

function oraToMin(ora: string): number {
  const [h, m] = ora.split(":").map(Number);
  return h * 60 + m;
}

function scoreData(reale: Date, voto: Date): number {
  // Confronto a mezzanotte UTC per evitare problemi di fuso orario
  const r = new Date(reale); r.setUTCHours(12, 0, 0, 0);
  const v = new Date(voto);  v.setUTCHours(12, 0, 0, 0);
  const diffDays = Math.abs(r.getTime() - v.getTime()) / 86_400_000;
  if (diffDays < 0.5) return PUNTI.data.esatta;
  if (diffDays < 1.5) return PUNTI.data.giorni1;
  if (diffDays < 2.5) return PUNTI.data.giorni2;
  if (diffDays < 3.5) return PUNTI.data.giorni3;
  return 0;
}

function scoreOra(reale: string, voto: string): number {
  const diffMin = Math.abs(oraToMin(reale) - oraToMin(voto));
  if (diffMin <= 30)  return PUNTI.ora.min30;
  if (diffMin <= 60)  return PUNTI.ora.ore1;
  if (diffMin <= 120) return PUNTI.ora.ore2;
  return 0;
}

function scorePeso(reale: number, voto: number): number {
  const diff = Math.abs(reale - voto);
  if (diff <= 50)  return PUNTI.peso.g50;
  if (diff <= 100) return PUNTI.peso.g100;
  if (diff <= 200) return PUNTI.peso.g200;
  if (diff <= 500) return PUNTI.peso.g500;
  return 0;
}

function scoreLunghezza(reale: number, voto: number): number {
  const diff = Math.abs(reale - voto);
  if (diff <= 5)  return PUNTI.lunghezza.mm5;
  if (diff <= 10) return PUNTI.lunghezza.mm10;
  if (diff <= 20) return PUNTI.lunghezza.mm20;
  return 0;
}

// ── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Calcola il punteggio di una singola prediction rispetto ai risultati reali.
 * Funzione pura — nessuna dipendenza esterna, sicura da testare.
 */
export function calcolaPunteggio(
  reale:   RisultatiReali,
  voto:    VotoCampi,
  toggles: EventToggle,
): ScoreBreakdown {
  const sesso =
    toggles.sessoAttivo && reale.realeSesso && voto.votoSesso
      ? voto.votoSesso === reale.realeSesso ? PUNTI.sesso : 0
      : 0;

  const data =
    toggles.dataAttiva && reale.realeData && voto.votoData
      ? scoreData(reale.realeData, voto.votoData)
      : 0;

  const ora =
    toggles.oraAttiva && reale.realeOra && voto.votoOra
      ? scoreOra(reale.realeOra, voto.votoOra)
      : 0;

  const peso =
    toggles.pesoAttivo && reale.realePeso && voto.votoPeso
      ? scorePeso(reale.realePeso, voto.votoPeso)
      : 0;

  const lunghezza =
    toggles.lunghezzaAttiva && reale.realeLunghezza && voto.votoLunghezza
      ? scoreLunghezza(reale.realeLunghezza, voto.votoLunghezza)
      : 0;

  const capelli =
    toggles.capelliAttivo && reale.realeCapelli && voto.votoCapelli
      ? voto.votoCapelli === reale.realeCapelli ? PUNTI.capelli : 0
      : 0;

  const occhi =
    toggles.occhiAttivo && reale.realeOcchi && voto.votoOcchi
      ? voto.votoOcchi === reale.realeOcchi ? PUNTI.occhi : 0
      : 0;

  return {
    sesso, data, ora, peso, lunghezza, capelli, occhi,
    total: sesso + data + ora + peso + lunghezza + capelli + occhi,
  };
}
