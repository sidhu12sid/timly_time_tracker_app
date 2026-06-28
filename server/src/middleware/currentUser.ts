import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

// SCAFFOLD ONLY — no real auth yet. Resolves a single demo user (creating it
// on first request) and exposes its id as res.locals.userId. Replace with real
// authentication before anything ships.
const DEMO_EMAIL = "demo@timetracker.local";

export async function currentUser(_req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {},
      // password is required now; the demo user can't log in via real auth, so
      // an empty hash placeholder is fine for this scaffold shim.
      create: { email: DEMO_EMAIL, name: "Demo User", password: "", isVerified: true },
    });
    res.locals.userId = user.id;
    next();
  } catch (err) {
    next(err);
  }
}

export function getUserId(res: Response): string {
  const userId: unknown = res.locals.userId;
  if (typeof userId !== "string") {
    throw new Error("userId missing from res.locals — is currentUser mounted?");
  }
  return userId;
}
