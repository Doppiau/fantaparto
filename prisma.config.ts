import "dotenv/config";
import { defineConfig } from "prisma/config";

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
