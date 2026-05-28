-- ============================================================
-- FantaParto — Trigger: sincronizzazione auth.users → public.users
--
-- QUANDO applicare:
--   Supabase Dashboard → SQL Editor → incolla ed esegui
--   DOPO aver applicato prisma/migrations/20260528_init_schema/migration.sql
--
-- COSA fa:
--   Ogni volta che Supabase Auth crea un nuovo utente (signup della mamma),
--   questa funzione copia automaticamente id, email e nome nella tabella
--   public.users che Prisma usa per le query applicative.
--
--   Il campo "nome" viene letto da auth.users.raw_user_meta_data->>'nome',
--   che l'app mobile deve passare al momento del signup come:
--     supabase.auth.signUp({ email, password, options: { data: { nome: "..." } } })
-- ============================================================

-- ── Funzione trigger ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Mamma'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        nome       = EXCLUDED.nome,
        updated_at = NOW();

  RETURN NEW;
END;
$$;

-- ── Trigger sul signup ────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── Trigger sull'aggiornamento email ─────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
