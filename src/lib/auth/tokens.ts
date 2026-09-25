import { createHmac, randomBytes } from "crypto";

export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set (32+ random characters) in production.");
    }
    return "insecure-development-secret-do-not-use";
  }
  return s;
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Tokens are stored only as keyed hashes so a database leak does not expose live sessions. */
export function hashToken(token: string): string {
  return createHmac("sha256", authSecret()).update(token).digest("hex");
}
