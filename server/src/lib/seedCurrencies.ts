import { prisma } from "./prisma.js";

// Idempotent currency seeding that runs in the app (no Prisma CLI / tsx needed),
// so it works on every deploy — including the prod image built with --omit=dev.
// Uses the runtime's Intl data for the full ISO 4217 list + display names.
export async function ensureCurrenciesSeeded(): Promise<void> {
  const existing = await prisma.currency.count();
  if (existing > 0) return; // already populated — nothing to do

  const codes = Intl.supportedValuesOf("currency");
  const names = new Intl.DisplayNames(["en"], { type: "currency" });
  const data = codes.map((code) => ({ code, name: names.of(code) ?? code }));

  const { count } = await prisma.currency.createMany({ data, skipDuplicates: true });
  console.log(`Seeded currencies on startup: ${count}`);
}
