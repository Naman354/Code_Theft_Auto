import { createHmac } from "crypto";
import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

function getSessionSecret() {
  const sessionSecret = process.env.TEAM_SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error("TEAM_SESSION_SECRET is not set in environment variables.");
  }

  return sessionSecret;
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function encodePayload(payload: Record<string, string | number>) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(payload: string) {
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    scope: "admin";
    expiresAt: number;
  };
}

function readCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${key}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function hasValidAdminSecret(secret: string | null | undefined) {
  const normalizedSecret = secret?.trim();
  const configuredSecret = process.env.ADMIN_API_SECRET?.trim();

  return Boolean(normalizedSecret && configuredSecret && normalizedSecret === configuredSecret);
}

export function createAdminSessionToken() {
  const payload = encodePayload({
    scope: "admin",
    expiresAt: Date.now() + SESSION_DURATION_MS,
  });

  return `${payload}.${signPayload(payload)}`;
}

export function verifyAdminSessionToken(token: string) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload);

  if (signature !== expectedSignature) {
    return null;
  }

  const decodedPayload = decodePayload(payload);

  if (decodedPayload.scope !== "admin" || decodedPayload.expiresAt <= Date.now()) {
    return null;
  }

  return decodedPayload;
}

export function getAdminSessionFromRequest(request: Request) {
  const token = readCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);

  if (!token) {
    return null;
  }

  return verifyAdminSessionToken(token);
}

export async function setAdminSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminSessionToken(token);
}

export { ADMIN_SESSION_COOKIE };
