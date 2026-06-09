# FantaParto — Contesto di Progetto

## 1. Visione del Progetto

**FantaParto** è un micro-SaaS event-based: un gioco sociale per le gravidanze in stile fantacalcio.

- Le **mamme** creano l'evento dalla web app e configurano le domande di voto (sesso, data, peso, ora, lunghezza, capelli, occhi, domande custom Premium).
- Gli **invitati** votano via browser (senza login) tramite un link condiviso su WhatsApp.
- Al momento della nascita, il sistema calcola automaticamente la classifica e genera un PDF ricordo.

---

## 2. Architettura dei Domini

| Dominio | Scopo | Hosting |
|---|---|---|
| `fantaparto.com` | Sito pubblico, Landing Page, dashboard mamme, interfaccia di voto | Vercel (Next.js) |
| `fantaparto.app` | Backend, Database e API | Supabase |

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
| ORM / DB | Prisma ORM v7 (output: `generated/prisma`) + Supabase (PostgreSQL) | `prisma db push` + `prisma generate` dopo ogni modifica schema |
| Cache / Rate Limiting | Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`) | Voto + login + IP ban + VPN cache |
| Validazione | Zod v4 | Usare `.issues[0].message`, non `.errors` |
| Autenticazione | Supabase Auth | Solo per le mamme — **NON usare Clerk** |
| Styling | Tailwind CSS v4 + inline styles | Design token definiti per componente; inline `display` sovrascrive Tailwind `hidden` — usare solo className per display |
| VPN Detection | proxycheck.io | `src/lib/vpn.ts`, cache Redis 6h, env `PROXYCHECK_KEY` |
| Transizioni pagina | `next-view-transitions` (Vercel) | Wrappa `<ViewTransitions>` nella root layout |
| Notifiche email | Resend (stub) | `src/lib/notifications.ts` — attivo con env `RESEND_API_KEY` |
| Pagamenti | Stripe (da implementare) | Route placeholder in `/dashboard/upgrade` |

---

## 4. Schema Prisma — Modelli Completi

### `User`
```
id            UUID (= Supabase auth.users.id)
email         String unique
nome          String?
avatarUrl     String?       — URL foto profilo (Supabase Storage bucket "avatars")
isPremium     Boolean       — piano account; SEMPRE sincronizzato con Event.isPremium
couponRiscattato String?    — codice coupon usato per attivare Premium
pianoAttivatoAt  DateTime?  — data attivazione Premium
createdAt, updatedAt
```

### `Event`
```
id, userId, nomeBimbo?, dataPresuntaParto, codiceCondivisione (unique)
stato              "IN_CORSO" | "PRONTO_RIVELAZIONE" | "CONCLUSO"
isPremium          Boolean  — DEVE essere sincronizzato con User.isPremium
                             (riscattaCouponAction fa updateMany su tutti gli eventi)

— Toggle pronostici (tutti default true) —
sessoAttivo, dataAttiva, pesoAttivo, lunghezzaAttiva, oraAttiva, capelliAttivo, occhiAttivo
customQuestions    Json?    — solo Premium

— Personalizzazione visiva —
temaColore         "ROSA" | "CELESTE" | "NEUTRO"  (default NEUTRO)
                   applicato alla pagina /vota/[codice] e Hype Space

— Privacy & controllo —
classificaPrivata, hypeSpaceAnonimo, votiBloccati

— Gestione —
archiviato         Boolean  — eventi archiviati non appaiono nella lista attivi

— Notifiche —
notificheVoto      Boolean  — email al creatore ad ogni voto
digestNotifiche    "DISATTIVATO" | "GIORNALIERO" | "SETTIMANALE"
avvisoDpp          Boolean  — email 7 giorni prima della DPP
limitNotificaInviata Boolean — true dopo che è stata inviata la notifica "limite Free raggiunto"

— Risultati reali (post-parto) —
realeSesso, realeData, realePeso, realeLunghezza, realeOra, realeCapelli, realeOcchi
realeCustomAnswers Json?

