import { createHmac } from "crypto";
import { cookies } from "next/headers";

const TEAM_SESSION_COOKIE = "team_session";
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
    teamId: string;
    expiresAt: number;
  };
}

export function createTeamSessionToken(teamId: string) {
  const payload = encodePayload({
    teamId,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  });

  return `${payload}.${signPayload(payload)}`;
}

export function verifyTeamSessionToken(token: string) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload);

  if (signature !== expectedSignature) {
    return null;
  }

  const decodedPayload = decodePayload(payload);

  if (decodedPayload.expiresAt <= Date.now()) {
    return null;
  }

  return decodedPayload;
}

export async function setTeamSessionCookie(teamId: string) {
  const cookieStore = await cookies();

  cookieStore.set(TEAM_SESSION_COOKIE, createTeamSessionToken(teamId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearTeamSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(TEAM_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getTeamSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TEAM_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyTeamSessionToken(token);
}

export { TEAM_SESSION_COOKIE };
