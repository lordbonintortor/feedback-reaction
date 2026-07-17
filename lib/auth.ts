export const SESSION_COOKIE = "hrmdo_admin_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;

const encoder = new TextEncoder();

function sessionSecret() {
  return process.env.SESSION_SECRET || "";
}

export function isAuthConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && sessionSecret().length >= 32);
}

async function signature(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const binary = String.fromCharCode(...new Uint8Array(signed));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function createSessionToken() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = String(expiresAt);
  return `${payload}.${await signature(payload)}`;
}

export async function verifySessionToken(token?: string) {
  if (!token || !isAuthConfigured()) return false;

  const [expiresAt, providedSignature] = token.split(".");
  if (!expiresAt || !providedSignature || Number(expiresAt) <= Date.now() / 1000) {
    return false;
  }

  const expectedSignature = await signature(expiresAt);
  if (providedSignature.length !== expectedSignature.length) return false;

  let difference = 0;
  for (let index = 0; index < expectedSignature.length; index += 1) {
    difference |= providedSignature.charCodeAt(index) ^ expectedSignature.charCodeAt(index);
  }
  return difference === 0;
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || password.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= password.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}
