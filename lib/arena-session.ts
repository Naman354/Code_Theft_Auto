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
  return cookieToken || bearerToken;
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

  const team = await Team.findById(session.teamId);

  if (!team) {
    return null;
  }

  if (!session.sessionId) {
    return team;
  }

  const isActiveSession = Array.from(team.activeSessions ?? []).some(
    (activeSession) => activeSession.sessionId === session.sessionId,
  );

  if (!isActiveSession) {
    return null;
  }

  return team;
}

