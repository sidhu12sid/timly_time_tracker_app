import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seed every ISO 4217 currency the runtime knows about. Intl gives us the
// complete code list and localized display names, so we don't hardcode ~300
// rows. Idempotent: re-running only fills in anything missing.
async function main() {
  const codes = Intl.supportedValuesOf("currency");
  const names = new Intl.DisplayNames(["en"], { type: "currency" });

  const data = codes.map((code) => ({
    code,
    name: names.of(code) ?? code,
  }));

  const result = await prisma.currency.createMany({ data, skipDuplicates: true });
  console.log(`Seeded currencies: ${result.count} new (of ${data.length} total).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
