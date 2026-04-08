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
    const requestedLevel = Number(body.level ?? Number.NaN);
    const contestState = await getOrCreateContestState();
    const levelToStart = Number.isFinite(requestedLevel)
      ? requestedLevel
      : contestState.currentLevel;
    const isResumingPausedLevel = contestState.status === "paused" && levelToStart === contestState.currentLevel;

    if (!Number.isInteger(levelToStart) || levelToStart < 1) {
      return NextResponse.json({ error: "Level must be a positive integer." }, { status: 400 });
    }

    if (levelToStart > contestState.totalLevels) {
      return NextResponse.json(
        { error: "Requested level exceeds the configured total levels." },
        { status: 400 },
      );
    }

    const levelExists = await Level.exists({ levelNumber: levelToStart });

    if (!levelExists) {
      return NextResponse.json(
        { error: `Level ${levelToStart} has not been configured yet.` },
        { status: 404 },
      );
    }

    const levelStartedAt = new Date();
    const remainingSeconds = isResumingPausedLevel
      ? Math.max(0, contestState.durationSeconds - (contestState.elapsedSeconds ?? 0))
      : contestState.durationSeconds;

    const levelEndsAt = new Date(levelStartedAt.getTime() + remainingSeconds * 1000);

    if (!isResumingPausedLevel) {
      await resetTeamsForLevel(levelToStart);
    }

    contestState.status = "running";
    contestState.currentLevel = levelToStart;
    contestState.levelStartedAt = levelStartedAt;
    contestState.levelEndsAt = levelEndsAt;
    contestState.elapsedSeconds = isResumingPausedLevel ? contestState.elapsedSeconds ?? 0 : 0;
    await contestState.save();

    return NextResponse.json({
      success: true,
      message: isResumingPausedLevel
        ? `Level ${levelToStart} resumed successfully.`
        : `Level ${levelToStart} started successfully. Team progress for this level was reset.`,
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
    console.error("Start Level Error:", error);
    return NextResponse.json({ error: "Failed to start level." }, { status: 500 });
  }
}
