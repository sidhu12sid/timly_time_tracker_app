import type { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../lib/jwt.js";
import { HttpError } from "../lib/httpError.js";

// Protect a route with a Bearer JWT. On success, exposes the user id as
// res.locals.userId (same contract as the dev currentUser shim).
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }
  try {
    const payload = verifyAuthToken(header.slice("Bearer ".length));
    res.locals.userId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}
