import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN_SECONDS,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    throw new Error("Invalid token payload");
  }
  return {
    sub: decoded.sub,
    email: typeof decoded.email === "string" ? decoded.email : "",
  };
}
