-- AlterTable
-- `password` is NOT NULL with no schema-level default. To backfill the existing
-- row(s), add it with a temporary empty-string default, then drop the default so
-- the column matches the Prisma schema (new inserts always supply a value).
ALTER TABLE "users" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otp_expires_at" TIMESTAMP(3),
ADD COLUMN     "password" TEXT NOT NULL DEFAULT '';

ALTER TABLE "users" ALTER COLUMN "password" DROP DEFAULT;
