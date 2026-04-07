import { NextResponse } from "next/server";
import { getMinPasswordLength } from "@/lib/contest-config";
import { connectToDatabase } from "@/lib/mongodb";
import { normalizeTeamName, verifyPassword } from "@/lib/team-auth";
import { setTeamSessionCookie } from "@/lib/team-session";
import Team from "@/models/Team";

// Backward-compatible alias route for older clients.
export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const teamName = String(body.teamName ?? body.username ?? "").trim();
    const password = String(body.password ?? body.accessCode ?? "");

    if (!teamName) {
      return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    if (password.length < getMinPasswordLength()) {
      return NextResponse.json({ error: "Invalid team name or password." }, { status: 401 });
    }

    const team = await Team.findOne({ teamNameNormalized: normalizeTeamName(teamName) });

    if (!team || !verifyPassword(password, team.passwordHash)) {
      return NextResponse.json({ error: "Invalid team name or password." }, { status: 401 });
    }

    team.lastLoginAt = new Date();
    await team.save();
    await setTeamSessionCookie(team._id.toString());

    return NextResponse.json({
      success: true,
      team: {
        id: team._id,
        teamName: team.teamName,
        members: team.members,
        totalLockedScore: team.totalLockedScore,
        currentLevel: team.currentLevel,
        levelStates: team.levelStates,
        lastLoginAt: team.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Auth Login Error:", error);
    return NextResponse.json({ error: "Failed to authenticate." }, { status: 500 });
  }
}
