import express from "express";
import cors from "cors";
import { currentUser } from "./middleware/currentUser.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./controllers/auth.js";
import { currenciesRouter } from "./controllers/currencies.js";
import { clientsRouter } from "./controllers/clients.js";
import { projectsRouter } from "./controllers/projects.js";
import { timeEntriesRouter } from "./controllers/timeEntries.js";
import { dashboardRouter } from "./controllers/dashboard.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Public endpoints (no session required). Mounted before the currentUser
  // shim so they don't trigger demo-user resolution.
  app.use("/api/auth", authRouter);
  app.use("/api/currencies", currenciesRouter);

  // SCAFFOLD auth shim — see middleware/currentUser.ts.
  app.use("/api", currentUser);
  app.use("/api/clients", clientsRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/time-entries", timeEntriesRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(errorHandler);

  return app;
}
