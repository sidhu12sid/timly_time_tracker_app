import { Prisma } from "@prisma/client";

// Resolve a rate ONCE from the client's default. Returns null when unset —
// callers must handle the null case and never coerce it into NaN. Called only
// at entry creation; the result is snapshotted onto the time_entry and never
// re-derived afterward.
export function resolveHourlyRate(client: { defaultHourlyRate: Prisma.Decimal | null }): Prisma.Decimal | null {
  return client.defaultHourlyRate ?? null;
}

// Convert a validated nullable number from the API into a Prisma.Decimal.
export function toDecimal(value: number | null | undefined): Prisma.Decimal | null {
  return value == null ? null : new Prisma.Decimal(value);
}
