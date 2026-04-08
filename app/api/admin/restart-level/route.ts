import { NextResponse } from "next/server";
import { ensureAdminAccess } from "@/lib/admin-auth";
import { resetTeamsForLevel } from "@/lib/contest-reset";
import { getOrCreateContestState } from "@/lib/contest-state";
import Level from "@/models/Level";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const authError = await ensureAdminAccess(request);

    if (authError) {
      return authError;
    }

    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const contestState = await getOrCreateContestState();
    const requestedLevel = Number(body.level ?? contestState.currentLevel);

    if (!Number.isInteger(requestedLevel) || requestedLevel < 1) {
      return NextResponse.json({ error: "Level must be a positive integer." }, { status: 400 });
    }

    if (requestedLevel > contestState.totalLevels) {
      return NextResponse.json(
        { error: "Requested level exceeds the configured total levels." },
        { status: 400 },
      );
    }

    const levelExists = await Level.exists({ levelNumber: requestedLevel });

    if (!levelExists) {
      return NextResponse.json(
        { error: `Level ${requestedLevel} has not been configured yet.` },
        { status: 404 },
      );
    }

    await resetTeamsForLevel(requestedLevel);

    const levelStartedAt = new Date();
    const levelEndsAt = new Date(levelStartedAt.getTime() + contestState.durationSeconds * 1000);

    contestState.status = "running";
    contestState.currentLevel = requestedLevel;
    contestState.levelStartedAt = levelStartedAt;
    contestState.levelEndsAt = levelEndsAt;
    contestState.elapsedSeconds = 0;
    await contestState.save();

    return NextResponse.json({
      success: true,
      message: `Level ${requestedLevel} restarted successfully.`,
      contestState: {
        status: contestState.status,
        currentLevel: contestState.currentLevel,
        levelStartedAt: contestState.levelStartedAt,
        levelEndsAt: contestState.levelEndsAt,
        elapsedSeconds: contestState.elapsedSeconds,
        durationSeconds: contestState.durationSeconds,
      },
    });
  } catch (error) {
    console.error("Restart Level Error:", error);
    return NextResponse.json({ error: "Failed to restart level." }, { status: 500 });
  }
}
