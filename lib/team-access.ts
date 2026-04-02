import Team from "@/models/Team";
import { getTeamSessionFromCookies } from "@/lib/team-session";

export async function getAuthenticatedTeam() {
  const session = await getTeamSessionFromCookies();

  if (!session) {
    return null;
  }

  return Team.findById(session.teamId);
}
