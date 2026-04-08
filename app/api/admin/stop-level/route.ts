import { NextResponse } from "next/server";
import { ensureAdminAccess } from "@/lib/admin-auth";
import { getOrCreateContestState } from "@/lib/contest-state";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const authError = await ensureAdminAccess(request);

    if (authError) {
      return authError;
    }

    await connectToDatabase();

    const contestState = await getOrCreateContestState();

    if (contestState.status !== "running") {
      return NextResponse.json({ error: "No running level is available to stop." }, { status: 409 });
    }

    const now = new Date();
    const activeElapsedSeconds = contestState.levelStartedAt
      ? Math.max(0, Math.floor((now.getTime() - contestState.levelStartedAt.getTime()) / 1000))
      : 0;

    contestState.elapsedSeconds = Math.min(
      contestState.durationSeconds,
      (contestState.elapsedSeconds ?? 0) + activeElapsedSeconds,
    );
    contestState.status = "paused";
    contestState.levelStartedAt = null;
    contestState.levelEndsAt = null;
    await contestState.save();

    return NextResponse.json({
      success: true,
      message: `Level ${contestState.currentLevel} paused successfully.`,
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
    console.error("Stop Level Error:", error);
    return NextResponse.json({ error: "Failed to stop level." }, { status: 500 });
  }
}
