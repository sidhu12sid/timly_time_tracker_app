-- AlterTable: add pause/resume columns
ALTER TABLE "time_entries" ADD COLUMN     "accumulated_seconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "segment_started_at" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'running';

-- Backfill existing rows.
-- Completed entries -> stopped; bank their duration as seconds.
UPDATE "time_entries"
  SET "status" = 'stopped',
      "accumulated_seconds" = COALESCE("duration_minutes", 0) * 60
  WHERE "end_time" IS NOT NULL;

-- Previously-running entries (end_time IS NULL) -> running; current segment
-- started at start_time.
UPDATE "time_entries"
  SET "status" = 'running',
      "segment_started_at" = "start_time"
  WHERE "end_time" IS NULL;
