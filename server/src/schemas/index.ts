import { z } from "zod";

// Canonical request schemas (TS). The client keeps a JS mirror of these until
// a shared package is introduced. Keep the two in sync.

const money = z.number().nonnegative().nullable();

export const createClientSchema = z.object({
  name: z.string().min(1),
});

export const updateClientSchema = z.object({
  name: z.string().min(1),
});

export const createProjectSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1),
  hourlyRate: money.optional(),
  isBillableDefault: z.boolean().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1),
  hourlyRate: money.optional(),
  isBillableDefault: z.boolean().optional(),
});

// Start a timer (no endTime) or log a completed entry (with endTime).
export const createTimeEntrySchema = z
  .object({
    projectId: z.string().uuid(),
    description: z.string().default(""),
    startTime: z.coerce.date(),
    endTime: z.coerce.date().nullable().optional(),
    // Omit to inherit the project's is_billable_default.
    isBillable: z.boolean().optional(),
  })
  .refine(
    (e) => e.endTime == null || e.endTime > e.startTime,
    { message: "endTime must be after startTime", path: ["endTime"] },
  );

export const stopTimerSchema = z.object({
  endTime: z.coerce.date().optional(),
});

export const dashboardQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type StopTimerInput = z.infer<typeof stopTimerSchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
