import { createHash } from "crypto";

export const AUTH_COOKIE = "ss_auth";
const AUTH_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

/**
 * A single shared password (set via APP_PASSWORD) gates the whole app.
 * There's no per-user login — this just keeps the site from being
 * casually browsable by someone who stumbles on the URL. It is NOT a
 * real security boundary: the Firestore data behind this app uses open
 * rules (see README), so anyone with the Firebase project keys — which
 * ship in the public JS bundle either way — can already read/write the
 * data directly. Treat this the same as a "don't share this link"
 * house lock, not a vault door.
 */
export function expectedAuthValue(): string | null {
  const password = process.env.APP_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(`smoothschool:${password}`).digest("hex");
}

export function checkPassword(candidate: string): string | null {
  const expected = expectedAuthValue();
  if (!expected) return null;
  const candidateHash = createHash("sha256").update(`smoothschool:${candidate}`).digest("hex");
  return candidateHash === expected ? expected : null;
}

export const AUTH_COOKIE_MAX_AGE = AUTH_MAX_AGE;
