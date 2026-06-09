import { getAuthEnv } from "@/lib/env";

export const SESSION_COOKIE = "recipe_session";

/** Durée de validité d'une session (7 jours). */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparaison à temps constant pour éviter les attaques temporelles. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(signature);
}

/** Crée un jeton de session signé valable jusqu'à `now + SESSION_TTL_MS`. */
export async function createSessionToken(
  secret: string,
  now: number = Date.now(),
): Promise<string> {
  const payload = String(now + SESSION_TTL_MS);
  const signature = await hmac(secret, payload);
  return `${payload}.${signature}`;
}

/** Vérifie la signature et l'expiration d'un jeton de session. */
export async function verifySessionToken(
  token: string | undefined,
  secret: string,
  now: number = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = await hmac(secret, payload);
  if (!timingSafeEqual(signature, expected)) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > now;
}

/** Vérifie le mot de passe saisi contre `APP_PASSWORD`, à temps constant. */
export function verifyPassword(input: string): boolean {
  const { APP_PASSWORD } = getAuthEnv();
  return timingSafeEqual(input, APP_PASSWORD);
}
