# FantaParto — Contesto di Progetto

## 1. Visione del Progetto

**FantaParto** è un micro-SaaS event-based: un gioco sociale per le gravidanze in stile fantacalcio.

- Le **mamme** creano l'evento dalla web app e configurano le domande di voto (data di nascita, peso, sesso, ora, capelli, occhi, domande custom Premium).
- Gli **invitati** votano via browser (senza login) tramite un link condiviso su WhatsApp.
- Al momento della nascita, il sistema calcola automaticamente la classifica e genera un PDF ricordo.

---

## 2. Architettura dei Domini

| Dominio | Scopo | Hosting |
|---|---|---|
| `fantaparto.com` | Sito pubblico, Landing Page, dashboard mamme, interfaccia di voto | Vercel (Next.js) |
| `fantaparto.app` | Backend, Database e API (futuro) | Supabase |

### Supabase Project
- **Project ID:** `dvznrowaptxdnnitxvsd`
- **Supabase URL:** `https://dvznrowaptxdnnitxvsd.supabase.co`
- **Site URL configurato:** `https://fantaparto.com`
- **Redirect URLs autorizzati:**
  - `https://fantaparto.com/auth/callback`
  - `http://localhost:3000/auth/callback`

---

## 3. Stack Tecnologico

| Categoria | Tecnologia | Note |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript (strict mode) | |
| ORM / DB | Prisma ORM (v7, output: `generated/prisma`) + Supabase (PostgreSQL) | `prisma db push` per sync schema |
| Cache / Rate Limiting | Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`) | Voto + login + IP ban + VPN cache |
| Error Logging | Sentry | |
| Background Jobs | Inngest | Calcolo punteggi, invio PDF ricordo |
| Validazione | Zod v4 | `.issues[0].message` (non `.errors`) |
| Autenticazione | Supabase Auth | Solo per le mamme — **NON usare Clerk** |
| Styling | Tailwind CSS + inline styles | Design token definiti in ogni componente |
| VPN Detection | proxycheck.io | `src/lib/vpn.ts`, cache Redis 6h, env `PROXYCHECK_KEY` |

---

## 4. Schema Prisma — Modelli Principali

### `User`
- `id` (UUID = Supabase auth ID), `email`, `nome?`, `avatarUrl?`, `isPremium`

### `Event`
- `stato`: `"IN_CORSO"` | `"PRONTO_RIVELAZIONE"` | `"CONCLUSO"`
- Toggle pronostici: `sessoAttivo`, `dataAttiva`, `pesoAttivo`, `lunghezzaAttiva`, `oraAttiva`, `capelliAttivo`, `occhiAttivo`
- Privacy: `classificaPrivata`, `hypeSpaceAnonimo`, `votiBloccati`
- Risultati reali: `realeSesso`, `realeData`, `realePeso`, `realeLunghezza`, `realeOra`, `realeCapelli`, `realeOcchi`

### `Prediction`
- `deviceFingerprint` — deduplicazione voti (unique constraint su `eventId + deviceFingerprint`)
- **Antifrode**: `ipAddress?`, `vpnFlag`, `flagSospetto`, `motivazioneSospetto?`

### `Coupon`
- `tipo`: `"PREMIUM_USER"` | `"PREMIUM_EVENTO"` | `"SCONTO_PCT"`
- `creatorTag?`, `usoMax?`, `usoCorrente`, `scadenza?`, `attivo`

### `CampagnaInfluencer`
- `codiceRif` (unique) — usato come `?ref=CODICE` nell'URL landing
- `click`, `conversioni`, `attiva`

### `LinkAffiliazione`
- `partner`: `"AMAZON"` | `"NIDODIGRAZIA"` | `"ALTRO"`
- `tagTracciamento`, `click`, `commissioni?` (€, dichiarate manualmente), `attivo`

### `AuditLog`
- Log immutabile di tutte le operazioni admin

---

## 5. Regole di Sicurezza Critiche

### 5.1 — Rotta Admin Offuscata
- Dashboard Admin: `/regia-segreta-9832` — **mai** usare `/admin`
- Accesso a `/admin` → finto 404, nessun indizio che la rotta esista
- Protezione in `src/middleware.ts`: honeypot su rotte scanner standard → ban IP 24h

### 5.2 — Rate Limiting (multi-livello)
- `rateLimitVoto` — 5 req/10s per IP (globale)
- `rateLimitVotoPerEvento` — max 3 voti per IP per evento per ora
- `recordViolationAndMaybeBan()` — escalation: 2° violation in 10min → ban automatico 1h
- `rateLimitAuth` — 10 req/60s per IP (auth)

### 5.3 — Honeypot Anti-Bot
- Campo `_hp` (hidden, off-screen) nel form di voto
- Se compilato → risposta fake 201 senza salvare il voto

### 5.4 — VPN Detection
- `checkVpn(ip)` in `src/lib/vpn.ts` — proxycheck.io, timeout 1.5s, cache Redis 6h
- Voti da VPN: salvati ma flaggati (`vpnFlag=true`, `flagSospetto=true`)

### 5.5 — Calcolo Classifica Atomico
- Transazione atomica al momento del parto → stato `CONCLUSO` istantaneo
- Impedisce race condition e doppi calcoli

---

## 6. Struttura delle Route Principali

```
src/app/
├── api/v1/predict/          ← POST voto invitato (hardened)
├── auth/                    ← login, signup, Google OAuth callback
├── dashboard/               ← area mamme (auth required)
│   ├── page.tsx             ← overview: empty state + active state
│   ├── layout.tsx           ← sidebar + auth guard, passa isPremium
│   ├── [eventId]/           ← dashboard evento specifico
│   ├── eventi/              ← lista tutti gli eventi
│   ├── profilo/             ← gestione account, DPP, privacy, GDPR
│   ├── settings/            ← configurazione metriche di gioco
│   ├── rivelazione/         ← inserimento risultati post-parto
│   └── nuovo-evento/        ← wizard creazione evento
├── vota/[codice]/           ← form voto pubblico (no login)
└── regia-segreta-9832/      ← Admin dashboard
    ├── page.tsx             ← P1 + P2 integrate
    ├── actions.ts           ← P1 actions + Radar Frodi actions
    ├── p2-actions.ts        ← Coupon + Campagne + Link Affiliazione
    ├── RadarFrodi.tsx        ← pannello antifrode admin
    ├── CouponManager.tsx    ← gestione coupon promozionali
    ├── CampagnaManager.tsx  ← tracking influencer click/conversioni
    └── AffiliazionePanel.tsx ← link affiliazione B2B2C
