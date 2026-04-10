import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { applyRateLimit } from "@/lib/request-guard";
import { clearTeamSessionCookie, getTeamSessionFromCookies } from "@/lib/team-session";
import Team from "@/models/Team";

const MAX_TAB_SWITCHES = 3;

export async function POST(request: Request) {
  try {
    const rateLimitError = applyRateLimit(request, {
      bucket: "tab-switch",
      limit: 12,
      windowMs: 60_000,
    });

    if (rateLimitError) {
      return rateLimitError;
    }

    const session = await getTeamSessionFromCookies();

    if (!session?.teamId) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    await connectToDatabase();
    const team = await Team.findById(session.teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    if (team.isDisqualified) {
      // Already DQ'd — just clear the cookie
      await clearTeamSessionCookie();
      return NextResponse.json({ disqualified: true, tabSwitchCount: team.tabSwitchCount });
    }

    const newCount = (team.tabSwitchCount ?? 0) + 1;
    const isNowDisqualified = newCount >= MAX_TAB_SWITCHES;
    const shouldLogout = newCount >= 2;

    if (isNowDisqualified) {
      // Strike 3: Disqualify and wipe all sessions
      await Team.updateOne(
        { _id: team._id },
        {
          $set: { isDisqualified: true, tabSwitchCount: newCount, activeSessions: [] },
        },
      );
      await clearTeamSessionCookie();
    } else if (shouldLogout) {
      // Strike 2: Remove current session and logout
      const pullFilter = session.sessionId
        ? { $pull: { activeSessions: { sessionId: session.sessionId } }, $inc: { tabSwitchCount: 1 } }
        : { $inc: { tabSwitchCount: 1 } };
      await Team.updateOne({ _id: team._id }, pullFilter);
      await clearTeamSessionCookie();
    } else {
      // Strike 1: Just a warning, no logout
      await Team.updateOne({ _id: team._id }, { $inc: { tabSwitchCount: 1 } });
    }

    return NextResponse.json({
      disqualified: isNowDisqualified,
      tabSwitchCount: newCount,
      showWarning: newCount === 1, // Indicate a soft warning is needed
    });
  } catch (error) {
    console.error("Tab-switch Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
