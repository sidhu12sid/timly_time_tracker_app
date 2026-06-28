import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./controllers/auth.js";
import { currenciesRouter } from "./controllers/currencies.js";
import { clientsRouter } from "./controllers/clients.js";
import { projectsRouter } from "./controllers/projects.js";
import { timeEntriesRouter } from "./controllers/timeEntries.js";
import { dashboardRouter } from "./controllers/dashboard.js";

export function createApp() {
  const app = express();

  // Restrict CORS to the client origin in production; allow all in dev.
  app.use(cors(env.CLIENT_ORIGIN ? { origin: env.CLIENT_ORIGIN } : {}));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Public endpoints (no session required). Mounted before the currentUser
  // shim so they don't trigger demo-user resolution.
  app.use("/api/auth", authRouter);
  app.use("/api/currencies", currenciesRouter);

  // Everything below requires a valid JWT (sets res.locals.userId).
  app.use("/api", requireAuth);
  app.use("/api/clients", clientsRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/time-entries", timeEntriesRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(errorHandler);

  return app;
}
