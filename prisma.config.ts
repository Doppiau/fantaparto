import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Carica .env.local (priorità) poi .env come fallback
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL per le migrazioni (bypassa PgBouncer — richiesto da Prisma Migrate)
    url: process.env["DIRECT_URL"],
  },
});
