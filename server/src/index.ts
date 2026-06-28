import { env } from "./env.js";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${env.PORT}`);
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
