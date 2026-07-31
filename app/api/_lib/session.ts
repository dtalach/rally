import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/* ---------------------------------------------------------------------------
   Sessions.

   Real accounts: an email address, a password stored as a scrypt hash with a
   per-account salt, and a session that is a signed HttpOnly cookie rather than
   anything the page's JavaScript can read. The email is the only personal data
   the app holds, and it exists to log you in — nothing sends mail.
--------------------------------------------------------------------------- */

const COOKIE = "rally_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 16 characters.");
  }
  return s;
}

export function hashSecret(secretValue: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(secretValue, salt, 32).toString("hex")}`;
}

export function verifySecret(secretValue: string, stored: string) {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = scryptSync(secretValue, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function issue(res: VercelResponse, playerId: number) {
  const payload = `${playerId}.${Date.now() + MAX_AGE_S * 1000}`;
  const token = `${payload}.${sign(payload)}`;
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_S}`
  );
}

export function clear(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}

/** The signed-in player's id, or null. Never throws on a malformed cookie. */
export function playerIdFrom(req: VercelRequest): number | null {
  const raw = req.cookies?.[COOKIE] ?? parseCookie(req.headers.cookie)[COOKIE];
  if (!raw) return null;

  const idx = raw.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = raw.slice(0, idx);
  const mac = raw.slice(idx + 1);

  const expected = sign(payload);
  if (mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;

  const [id, expiry] = payload.split(".");
  if (Number(expiry) < Date.now()) return null;

  const playerId = Number(id);
  return Number.isInteger(playerId) && playerId > 0 ? playerId : null;
}

function parseCookie(header?: string): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((part) => {
      const i = part.indexOf("=");
      return i < 0 ? [part.trim(), ""] : [part.slice(0, i).trim(), part.slice(i + 1).trim()];
    })
  );
}
