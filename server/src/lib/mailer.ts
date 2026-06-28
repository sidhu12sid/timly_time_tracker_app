import { env } from "../env.js";

export type OtpPurpose = "verify" | "reset";

const DEFAULT_FROM = "Time Tracker <onboarding@resend.dev>";

function buildMessage(otp: string, purpose: OtpPurpose) {
  const subject =
    purpose === "verify"
      ? "Verify your Time Tracker account"
      : "Reset your Time Tracker password";
  const action = purpose === "verify" ? "verification" : "password reset";
  const text = `Your ${action} code is ${otp}.\nIt expires in ${env.OTP_TTL_MINUTES} minutes.`;
  return { subject, text };
}

// Send mail via Resend's HTTPS API (works on hosts that block SMTP ports).
// If no API key is configured (local dev), the OTP is logged to the console.
export async function sendOtpEmail(to: string, otp: string, purpose: OtpPurpose): Promise<void> {
  const { subject, text } = buildMessage(otp, purpose);

  if (!env.RESEND_API_KEY) {
    console.warn(`[mailer] RESEND_API_KEY not set — OTP for ${to}: ${otp}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.MAIL_FROM ?? DEFAULT_FROM, to, subject, text }),
  });

  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
}
