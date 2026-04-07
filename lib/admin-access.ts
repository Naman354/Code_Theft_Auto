import { getTeamSessionFromCookies } from "@/lib/team-session";
import { getAdminSessionFromCookies } from "@/lib/admin-session";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function isAdminTeam(teamId: string) {
  await connectToDatabase();
  const adminUser = await User.exists({
    teamId,
    isAdmin: true,
  });
  return Boolean(adminUser);
}

export async function hasAdminAccessFromCookies() {
  const adminSession = await getAdminSessionFromCookies();

  if (adminSession) {
    return true;
  }

  const session = await getTeamSessionFromCookies();

  if (!session) {
    return false;
  }

  return isAdminTeam(session.teamId);
}
