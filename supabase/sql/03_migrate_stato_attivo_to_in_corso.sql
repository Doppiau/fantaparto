-- ============================================================
-- FantaParto — Migrazione dati: stato ATTIVO → IN_CORSO
--
-- QUANDO applicare:
--   Supabase Dashboard → SQL Editor → esegui UNA SOLA VOLTA
--   dopo aver deployato il codice che usa "IN_CORSO" come default.
--
-- PERCHÉ:
--   Il campo `stato` è una String senza vincolo DB (nessun enum Postgres).
--   La rinomina da "ATTIVO" a "IN_CORSO" è solo applicativa; questo script
--   allinea i dati esistenti in produzione al nuovo naming.
-- ============================================================

BEGIN;

UPDATE public.events
SET    stato      = 'IN_CORSO',
       updated_at = NOW()
WHERE  stato = 'ATTIVO';

-- Verifica post-migrazione
DO $$
DECLARE
  remaining INT;
BEGIN
  SELECT COUNT(*) INTO remaining FROM public.events WHERE stato = 'ATTIVO';
  IF remaining > 0 THEN
    RAISE EXCEPTION 'Migrazione incompleta: % righe hanno ancora stato = ATTIVO', remaining;
  END IF;
  RAISE NOTICE 'Migrazione completata. Nessun record ATTIVO rimasto.';
END;
$$;

COMMIT;
