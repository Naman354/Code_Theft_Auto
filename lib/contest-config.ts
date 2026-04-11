const DEFAULT_MIN_PASSWORD_LENGTH = 3;
const DEFAULT_MAX_TEAM_NAME_LENGTH = 80;

function parsePositiveIntegerEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer when provided.`);
  }

  return parsed;
}

export function getRequiredTeamMemberCount() {
  return parsePositiveIntegerEnv("TEAM_MAX_MEMBER_COUNT");
}

export function getMinPasswordLength() {
  return parsePositiveIntegerEnv("TEAM_MIN_PASSWORD_LENGTH") ?? DEFAULT_MIN_PASSWORD_LENGTH;
}

export function getMaxTeamNameLength() {
  return parsePositiveIntegerEnv("TEAM_MAX_TEAM_NAME_LENGTH") ?? DEFAULT_MAX_TEAM_NAME_LENGTH;
}
