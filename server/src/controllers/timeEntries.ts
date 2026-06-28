import { Router } from "express";
import { getUserId } from "../middleware/currentUser.js";
import { HttpError } from "../lib/httpError.js";
import { createTimeEntrySchema } from "../schemas/index.js";
import * as timeEntries from "../services/timeEntries.js";

export const timeEntriesRouter = Router();

// Pull the :id param with a guard (string | undefined under strict TS).
function requireId(id: string | undefined): string {
  if (!id) throw new HttpError(400, "Missing time entry id");
  return id;
}

timeEntriesRouter.get("/", async (_req, res) => {
  res.json(await timeEntries.listTimeEntries(getUserId(res)));
});

timeEntriesRouter.post("/", async (req, res) => {
  const input = createTimeEntrySchema.parse(req.body);
  const created = await timeEntries.createTimeEntry(getUserId(res), input);
  res.status(201).json(created);
});

timeEntriesRouter.delete("/:id", async (req, res) => {
  await timeEntries.deleteTimeEntry(getUserId(res), requireId(req.params.id));
  res.status(204).end();
});

// Pause a running timer.
timeEntriesRouter.patch("/:id/pause", async (req, res) => {
  res.json(await timeEntries.pauseTimer(getUserId(res), requireId(req.params.id)));
});

// Resume a paused timer.
timeEntriesRouter.patch("/:id/resume", async (req, res) => {
  res.json(await timeEntries.resumeTimer(getUserId(res), requireId(req.params.id)));
});

// Stop a timer (from running or paused) — finalizes the duration.
timeEntriesRouter.patch("/:id/stop", async (req, res) => {
  res.json(await timeEntries.stopTimer(getUserId(res), requireId(req.params.id)));
});
