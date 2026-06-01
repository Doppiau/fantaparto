-- ============================================================
-- FantaParto — Auth Sync: auth.users → public.users
-- Versione 2 — aggiunge avatar_url e gestione corretta Google OAuth
--
-- ESEGUIRE NEL SEGUENTE ORDINE:
--   1. prisma/migrations/…/migration.sql   (crea le tabelle via Prisma)
--   2. Questo file                          (aggiunge colonna e trigger)
--   3. 02_row_level_security.sql
--
-- IDEMPOTENTE: sicuro da ri-eseguire su DB esistenti.
-- ============================================================


-- ── Sezione 1: Struttura tabella ─────────────────────────────────────────────
--
-- CREATE TABLE IF NOT EXISTS copre un'installazione fresh.
-- Le ALTER TABLE ADD COLUMN IF NOT EXISTS coprono un DB già esistente
-- creato dalla migration Prisma senza avatar_url / con nome NOT NULL.

CREATE TABLE IF NOT EXISTS public.users (
    id          UUID         NOT NULL,
    email       TEXT         NOT NULL,
    nome        TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT users_pkey      PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

-- Aggiunge avatar_url se mancante (upgrade da schema precedente)
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Rende nome nullable se era NOT NULL (upgrade da schema precedente)
ALTER TABLE public.users
    ALTER COLUMN nome DROP NOT NULL;


-- ── Sezione 2: Funzione trigger ──────────────────────────────────────────────
--
-- MAPPATURA METADATI GOOGLE OAUTH
-- ─────────────────────────────────────────────────────────────────────────────
-- Google invia al provider OAuth questi campi principali:
--   { "name": "Mario Rossi", "given_name": "Mario", "family_name": "Rossi",
--     "picture": "https://lh3.googleusercontent.com/…",
--     "email": "mario@gmail.com", "email_verified": true }
--
-- Supabase Auth li normalizza e li scrive in auth.users.raw_user_meta_data:
--   { "full_name": "Mario Rossi",   ← nome completo (da Google "name")
--     "name":      "Mario Rossi",   ← copia diretta
--     "avatar_url": "https://…",   ← Supabase rinomina "picture" → "avatar_url"
--     "email":     "mario@gmail.com",
--     "email_verified": true,
--     "iss": "https://accounts.google.com",
--     "provider_id": "1234567890"  }
--
-- Per Email/Password signup, l'app passa:
--   supabase.auth.signUp({ email, password, options: { data: { nome: "…" } } })
-- Quindi raw_user_meta_data contiene: { "nome": "Anna Verdi" }
--
-- PRIORITÀ DI RISOLUZIONE DEL NOME:
--   1. raw_user_meta_data->>'nome'       → signup Email/Password (campo custom)
--   2. raw_user_meta_data->>'full_name'  → Google OAuth (normalizzato da Supabase)
--   3. raw_user_meta_data->>'name'       → altri provider OAuth
--   4. split_part(email, '@', 1)         → fallback finale solo su INSERT (non su UPDATE)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    -- Risolve il nome senza usare split_part come fallback:
    -- NULL qui significa "non c'è metadato nome → conserva quello esistente sull'UPDATE"
    v_nome       TEXT := COALESCE(
                             NEW.raw_user_meta_data->>'nome',
                             NEW.raw_user_meta_data->>'full_name',
                             NEW.raw_user_meta_data->>'name'
                         );
    v_avatar_url TEXT := NEW.raw_user_meta_data->>'avatar_url';
BEGIN
    INSERT INTO public.users (id, email, nome, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        -- Sull'INSERT iniziale: se nessun metadato nome è disponibile, usa la
        -- parte locale dell'email come placeholder ("mario" da "mario@gmail.com").
        -- Sull'UPSERT (UPDATE trigger): questo valore è nella colonna EXCLUDED,
        -- ma il SET usa v_nome (senza split_part) per non sovrascrivere un nome
        -- già salvato in precedenza con un placeholder da email.
        COALESCE(v_nome, split_part(NEW.email, '@', 1)),
        v_avatar_url,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
        SET
            -- email: aggiorna sempre (l'utente può cambiare email su Supabase)
            email      = EXCLUDED.email,

            -- nome: usa il metadato se disponibile; altrimenti conserva il
            -- valore già presente nel DB (evita di sovrascrivere con placeholder)
            nome       = COALESCE(v_nome, public.users.nome),

            -- avatar_url: usa il nuovo se disponibile; altrimenti conserva
            -- (es. se l'evento scatenante è solo un cambio email senza OAuth refresh)
            avatar_url = COALESCE(v_avatar_url, public.users.avatar_url),

            updated_at = NOW();

    RETURN NEW;
END;
$$;


-- ── Sezione 3: Registrazione trigger ─────────────────────────────────────────

-- Signup (Email/Password e Google OAuth — entrambi producono un INSERT in auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Aggiornamento profilo (cambio email o refresh avatar da provider OAuth)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE OF email, raw_user_meta_data ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
