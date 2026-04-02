import { NextResponse } from "next/server";
import { ensureAdminAccess } from "@/lib/admin-auth";
import { getOrCreateContestState } from "@/lib/contest-state";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const authError = ensureAdminAccess(request);

    if (authError) {
      return authError;
    }

    await connectToDatabase();

    const contestState = await getOrCreateContestState();
    const nextLevel = contestState.currentLevel + 1;

    if (nextLevel > contestState.totalLevels) {
      contestState.status = "completed";
      contestState.levelStartedAt = null;
      contestState.levelEndsAt = null;
      await contestState.save();

      return NextResponse.json({
        success: true,
        message: "Contest is complete. No more levels remain.",
        contestState: {
          status: contestState.status,
          currentLevel: contestState.currentLevel,
          levelStartedAt: contestState.levelStartedAt,
          levelEndsAt: contestState.levelEndsAt,
        },
      });
    }

    const levelStartedAt = new Date();
    const levelEndsAt = new Date(
      levelStartedAt.getTime() + contestState.durationSeconds * 1000,
    );

    contestState.status = "running";
    contestState.currentLevel = nextLevel;
    contestState.levelStartedAt = levelStartedAt;
    contestState.levelEndsAt = levelEndsAt;
    await contestState.save();

    return NextResponse.json({
      success: true,
      message: `Level ${nextLevel} started successfully.`,
      contestState: {
        status: contestState.status,
        currentLevel: contestState.currentLevel,
        levelStartedAt: contestState.levelStartedAt,
        levelEndsAt: contestState.levelEndsAt,
        durationSeconds: contestState.durationSeconds,
      },
    });
  } catch (error) {
    console.error("Next Level Error:", error);
    return NextResponse.json({ error: "Failed to advance to the next level." }, { status: 500 });
  }
}
