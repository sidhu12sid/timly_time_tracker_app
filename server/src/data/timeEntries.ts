import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export function listTimeEntries(userId: string) {
  return prisma.timeEntry.findMany({
    where: { userId },
    orderBy: { startTime: "desc" },
    include: { project: { include: { client: true } } },
  });
}

// Only one timer may be actively running at a time (paused ones don't count).
export function findRunningTimer(userId: string) {
  return prisma.timeEntry.findFirst({
    where: { userId, status: "running" },
  });
}

export function getTimeEntry(id: string, userId: string) {
  return prisma.timeEntry.findFirst({ where: { id, userId } });
}

export function createTimeEntry(data: {
  userId: string;
  projectId: string;
  description: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  status: string;
  accumulatedSeconds: number;
  segmentStartedAt: Date | null;
  // Snapshotted at creation — never recomputed afterward.
  hourlyRate: Prisma.Decimal | null;
  isBillable: boolean;
}) {
  return prisma.timeEntry.create({ data });
}

// Pause: bank the current segment and clear the live segment marker.
export function pauseTimeEntry(id: string, accumulatedSeconds: number) {
  return prisma.timeEntry.update({
    where: { id },
    data: { status: "paused", accumulatedSeconds, segmentStartedAt: null },
  });
}

// (Re)start: open a new running segment. Clearing endTime/durationMinutes also
// reopens a previously stopped entry so timing continues on the same task.
export function resumeTimeEntry(id: string, segmentStartedAt: Date) {
  return prisma.timeEntry.update({
    where: { id },
    data: { status: "running", segmentStartedAt, endTime: null, durationMinutes: null },
  });
}

// Stop: bank the final total and freeze durationMinutes. The snapshotted
// hourlyRate is intentionally left untouched.
export function stopTimeEntry(
  id: string,
  accumulatedSeconds: number,
  durationMinutes: number,
  endTime: Date,
) {
  return prisma.timeEntry.update({
    where: { id },
    data: {
      status: "stopped",
      accumulatedSeconds,
      durationMinutes,
      endTime,
      segmentStartedAt: null,
    },
  });
}

// Scoped to the owner. Returns rows deleted (0 if not found / not owned).
export async function deleteTimeEntry(userId: string, id: string) {
  const { count } = await prisma.timeEntry.deleteMany({ where: { id, userId } });
  return count;
}
