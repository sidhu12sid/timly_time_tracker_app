-- Billing rate now lives only on projects; drop the client default rate.
ALTER TABLE "clients" DROP COLUMN "default_hourly_rate";
