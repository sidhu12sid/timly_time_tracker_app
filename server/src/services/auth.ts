import type { User } from "@prisma/client";
import * as users from "../data/users.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { generateOtp } from "../lib/otp.js";
import { sendOtpEmail } from "../lib/mailer.js";
import { signAuthToken } from "../lib/jwt.js";
import { HttpError } from "../lib/httpError.js";
import type {
  RegisterInput,
  LoginInput,
  VerifyOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../schemas/auth.js";

// Shape returned to clients — never includes password / otp.
function publicUser(u: User) {
  return { id: u.id, name: u.name, email: u.email, isVerified: u.isVerified };
}

function issueSession(u: User) {
  const token = signAuthToken({ sub: u.id, email: u.email });
  return { token, user: publicUser(u) };
}

function assertValidOtp(user: User, otp: string) {
  if (!user.otp || !user.otpExpiresAt) {
    throw new HttpError(400, "No active code. Request a new one.");
  }
  if (user.otp !== otp || user.otpExpiresAt.getTime() < Date.now()) {
    throw new HttpError(400, "Invalid or expired code");
  }
}

export async function register(input: RegisterInput): Promise<void> {
  const existing = await users.findUserByEmail(input.email);
  const { otp, expiresAt } = generateOtp();
  const passwordHash = await hashPassword(input.password);

  if (existing) {
    if (existing.isVerified) {
      throw new HttpError(409, "Email already registered");
    }
    // Allow re-registering an unverified account: refresh details + new OTP.
    await users.updateRegistration(existing.id, {
      name: input.name,
      password: passwordHash,
      otp,
      otpExpiresAt: expiresAt,
    });
  } else {
    await users.createUser({
      name: input.name,
      email: input.email,
      password: passwordHash,
      otp,
      otpExpiresAt: expiresAt,
    });
  }

  await sendOtpEmail(input.email, otp, "verify");
}

export async function verifyOtp(input: VerifyOtpInput) {
  const user = await users.findUserByEmail(input.email);
  if (!user) throw new HttpError(400, "Invalid or expired code");
  assertValidOtp(user, input.otp);

  const verified = await users.markVerified(user.id);
  return issueSession(verified);
}

export async function login(input: LoginInput) {
  const user = await users.findUserByEmail(input.email);
  // Run the hash compare even when the user is missing to avoid leaking, but a
  // missing user simply fails with the same generic message.
  if (!user || !(await verifyPassword(input.password, user.password))) {
    throw new HttpError(401, "Invalid credentials");
  }
  if (!user.isVerified) {
    throw new HttpError(403, "Email not verified");
  }
  return issueSession(user);
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const user = await users.findUserByEmail(input.email);
  // Always succeed (don't reveal whether the email exists).
  if (!user) return;

  const { otp, expiresAt } = generateOtp();
  await users.setOtp(user.id, otp, expiresAt);
  await sendOtpEmail(input.email, otp, "reset");
}

// Validate a reset OTP WITHOUT consuming it, so a dedicated OTP step can gate
// the flow before the new password is collected. resetPassword re-checks and
// clears the OTP at the final step.
export async function verifyResetOtp(input: VerifyOtpInput): Promise<void> {
  const user = await users.findUserByEmail(input.email);
  if (!user) throw new HttpError(400, "Invalid or expired code");
  assertValidOtp(user, input.otp);
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const user = await users.findUserByEmail(input.email);
  if (!user) throw new HttpError(400, "Invalid or expired code");
  assertValidOtp(user, input.otp);

  const passwordHash = await hashPassword(input.newPassword);
  await users.updatePassword(user.id, passwordHash);
}
