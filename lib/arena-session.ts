import Team from "@/models/Team";
import { verifyTeamSessionToken } from "@/lib/team-session";

function readCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${key}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getArenaSessionTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
  const cookieToken = readCookieValue(request.headers.get("cookie"), "team_session");
  return bearerToken || cookieToken;
}

export function getArenaSessionFromRequest(request: Request) {
  const token = getArenaSessionTokenFromRequest(request);

  if (!token) {
    return null;
  }

  return verifyTeamSessionToken(token);
}

export async function getAuthenticatedTeamFromRequest(request: Request) {
  const session = getArenaSessionFromRequest(request);

  if (!session) {
    return null;
  }

  return Team.findById(session.teamId);
}

