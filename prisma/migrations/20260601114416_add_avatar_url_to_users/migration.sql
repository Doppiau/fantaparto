-- AlterTable
ALTER TABLE "events" ALTER COLUMN "stato" SET DEFAULT 'IN_CORSO';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ALTER COLUMN "nome" DROP NOT NULL;
