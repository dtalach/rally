import { ApiError, str } from "./http.js";

/* ---------------------------------------------------------------------------
   What counts as a usable email, name and password — shared by signup and
   login so the two can't drift apart on what they'll accept.
--------------------------------------------------------------------------- */

/** Deliberately loose. The only real test of an address is sending to it. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;
const MAX_EMAIL = 160;
const MAX_NAME = 40;

export function cleanEmail(value: unknown) {
  const email = str(value, "email").trim().toLowerCase();
  if (email.length > MAX_EMAIL || !EMAIL.test(email)) {
    throw new ApiError(400, "That doesn't look like an email address.");
  }
  return email;
}

export function cleanPassword(value: unknown) {
  const password = str(value, "password");
  if (password.length < MIN_PASSWORD) {
    throw new ApiError(400, `Passwords need at least ${MIN_PASSWORD} characters.`);
  }
  if (password.length > MAX_PASSWORD) {
    throw new ApiError(400, "That password is too long.");
  }
  return password;
}

export function cleanName(value: unknown) {
  const name = str(value, "name").trim().replace(/\s+/g, " ");
  if (name.length < 2) throw new ApiError(400, "Tell us what to call you.");
  if (name.length > MAX_NAME) throw new ApiError(400, "That name is too long.");
  return name;
}

/** JD from "Jordan Diaz", JO from "Jordan" — what the avatar tile shows. */
export function initialsFor(name: string) {
  const words = name.split(" ").filter(Boolean);
  const letters = words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0].slice(0, 2);
  return letters.toUpperCase();
}
