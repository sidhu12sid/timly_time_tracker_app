import { Router } from "express";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.js";
import * as auth from "../services/auth.js";

// Express 5 awaits async handlers and forwards rejections to the error handler,
// so handlers can throw freely without a wrapper.
export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  await auth.register(registerSchema.parse(req.body));
  res.status(201).json({ message: "Registered. Check your email for a verification code." });
});

authRouter.post("/verify-otp", async (req, res) => {
  res.json(await auth.verifyOtp(verifyOtpSchema.parse(req.body)));
});

authRouter.post("/login", async (req, res) => {
  res.json(await auth.login(loginSchema.parse(req.body)));
});

authRouter.post("/forgot-password", async (req, res) => {
  await auth.forgotPassword(forgotPasswordSchema.parse(req.body));
  res.json({ message: "If that email exists, a reset code has been sent." });
});

// Validate the reset code before showing the new-password step.
authRouter.post("/verify-reset-otp", async (req, res) => {
  await auth.verifyResetOtp(verifyOtpSchema.parse(req.body));
  res.json({ message: "Code verified." });
});

authRouter.post("/reset-password", async (req, res) => {
  await auth.resetPassword(resetPasswordSchema.parse(req.body));
  res.json({ message: "Password updated. You can now log in." });
});
