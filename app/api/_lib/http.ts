import type { VercelRequest, VercelResponse } from "@vercel/node";
import { playerIdFrom } from "./session";

/** A failure the client is allowed to see the message of. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;

/**
 * Wraps a handler: enforces the method, serialises the return value as JSON,
 * and turns thrown errors into a status plus a message the UI can show. Only
 * ApiError messages reach the client — anything else is logged and reported as
 * a generic failure, so internals never leak into the app.
 */
export function route(method: "GET" | "POST", handler: Handler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== method) {
      res.status(405).json({ error: `Use ${method}.` });
      return;
    }
    try {
      const body = await handler(req, res);
      if (res.writableEnded) return;
      // Quotes are 15-minute delayed by design; let the CDN hold them briefly.
      res.status(200).json(body);
    } catch (err) {
      if (err instanceof ApiError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      console.error(`${method} ${req.url} failed:`, err);
      const missingConfig =
        err instanceof Error && /DATABASE_URL|SESSION_SECRET/.test(err.message);
      res.status(missingConfig ? 503 : 500).json({
        error: missingConfig
          ? "The server isn't configured yet. Check the environment variables."
          : "Something went wrong. Try again.",
      });
    }
  };
}

/** The signed-in player, or a 401 the client can redirect on. */
export function requirePlayer(req: VercelRequest): number {
  const id = playerIdFrom(req);
  if (!id) throw new ApiError(401, "Sign in to continue.");
  return id;
}

export function str(v: unknown, field: string): string {
  if (typeof v !== "string" || v.trim() === "") {
    throw new ApiError(400, `${field} is required.`);
  }
  return v.trim();
}

export function num(v: unknown, field: string): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new ApiError(400, `${field} must be a number.`);
  return n;
}

export function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}
