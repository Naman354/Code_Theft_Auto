import { NextResponse } from "next/server";
import { ensureAdminAccess } from "@/lib/admin-auth";
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
    const levelEndsAt = new Date(
      levelStartedAt.getTime() + contestState.durationSeconds * 1000,
    );

    contestState.status = "running";
    contestState.currentLevel = levelToStart;
    contestState.levelStartedAt = levelStartedAt;
    contestState.levelEndsAt = levelEndsAt;
    await contestState.save();

    return NextResponse.json({
      success: true,
      message: `Level ${levelToStart} started successfully.`,
      contestState: {
        status: contestState.status,
        currentLevel: contestState.currentLevel,
        levelStartedAt: contestState.levelStartedAt,
        levelEndsAt: contestState.levelEndsAt,
        durationSeconds: contestState.durationSeconds,
      },
    });
  } catch (error) {
    console.error("Start Level Error:", error);
    return NextResponse.json({ error: "Failed to start level." }, { status: 500 });
  }
}
