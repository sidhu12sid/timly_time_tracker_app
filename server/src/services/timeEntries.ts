import * as timeEntriesData from "../data/timeEntries.js";
import { getProjectForRateResolution } from "../data/projects.js";
import { resolveHourlyRate } from "./rates.js";
import { HttpError } from "../lib/httpError.js";
import type { CreateTimeEntryInput } from "../schemas/index.js";

function secondsBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

export function listTimeEntries(userId: string) {
  return timeEntriesData.listTimeEntries(userId);
}

export async function createTimeEntry(userId: string, input: CreateTimeEntryInput) {
  const project = await getProjectForRateResolution(input.projectId, userId);
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  // Snapshot the rate once, now (from the project). Never recomputed.
  const hourlyRate = resolveHourlyRate(project);
  const isBillable = input.isBillable ?? project.isBillableDefault;

  // Logging an already-finished entry (endTime provided) -> stored as stopped.
  if (input.endTime) {
    const accumulatedSeconds = secondsBetween(input.startTime, input.endTime);
    return timeEntriesData.createTimeEntry({
      userId,
      projectId: input.projectId,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes: Math.round(accumulatedSeconds / 60),
      status: "stopped",
      accumulatedSeconds,
      segmentStartedAt: null,
      hourlyRate,
      isBillable,
    });
  }

  // Starting a live timer — only one may run at a time.
  const existing = await timeEntriesData.findRunningTimer(userId);
  if (existing) {
    throw new HttpError(409, "A timer is already running");
  }

  return timeEntriesData.createTimeEntry({
    userId,
    projectId: input.projectId,
    description: input.description,
    startTime: input.startTime,
    endTime: null,
    durationMinutes: null,
    status: "running",
    accumulatedSeconds: 0,
    segmentStartedAt: input.startTime,
    hourlyRate,
    isBillable,
  });
}

export async function pauseTimer(userId: string, id: string) {
  const entry = await timeEntriesData.getTimeEntry(id, userId);
  if (!entry) throw new HttpError(404, "Time entry not found");
  if (entry.status !== "running" || !entry.segmentStartedAt) {
    throw new HttpError(409, "Timer is not running");
  }
  const banked = entry.accumulatedSeconds + secondsBetween(entry.segmentStartedAt, new Date());
  return timeEntriesData.pauseTimeEntry(id, banked);
}

// Start/resume timing an entry. Works on a paused entry (resume) or a stopped
// one (reopen and continue). Banked time is preserved either way.
export async function resumeTimer(userId: string, id: string) {
  const entry = await timeEntriesData.getTimeEntry(id, userId);
  if (!entry) throw new HttpError(404, "Time entry not found");
  if (entry.status === "running") {
    throw new HttpError(409, "Timer is already running");
  }
  // Don't allow two live timers at once.
  const running = await timeEntriesData.findRunningTimer(userId);
  if (running) throw new HttpError(409, "Another timer is already running");

  return timeEntriesData.resumeTimeEntry(id, new Date());
}

export async function stopTimer(userId: string, id: string) {
  const entry = await timeEntriesData.getTimeEntry(id, userId);
  if (!entry) throw new HttpError(404, "Time entry not found");
  if (entry.status === "stopped") {
    throw new HttpError(409, "Time entry is already stopped");
  }

  // Bank the final live segment if it was running, then freeze the total.
  const now = new Date();
  const extra =
    entry.status === "running" && entry.segmentStartedAt
      ? secondsBetween(entry.segmentStartedAt, now)
      : 0;
  const total = entry.accumulatedSeconds + extra;

  return timeEntriesData.stopTimeEntry(id, total, Math.round(total / 60), now);
}

export async function deleteTimeEntry(userId: string, id: string) {
  const count = await timeEntriesData.deleteTimeEntry(userId, id);
  if (count === 0) throw new HttpError(404, "Time entry not found");
}
