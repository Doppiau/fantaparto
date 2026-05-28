-- ============================================================
-- FantaParto — Row Level Security (RLS)
--
-- QUANDO applicare:
--   Supabase Dashboard → SQL Editor → incolla ed esegui
--   DOPO aver eseguito 01_auth_sync_trigger.sql
--
-- ARCHITETTURA sicurezza:
--   - Le API Next.js usano il SERVICE ROLE (bypass RLS) tramite Prisma
--     per le operazioni server-side.
--   - RLS protegge da accessi diretti al DB (Supabase client lato browser,
--     PostgREST, SQL diretto) senza passare dalle nostre API.
--   - auth.uid() = UUID dell'utente autenticato via Supabase Auth JWT.
-- ============================================================

-- ── Abilita RLS su tutte le tabelle ──────────────────────────────────────────

ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABELLA: users
-- ============================================================

-- Una mamma può leggere e aggiornare solo il proprio profilo
CREATE POLICY "users: read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- L'inserimento è gestito solo dal trigger handle_new_user (SECURITY DEFINER)
-- Nessuna policy INSERT lato utente — il trigger bypassa RLS

-- ============================================================
-- TABELLA: events
-- ============================================================

-- Una mamma può creare eventi solo per se stessa
CREATE POLICY "events: insert own"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Una mamma può leggere solo i propri eventi
CREATE POLICY "events: read own"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

-- Una mamma può aggiornare solo i propri eventi ATTIVI
CREATE POLICY "events: update own active"
  ON public.events FOR UPDATE
  USING (auth.uid() = user_id AND stato = 'ATTIVO')
  WITH CHECK (auth.uid() = user_id);

-- Una mamma può eliminare solo i propri eventi
CREATE POLICY "events: delete own"
  ON public.events FOR DELETE
  USING (auth.uid() = user_id);

-- Gli invitati (non autenticati) possono leggere un evento tramite codice
-- condivisione per la pagina di voto — solo i campi necessari sono esposti
-- dall'API Next.js, non direttamente via PostgREST.
-- NON viene aggiunta una policy SELECT pubblica: il voto passa dall'API server.

-- ============================================================
-- TABELLA: predictions
-- ============================================================

-- Chiunque (anche non autenticato) può inserire un voto.
-- La validazione avviene nell'API Next.js prima di arrivare al DB.
-- Il service role usato da Prisma bypassa questa policy — è qui come
-- salvaguardia per accessi diretti PostgREST.
CREATE POLICY "predictions: public insert"
  ON public.predictions FOR INSERT
  WITH CHECK (true);

-- Una mamma può leggere i voti dei propri eventi
CREATE POLICY "predictions: event owner can read"
  ON public.predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = predictions.event_id
        AND e.user_id = auth.uid()
    )
  );

-- Nessuno può aggiornare o eliminare predictions direttamente
-- (operazioni admin passano dal service role nell'API)

-- ============================================================
-- TABELLA: audit_logs
-- ============================================================

-- Nessun accesso diretto da utenti autenticati o anonimi.
-- Scrittura e lettura esclusivamente via service role (API admin).
-- La tabella è di fatto inaccessibile da PostgREST.

-- (Nessuna policy = deny-all per default con RLS abilitato)
