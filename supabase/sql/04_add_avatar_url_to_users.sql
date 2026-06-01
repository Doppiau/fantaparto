-- ============================================================
-- FantaParto — Migration: aggiunge avatar_url e rende nome nullable
--
-- USARE QUESTO FILE SOLO se hai già eseguito la migration Prisma iniziale
-- e stai aggiornando un DB esistente senza voler ri-eseguire tutto lo script 01.
--
-- Se stai partendo da zero: lo script 01_auth_sync_trigger.sql
-- include già queste ALTER TABLE — non serve eseguire questo file.
-- ============================================================

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.users
    ALTER COLUMN nome DROP NOT NULL;

COMMENT ON COLUMN public.users.avatar_url IS
    'URL immagine profilo. Valorizzato automaticamente dal trigger handle_new_user() per utenti Google OAuth (raw_user_meta_data->>avatar_url).';

COMMENT ON COLUMN public.users.nome IS
    'Nome della mamma. Email/Password: passato come options.data.nome al signup. Google OAuth: estratto da raw_user_meta_data->>full_name.';
