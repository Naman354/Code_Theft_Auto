import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PASSWORD_KEY_LENGTH = 64;

function parseStoredPasswordHash(storedPasswordHash: string) {
  const [salt, derivedKey] = storedPasswordHash.split(":");

  if (!salt || !derivedKey) {
    throw new Error("Stored password hash is malformed.");
  }

  return { salt, derivedKey };
}

export function normalizeTeamName(teamName: string) {
  return teamName.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isValidStudentNumber(studentNumber: string) {
  return /^\d{7,8}$/.test(studentNumber.trim());
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");

  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedPasswordHash: string) {
  const { salt, derivedKey } = parseStoredPasswordHash(storedPasswordHash);

  const derivedKeyBuffer = Buffer.from(derivedKey, "hex");
  const candidateBuffer = scryptSync(password, salt, derivedKeyBuffer.length);

  if (derivedKeyBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKeyBuffer, candidateBuffer);
}
