import { z } from "zod";

// JS mirror of the server's Zod schemas (server/src/schemas). Until a shared
// package exists, keep these in sync with the canonical TypeScript versions.

const money = z.number().nonnegative().nullable();

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  defaultHourlyRate: money.optional(),
});

// Same shape as create — used when editing a client.
export const updateClientSchema = createClientSchema;

export const createProjectSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  isBillableDefault: z.boolean().optional(),
});

// Editing a project doesn't change its client.
export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isBillableDefault: z.boolean().optional(),
});

export const createTimeEntrySchema = z.object({
  projectId: z.string().uuid(),
  description: z.string().default(""),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().nullable().optional(),
  isBillable: z.boolean().optional(),
});

// --- Auth (mirror of server/src/schemas/auth.ts, plus client-only confirm fields) ---
export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please re-enter your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "Enter the 6-digit code"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    otp: z.string().length(6, "Enter the 6-digit code"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmNewPassword: z.string().min(1, "Please re-enter your password"),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
