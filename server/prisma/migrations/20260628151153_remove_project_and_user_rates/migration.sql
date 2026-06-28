/*
  Warnings:

  - You are about to drop the column `hourly_rate` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `hourly_rate` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projects" DROP COLUMN "hourly_rate";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "hourly_rate";
