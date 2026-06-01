# FantaParto — Contesto di Progetto

## 1. Visione del Progetto

**FantaParto** è un micro-SaaS event-based: un gioco sociale per le gravidanze in stile fantacalcio.

- Le **mamme** creano l'evento dall'app mobile e configurano le domande di voto (es. data di nascita, peso, nome, sesso).
- Gli **invitati** votano via browser (senza login) tramite un link condiviso su WhatsApp.
- Al momento della nascita, il sistema calcola automaticamente la classifica e genera un PDF ricordo.

---

## 2. Architettura dei Domini

| Dominio | Scopo | Hosting |
|---|---|---|
| `fantaparto.com` | Sito pubblico, Landing Page, dashboard mamme, interfaccia di voto | Vercel (Next.js) |
| `fantaparto.app` | Backend, Database e API per l'app mobile | Supabase |

### Supabase Project
- **Project ID:** `dvznrowaptxdnnitxvsd`
- **Supabase URL:** `https://dvznrowaptxdnnitxvsd.supabase.co`
- **Site URL configurato:** `https://fantaparto.com`
- **Redirect URLs autorizzati:**
  - `https://fantaparto.com/auth/calblback`
  - `http://localhost:3000/auth/callback`

---

## 3. Stack Tecnologico

| Categoria | Tecnologia | Note |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript (strict mode) | |
| ORM / DB | Prisma ORM + Supabase (PostgreSQL) | |
| Cache / Rate Limiting | Upstash Redis | Protezione brute-force su voto e login |
| Error Logging | Sentry | |
| Background Jobs | Inngest | Calcolo punteggi, invio PDF ricordo |
| Validazione | Zod | Validazione rigorosa su tutti gli input/output |
| Autenticazione | Supabase Auth | Solo per le mamme — **NON usare Clerk** |
| Styling | Tailwind CSS | |

---

## 4. Regole di Sicurezza Critiche

### 4.1 — Rotta Admin Offuscata
- La Dashboard Admin globale **non deve** usare la rotta `/admin`.
- Deve usare una rotta segreta offuscata, es. `/regia-segreta-9832`.
- Qualsiasi tentativo di accesso a `/admin` o rotte admin standard deve restituire un **finto errore 404** ("Pagina non trovata"), senza alcun indizio che la rotta esista.

### 4.2 — Rate Limiting
- Implementare Upstash Redis rate limiting sulle rotte di **voto** e di **login**.
- Obiettivo: prevenire brute-force, spam di voti e bypass del sistema.

### 4.3 — Calcolo Classifica Atomico
- Il calcolo della classifica al momento della nascita deve avvenire tramite una **transazione atomica sul database**.
- La transazione deve bloccare l'evento nello stato `CONCLUSO` in modo istantaneo, impedendo race condition o doppi calcoli.

---

## 5. Struttura dei Repository

**Strategia: Multi-Repo**

- **Questo repository** (`fantaparto-web`): contiene la parte Web e API — Next.js, Prisma, Supabase, tutto il codice server-side e la landing page.
- **Repository separato** (futuro): app nativa mobile (Flutter o Kotlin), da gestire in una sessione dedicata per ottimizzare i token di contesto.

---

## 6. Autenticazione — Flusso Implementato

### Email/Password
- `loginAction` / `signupAction` in `src/app/auth/actions.ts`
- Usa `supabase.auth.signInWithPassword` / `signUp`

### Google OAuth
- Handler client: `handleGoogleLogin()` in `src/app/auth/AuthPageClient.tsx`
  - Chiama `supabase.auth.signInWithOAuth({ provider: "google", redirectTo: origin/auth/callback })`
- Callback route: `src/app/auth/callback/route.ts`
  - Scambia il `code` con `exchangeCodeForSession()`
  - Fa **upsert** del record in Prisma `users` (necessario perché Google bypassa la signup action)
  - Redirige a `/dashboard`
- Google OAuth abilitato in Supabase → Sign In / Providers → Google ✅

### Nota critica sull'upsert utente
Quando una mamma si registra con email/password, la `signupAction` NON crea il record Prisma `users` — esiste solo l'utente Supabase Auth. Il record Prisma viene creato solo se necessario (es. da un trigger DB o manualmente). La callback Google gestisce l'upsert. Verificare che esista un trigger Supabase `on auth.users insert → insert into public.users` oppure gestirlo esplicitamente.

---

## 7. Note per le Sessioni Future

- Ricordare di non mescolare la logica dell'app mobile con questo repository.
- Ogni nuova feature deve passare per validazione Zod sia in input che in output.
- Non introdurre sistemi di autenticazione alternativi a Supabase Auth per le mamme.
- Il dominio `fantaparto.app` è solo Supabase — non ha pagine Next.js. Tutti i redirect OAuth usano `fantaparto.com`.
- Per testare in locale usare sempre `http://localhost:3000` — è nell'allowlist Supabase.
