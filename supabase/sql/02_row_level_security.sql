-- ============================================================
-- FantaParto — Row Level Security (RLS)
-- IDEMPOTENTE: fa DROP IF EXISTS prima di ogni policy.
--
-- ARCHITETTURA sicurezza:
--   - Le API Next.js usano il SERVICE ROLE (bypass RLS) tramite Prisma.
--   - RLS protegge da accessi diretti PostgREST / SQL senza passare dalle API.
--   - auth.uid() = UUID dell'utente autenticato via Supabase Auth JWT.
-- ============================================================

-- ── Drop policy esistenti (idempotenza) ───────────────────────────────────────

DROP POLICY IF EXISTS "users: read own profile"            ON public.users;
DROP POLICY IF EXISTS "users: update own profile"          ON public.users;
DROP POLICY IF EXISTS "events: insert own"                 ON public.events;
DROP POLICY IF EXISTS "events: read own"                   ON public.events;
DROP POLICY IF EXISTS "events: update own active"          ON public.events;
DROP POLICY IF EXISTS "events: delete own"                 ON public.events;
DROP POLICY IF EXISTS "predictions: public insert"         ON public.predictions;
DROP POLICY IF EXISTS "predictions: event owner can read"  ON public.predictions;

-- ── Abilita RLS ───────────────────────────────────────────────────────────────

ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs  ENABLE ROW LEVEL SECURITY;

-- ── TABELLA: users ────────────────────────────────────────────────────────────

CREATE POLICY "users: read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT gestito dal trigger handle_new_user (SECURITY DEFINER) — nessuna policy

-- ── TABELLA: events ───────────────────────────────────────────────────────────

CREATE POLICY "events: insert own"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events: read own"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

-- Aggiornamento consentito solo su eventi ancora aperti alla votazione
CREATE POLICY "events: update own active"
  ON public.events FOR UPDATE
  USING (auth.uid() = user_id AND stato = 'IN_CORSO')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events: delete own"
  ON public.events FOR DELETE
  USING (auth.uid() = user_id);

-- ── TABELLA: predictions ──────────────────────────────────────────────────────

-- Chiunque (anonimo) può inserire — validazione avviene nell'API Next.js
CREATE POLICY "predictions: public insert"
  ON public.predictions FOR INSERT
  WITH CHECK (true);

-- Solo la mamma proprietaria dell'evento può leggere i voti
CREATE POLICY "predictions: event owner can read"
  ON public.predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = predictions.event_id
        AND e.user_id = auth.uid()
    )
  );

-- ── TABELLA: audit_logs ───────────────────────────────────────────────────────
-- Nessuna policy = deny-all per utenti diretti.
-- Accesso esclusivamente via service role nell'API admin.
