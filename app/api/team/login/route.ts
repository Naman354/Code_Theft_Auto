import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { normalizeTeamName, verifyPassword } from "@/lib/team-auth";
import { setTeamSessionCookie } from "@/lib/team-session";
import Team from "@/models/Team";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const body = await req.json().catch(() => ({}));
    const teamName = String(body.teamName ?? "").trim();
    const password = String(body.password ?? "");

    if (!teamName) {
      return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const teamNameNormalized = normalizeTeamName(teamName);
    const team = await Team.findOne({ teamNameNormalized });

    if (!team) {
      return NextResponse.json({ error: "Invalid team name or password." }, { status: 401 });
    }

    const isPasswordValid = verifyPassword(password, team.passwordHash);

    if (!isPasswordValid) {
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
    console.error("Team Login Error:", error);
    return NextResponse.json({ error: "Failed to log in team." }, { status: 500 });
  }
}
