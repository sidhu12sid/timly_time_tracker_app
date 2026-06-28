import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/httpError.js";

// Central error handler. Maps Zod validation errors to 400 and HttpError to its
// status; everything else is a 500.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "ValidationError", details: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
}