```

---

## 7. Admin Dashboard — Regia (`/regia-segreta-9832`)

### P1 — Controllo Operativo
- **KPI Supremi**: Iscritti, Premium, Eventi Attivi, Pronostici, Views, CVR, Fatturato Affiliati
- **Anagrafica Utenti**: toggle Premium, impersonazione read-only
- **Moderazione Eventi**: chiudi/elimina evento
- **IP Ban Console**: ban/unban manuale con TTL Redis
- **Radar Frodi**: voti sospetti (VPN flag, IP rapidi), azioni ban/clear/elimina
- **Audit Log**: registro immutabile di tutte le operazioni

### P2 — Growth, Marketing & Fatturato
- **Sistema Coupon**: genera codici con prefisso creator, tipi PREMIUM_USER / PREMIUM_EVENTO / SCONTO_PCT
- **Campagne Influencer**: tracking `?ref=CODICE` → click + conversioni + CVR per creator
- **Link Affiliazione B2B2C**: Amazon / Nidodigrazia, click tracking, commissioni dichiarate

---

## 8. Autenticazione — Flusso Implementato

### Email/Password
- `loginAction` / `signupAction` in `src/app/auth/actions.ts`

### Google OAuth
- Callback: `src/app/auth/callback/route.ts` → `exchangeCodeForSession()` → upsert Prisma `users` → redirect `/dashboard`
- Google OAuth abilitato in Supabase → Sign In / Providers → Google ✅

### Nota critica
`signupAction` (email/password) NON crea il record Prisma `users`. Verificare che esista un trigger Supabase `on auth.users insert → insert into public.users`, oppure gestirlo esplicitamente nella callback.

---

## 9. Componenti Dashboard Creatore

- **Sidebar** (`src/components/dashboard/Sidebar.tsx`): nav dark, banner PRO Plan (solo free), eventi attivi con countdown
- **Dashboard home** (`dashboard/page.tsx`): empty state con 3 passi + active state con quick actions, stat cards, checklist "Prossimi passi", PRO upsell
- **Gestione Profilo** (`dashboard/profilo/`): sempre accessibile anche senza eventi — mostra Account/GDPR, e CTA "Crea evento" se non ci sono eventi

---

## 10. Regole per le Sessioni Future

- **NON usare Clerk** — solo Supabase Auth per le mamme
- **Zod v4**: usare `.issues[0].message` non `.errors`
- **Prisma**: dopo ogni modifica schema → `prisma db push` + `prisma generate`
- **Admin route**: sempre `/regia-segreta-9832`, mai `/admin`
- Ogni nuova feature: validazione Zod su input/output
- Non mescolare logica app mobile con questo repo
- Test in locale: `http://localhost:3000` (nell'allowlist Supabase)
- Dopo ogni commit: `git push origin main` (automatico per convenzione del progetto)
- **PROXYCHECK_KEY**: env var opzionale per aumentare quota VPN detection da 100 a 1000/giorno
