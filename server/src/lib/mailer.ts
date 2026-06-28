import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../env.js";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_PORT) return null;

  const base = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // implicit TLS on 465, STARTTLS otherwise
  };
  transporter =
    env.SMTP_USER && env.SMTP_PASS
      ? nodemailer.createTransport({ ...base, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } })
      : nodemailer.createTransport(base);

  return transporter;
}

export type OtpPurpose = "verify" | "reset";

export async function sendOtpEmail(to: string, otp: string, purpose: OtpPurpose): Promise<void> {
  const subject =
    purpose === "verify"
      ? "Verify your Time Tracker account"
      : "Reset your Time Tracker password";
  const action = purpose === "verify" ? "verification" : "password reset";
  const text = `Your ${action} code is ${otp}.\nIt expires in ${env.OTP_TTL_MINUTES} minutes.`;

  const t = getTransporter();
  if (!t) {
    // Dev fallback: no SMTP configured, so log the code to keep the flow testable.
    console.warn(`[mailer] SMTP not configured — OTP for ${to}: ${otp}`);
    return;
  }

  await t.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER ?? "no-reply@timetracker.local",
    to,
    subject,
    text,
  });
}
