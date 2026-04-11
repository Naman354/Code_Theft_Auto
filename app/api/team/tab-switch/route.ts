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

    const body = await request.json().catch(() => ({}));
    const deviceId = body.deviceId || "unknown_device";

    await connectToDatabase();
    const team = await Team.findById(session.teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    if (team.isDisqualified) {
      await clearTeamSessionCookie();
      return NextResponse.json({ disqualified: true });
    }

    // Initialize/Increment per-device count
    let deviceStat = team.deviceTabSwitches.find((d) => d.deviceId === deviceId);
    if (!deviceStat) {
      deviceStat = { deviceId, count: 1 };
      team.deviceTabSwitches.push(deviceStat);
    } else {
      deviceStat.count += 1;
    }

    const newCount = deviceStat.count;
    const isNowDisqualified = newCount >= MAX_TAB_SWITCHES;
    const shouldLogout = newCount === 2;

    if (isNowDisqualified) {
      // Strike 3: Team DQ
      team.isDisqualified = true;
      team.activeSessions = [];
      await team.save();
      await clearTeamSessionCookie();
    } else if (shouldLogout) {
      // Strike 2: Current session logout
      team.activeSessions = team.activeSessions.filter((s) => s.sessionId !== session.sessionId);
      await team.save();
      await clearTeamSessionCookie();
    } else {
      // Strike 1: Just increment and save
      await team.save();
    }

    return NextResponse.json({
      disqualified: isNowDisqualified,
      tabSwitchCount: newCount,
      showWarning: newCount === 1,
    });
  } catch (error) {
    console.error("Tab-switch Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
