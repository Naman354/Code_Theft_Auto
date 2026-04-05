import { NextResponse } from "next/server";
import { getMinPasswordLength } from "@/lib/contest-config";
import { connectToDatabase } from "@/lib/mongodb";
import { normalizeTeamName, verifyPassword } from "@/lib/team-auth";
import { createTeamSessionToken, setTeamSessionCookie } from "@/lib/team-session";
import Team from "@/models/Team";

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const username = String(body.username ?? body.teamName ?? "").trim();
    const accessCode = String(body.accessCode ?? body.password ?? "").trim();

    if (!username) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    if (!accessCode) {
      return NextResponse.json({ error: "Access code is required." }, { status: 400 });
    }

    if (accessCode.length < getMinPasswordLength()) {
      return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
    }

    const team = await Team.findOne({ teamNameNormalized: normalizeTeamName(username) });

    if (!team) {
      return NextResponse.json({ error: "Invalid username or access code." }, { status: 401 });
    }

    const isPasswordValid = verifyPassword(accessCode, team.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid username or access code." }, { status: 401 });
    }

    team.lastLoginAt = new Date();
    await team.save();

    const token = createTeamSessionToken(team._id.toString());
    await setTeamSessionCookie(team._id.toString());

    return NextResponse.json({
      success: true,
      token,
      team: {
        id: team._id,
        teamName: team.teamName,
        members: team.members,
        totalLockedScore: team.totalLockedScore,
        currentLevel: team.currentLevel,
        lastLoginAt: team.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Auth Login Error:", error);
    return NextResponse.json({ error: "Failed to authenticate." }, { status: 500 });
  }
}

