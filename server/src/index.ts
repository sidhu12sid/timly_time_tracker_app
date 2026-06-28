import dns from "node:dns";
// Many container hosts (Render, etc.) have no outbound IPv6 route. Node may
// resolve a host's IPv6 (AAAA) record first and fail with ENETUNREACH. Prefer
// IPv4 so outbound calls (e.g. the Resend API) hit a reachable address.
dns.setDefaultResultOrder("ipv4first");

import { env } from "./env.js";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { ensureCurrenciesSeeded } from "./lib/seedCurrencies.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${env.PORT}`);
});

// Seed reference data on startup (idempotent). Logged, never fatal — a seeding
// hiccup shouldn't take the server down.
ensureCurrenciesSeeded().catch((err) => {
  console.error("Currency seeding failed:", err);
});

// Graceful shutdown so Prisma releases its pool.
async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
