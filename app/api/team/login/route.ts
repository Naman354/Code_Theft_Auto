import { NextResponse } from "next/server";
import { getMinPasswordLength } from "@/lib/contest-config";
import { connectToDatabase } from "@/lib/mongodb";
import { normalizeTeamName, verifyPassword } from "@/lib/team-auth";
import { createTeamSessionToken, generateSessionId, setTeamSessionCookie } from "@/lib/team-session";
import Team from "@/models/Team";

const MAX_DEVICES = 2;

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

    if (password.length < getMinPasswordLength()) {
      return NextResponse.json({ error: "Invalid team name or password." }, { status: 401 });
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

    if (team.isDisqualified) {
      return NextResponse.json(
        { error: "This team has been disqualified." },
        { status: 403 },
      );
    }

    // Prune stale sessions older than 8 hours
    const EIGHT_HOURS_MS = 1000 * 60 * 60 * 8;
    const cutoff = new Date(Date.now() - EIGHT_HOURS_MS);
    team.activeSessions = (team.activeSessions ?? []).filter(
      (s: { sessionId: string; lastActive: Date }) => s.lastActive > cutoff,
    );

    if (team.activeSessions.length >= MAX_DEVICES) {
      return NextResponse.json(
        { error: "Device limit reached. This team is already logged in on the maximum number of devices." },
        { status: 403 },
      );
    }

    const sessionId = generateSessionId();
    team.activeSessions.push({ sessionId, lastActive: new Date() });
    team.lastLoginAt = new Date();
    await team.save();

    await setTeamSessionCookie(team._id.toString(), sessionId);
    const token = createTeamSessionToken(team._id.toString(), sessionId);

    return NextResponse.json({
      success: true,
      token,
      sessionId,
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