visualizzazioniLink Int     — contatore visite link /vota/[codice]
createdAt, updatedAt
```

### `Prediction`
```
id, eventId, nomeInvitato, emailInvitato?, messaggioAugurio?
deviceFingerprint  String  — deduplicazione voti
                             voti manuali usano "manual-[timestamp]-[random]"

— Pronostici —
votoSesso?, votoData?, votoPeso?, votoLunghezza?, votoOra?, votoCapelli?, votoOcchi?
votoCustomAnswers Json?
punteggioOttenuto Int?     — null finché l'evento non è CONCLUSO

— Antifrode —
ipAddress?, vpnFlag, flagSospetto, motivazioneSospetto?
createdAt
```

### `Coupon`
```
codice (unique), tipo "PREMIUM_USER"|"PREMIUM_EVENTO"|"SCONTO_PCT"
creatorTag?, scontoPct?, usoMax?, usoCorrente, scadenza?, attivo, note?
```

### `CampagnaInfluencer` · `LinkAffiliazione` · `AuditLog`
Invariati rispetto alla versione precedente.

---

## 5. Paywall Engine — Free vs Premium

### Piano Free (default)
- **Max 20 voti** per evento — al 21° tentativo: `{ limitReached: true }` + schermata `EventoPienoView`
- **Metriche base only**: Sesso, Data, Peso — le avanzate (Ora, Lunghezza, Capelli, Occhi) sono bloccate server-side
- Enforcement a tre livelli: `api/v1/predict`, `api/v1/event` (creazione), `VotaPage` (override metriche)
- Al 20° voto: email notifica al genitore via `notificaLimiteRaggiunto()` + `limitNotificaInviata=true`

### Piano Premium
- Voti illimitati, tutte le 7 metriche, domande custom, grafici avanzati nell'Hype Space
- Si attiva via: **coupon** (riscattaCouponAction) o **admin toggle** (regia)
- `riscattaCouponAction` aggiorna `User.isPremium = true` **E** `Event.isPremium = true` su tutti gli eventi (transazione)
- `api/v1/event` crea nuovi eventi con `isPremium = userIsPremium` (letto dal DB, non dal body)

### Pagina upgrade
`/dashboard/upgrade` — confronto Free/Premium, CTA Stripe (placeholder), campo coupon prominente.
Tutti i link "Sblocca Premium" dell'app puntano qui.

---

## 6. Sicurezza

### Admin route
- `/regia-segreta-9832` — **mai** `/admin`
- Accesso a rotte admin standard → finto 404

### Rate Limiting (multi-livello)
- `rateLimitVoto` — 5 req/10s per IP
- `rateLimitVotoPerEvento` — 3 voti/ora per IP per evento
- `recordViolationAndMaybeBan()` → ban auto 1h dopo 2 violazioni in 10min
- `rateLimitAuth` — 10 req/60s per IP

### Honeypot + VPN
- Campo `_hp` nel form voto — se compilato → fake 201
- VPN flag su tutti i voti, non bloccano ma flaggano

### Calcolo classifica atomico
- `updateMany WHERE stato='IN_CORSO'` come lock ottimistico → previene doppi calcoli

---

## 7. Struttura Route Principali

```
src/app/
├── page.tsx                    ← Landing page pubblica
├── layout.tsx                  ← Root layout con <ViewTransitions>
├── auth/                       ← Login, signup, Google OAuth callback
├── api/
│   ├── v1/predict/             ← POST voto (hardened: rate limit, VPN, honeypot, paywall)
│   ├── v1/event/               ← POST creazione evento (enforces Free metric restrictions)
│   ├── upload/avatar/          ← POST upload foto profilo → Supabase Storage
│   ├── qr/                     ← GET genera QR code PNG (validazione URL fantaparto.com/vota/*)
│   └── og/story/ og/voto/      ← OpenGraph image generation
├── vota/[codice]/
│   ├── page.tsx                ← Routing: form voto | classifica | evento pieno | PRONTO_RIVELAZIONE
│   ├── VotaClient.tsx          ← Form voto (tema colore, metriche dinamiche, success → Hype Space)
│   ├── ClassificaView.tsx      ← Classifica pubblica post-parto
│   └── hype/
│       ├── page.tsx            ← Server: aggrega stats (sesso, peso, date, lunghezza, capelli, occhi, ora)
│       └── HypeSpaceClient.tsx ← UI grafici live + hypeSpaceAnonimo blur + share + countdown
├── dashboard/                  ← Area mamme (auth required)
│   ├── page.tsx                ← Overview: empty state + active state (hero, stats, prossimi passi)
│   ├── layout.tsx              ← Sidebar + auth guard
│   ├── upgrade/                ← Pagina upgrade Premium (CTA Stripe + coupon)
│   ├── [eventId]/
│   │   ├── page.tsx            ← Dashboard evento: stats, bubble chart, tabella voti, moderazione
│   │   ├── actions.ts          ← toggleAction, eliminaPrediction, inserisciRisultati, aggiungiVotoManuale
│   │   ├── components/
│   │   │   ├── AggiungiVotoButton.tsx  ← bottone + modal per voto manuale
│   │   │   ├── AggiungiVotoModal.tsx   ← form voto manuale (rispetta metriche attive + Free limit)
│   │   │   ├── TabGiuria.tsx           ← lista partecipanti con elimina voto
│   │   │   └── TabRegole.tsx           ← regole di gioco + upsell Premium
│   │   └── grande-giorno/      ← Wizard inserimento risultati reali + calcolo classifica
│   ├── eventi/                 ← Lista eventi con archivia/ripristina/duplica
│   ├── profilo/                ← Foto, tema, codice, notifiche, coupon, WhatsApp, QR, sicurezza
│   ├── settings/               ← Configurazione metriche con punteggi (MetrichePanel)
│   ├── rivelazione/            ← Redirect verso [eventId]/grande-giorno
│   └── nuovo-evento/
│       ├── page.tsx            ← Server wrapper: fetch isPremium, renders NuovoEventoWizard
│       ├── NuovoEventoWizard.tsx ← Client wizard 4-step (riceve isPremium prop)
│       └── steps/Step2Metriche.tsx ← Lock visivo metriche Premium per utenti Free
└── regia-segreta-9832/         ← Admin dashboard
    ├── page.tsx                ← KPI, tabelle utenti/eventi, audit log, IP ban, radar frodi
    ├── actions.ts              ← closeEvent, toggleUserPremium (aggiorna User + tutti Event), giftPremium, banIp
    ├── RadarFrodi.tsx          ← Pannello antifrode
    ├── CouponManager.tsx       ← Gestione coupon
    ├── CampagnaManager.tsx     ← Tracking influencer
    └── AffiliazionePanel.tsx   ← Link affiliazione B2B2C
```

---

## 8. Componenti Condivisi

```
src/components/
├── dashboard/
│   ├── Sidebar.tsx         ← Nav dark, banner PRO → /dashboard/upgrade
│   ├── CopyLinkButton.tsx
│   ├── ModerateButton.tsx  ← Elimina voto + reset fingerprint
│   └── EliminaEventoButton.tsx
└── widgets/                ← Usati sia in dashboard che in Hype Space
    ├── SessoWidget.tsx         ← Bolle animate Maschio/Femmina
    ├── BilanciaPesoWidget.tsx  ← Gauge peso medio
    ├── CalendarioWidget.tsx    ← Heatmap TotoData mese DPP
    └── CountdownCard.tsx       ← Conto alla rovescia live
```

---

## 9. Feature Gestione Profilo (`/dashboard/profilo`)

| Feature | Stato |
|---|---|
| Upload foto profilo | `POST /api/upload/avatar` → Supabase Storage bucket "avatars" |
| Tema colore evento | ROSA / CELESTE / NEUTRO — applicato a `/vota/[codice]` e Hype Space |
| Rinomina codice condivisione | Validazione slug `[a-z0-9-]+`, unicità verificata |
| Archivia / Ripristina evento | `archiviato` bool — archiviati separati in `/dashboard/eventi` |
| Duplica evento | Nuovo evento con stesse impostazioni, codice `copia-[random]` |
| Notifiche voto / DPP / digest | Toggle + selector DISATTIVATO/GIORNALIERO/SETTIMANALE |
| Coupon & Piano | Riscatta → Premium istantaneo + propagazione a tutti gli eventi |
| Messaggio WhatsApp | Copia testo pre-compilato con link |
| QR Code evento | Generato via `/api/qr` con download PNG |
| Disconnetti tutti i dispositivi | `supabase.auth.signOut({ scope: "global" })` |
| Esporta dati (GDPR) | JSON download con tutti i voti e messaggi |
| Elimina account | Con doppia conferma — cascata completa |

---

## 10. Feature Hype Space (`/vota/[codice]/hype`)

Pagina pubblica (no login), accessibile dopo il voto. Mostra:
- Conto alla rovescia live alla DPP
- Widget sesso animato (bolle maschio/femmina)
- Gauge peso medio con min/max
- Heatmap calendario TotoData
- Metriche avanzate (solo Premium): lunghezza, capelli, occhi, fascia oraria
- Overlay blur se `hypeSpaceAnonimo = true`
- Pulsante "Condividi" (copia link Hype Space)
- Rispetta il tema colore dell'evento

---

## 11. Feature Voti Manuali

Dalla dashboard evento (`/dashboard/[eventId]`), bottone "✏️ Aggiungi manuale":
- Form con tutti i campi attivi dell'evento
- Rispetta paywall Free (20 voti)
- `deviceFingerprint = "manual-[timestamp]-[random]"`
- Badge verde "manuale" nella tabella (riconoscimento visivo)

---

## 12. Autenticazione

### Email/Password
- `loginAction` / `signupAction` in `src/app/auth/actions.ts`

### Google OAuth
- Callback: `src/app/auth/callback/route.ts` → `exchangeCodeForSession()` → upsert Prisma `users` → redirect `/dashboard`

### Nota critica
`signupAction` NON crea il record Prisma `users`. Serve trigger Supabase `on auth.users insert → insert into public.users` o gestione esplicita nella callback.

---

## 13. Regole Critiche per Sessioni Future

1. **NON usare Clerk** — solo Supabase Auth
2. **Zod v4**: `.issues[0].message`, non `.errors[0].message`
3. **Dopo ogni modifica schema**: `prisma db push` poi `prisma generate`
4. **Admin route**: sempre `/regia-segreta-9832`, mai `/admin`
5. **Tailwind + inline style conflict**: non mettere `display` nell'inline `style` se il componente usa `hidden` o `md:hidden` — l'inline vince sempre sulla classe Tailwind
6. **isPremium sync**: quando si modifica `User.isPremium`, aggiornare SEMPRE anche tutti i `Event.isPremium` con `updateMany`
7. **Metriche Free**: enforcement su 3 livelli (api/v1/predict, api/v1/event, VotaPage) — non fidarsi del client
8. **Pagamenti mobile**: Apple/Google richiedono IAP nativi per digital goods nelle app store. Stripe web è legittimo se l'acquisto avviene nel browser
9. **Nuova feature**: validazione Zod sia in input che output
10. **Dopo ogni commit**: `git push origin main`
11. **Test locale**: `http://localhost:3000` (nell'allowlist Supabase)

---

## 14. Variabili d'Ambiente Necessarie

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      ← upload avatar, delete utente Auth

# Database
DATABASE_URL=                   ← Supabase pooler (PgBouncer)
DIRECT_URL=                     ← Supabase direct (per prisma db push)

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Opzionali
PROXYCHECK_KEY=                 ← VPN detection (100→1000 req/giorno)
RESEND_API_KEY=                 ← Email notifiche (stub senza questa env)

# Da implementare
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```
