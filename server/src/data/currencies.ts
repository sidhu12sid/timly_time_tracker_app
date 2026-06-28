import { prisma } from "../lib/prisma.js";

export function listCurrencies() {
  return prisma.currency.findMany({ orderBy: { name: "asc" } });
}
