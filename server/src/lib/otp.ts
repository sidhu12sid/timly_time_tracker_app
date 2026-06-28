import { env } from "../env.js";

// Generate a 6-digit numeric OTP and its expiry timestamp.
export function generateOtp(): { otp: string; expiresAt: Date } {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60_000);
  return { otp, expiresAt };
}
