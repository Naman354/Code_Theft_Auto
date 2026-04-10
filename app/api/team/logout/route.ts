import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { clearTeamSessionCookie, getTeamSessionFromCookies } from "@/lib/team-session";
import Team from "@/models/Team";

export async function POST() {
  try {
    const session = await getTeamSessionFromCookies();

    if (session?.teamId && session.sessionId) {
      await connectToDatabase();
      await Team.updateOne(
        { _id: session.teamId },
        { $pull: { activeSessions: { sessionId: session.sessionId } } },
      );
    }
  } catch {
    // Ignore DB errors; still clear the cookie
  }

  await clearTeamSessionCookie();

  return NextResponse.json({ success: true });
}
