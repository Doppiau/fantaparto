-- ============================================================
-- FantaParto — Migrazione iniziale
-- Generata con: prisma migrate diff --from-empty --to-schema
-- Da applicare su Supabase con: npx prisma migrate deploy
-- ============================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "nome_bimbo" TEXT,
    "data_presunta_parto" TIMESTAMP(3) NOT NULL,
    "codice_condivisione" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'ATTIVO',
    "visualizzazioni_link" INTEGER NOT NULL DEFAULT 0,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "sesso_attivo" BOOLEAN NOT NULL DEFAULT true,
    "data_attiva" BOOLEAN NOT NULL DEFAULT true,
    "peso_attivo" BOOLEAN NOT NULL DEFAULT true,
    "lunghezza_attiva" BOOLEAN NOT NULL DEFAULT true,
    "ora_attiva" BOOLEAN NOT NULL DEFAULT true,
    "capelli_attivo" BOOLEAN NOT NULL DEFAULT true,
    "occhi_attivo" BOOLEAN NOT NULL DEFAULT true,
    "custom_questions" JSONB,
    "reale_sesso" TEXT,
    "reale_data" TIMESTAMP(3),
    "reale_peso" INTEGER,
    "reale_lunghezza" INTEGER,
    "reale_ora" TEXT,
    "reale_capelli" TEXT,
    "reale_occhi" TEXT,
    "reale_custom_answers" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "nome_invitato" TEXT NOT NULL,
    "email_invitato" TEXT,
    "messaggio_augurio" TEXT,
    "device_fingerprint" TEXT NOT NULL,
    "voto_sesso" TEXT,
    "voto_data" TIMESTAMP(3),
    "voto_peso" INTEGER,
    "voto_lunghezza" INTEGER,
    "voto_ora" TEXT,
    "voto_capelli" TEXT,
    "voto_occhi" TEXT,
    "voto_custom_answers" JSONB,
    "punteggio_ottenuto" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "admin_id" TEXT NOT NULL,
    "azione" TEXT NOT NULL,
    "dettagli" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_codice_condivisione_key" ON "events"("codice_condivisione");

-- CreateIndex
CREATE INDEX "events_user_id_idx" ON "events"("user_id");

-- CreateIndex
CREATE INDEX "events_codice_condivisione_idx" ON "events"("codice_condivisione");

-- CreateIndex
CREATE INDEX "predictions_event_id_idx" ON "predictions"("event_id");

-- CreateIndex
CREATE INDEX "predictions_device_fingerprint_idx" ON "predictions"("device_fingerprint");

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "events"
    ADD CONSTRAINT "events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions"
    ADD CONSTRAINT "predictions_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
