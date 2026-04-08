import { NextResponse } from "next/server";
import { ensureAdminAccess } from "@/lib/admin-auth";
import { resetEntireContest } from "@/lib/contest-reset";
import { getOrCreateContestState } from "@/lib/contest-state";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const authError = await ensureAdminAccess(request);

    if (authError) {
      return authError;
    }

    await connectToDatabase();

    await resetEntireContest();

    const contestState = await getOrCreateContestState();
    contestState.status = "not_started";
    contestState.currentLevel = 1;
    contestState.levelStartedAt = null;
    contestState.levelEndsAt = null;
    contestState.elapsedSeconds = 0;
    await contestState.save();

    return NextResponse.json({
      success: true,
      message: "Game restarted successfully. Contest reset to Level 1.",
      contestState: {
        status: contestState.status,
        currentLevel: contestState.currentLevel,
        levelStartedAt: contestState.levelStartedAt,
        levelEndsAt: contestState.levelEndsAt,
        elapsedSeconds: contestState.elapsedSeconds,
      },
    });
  } catch (error) {
    console.error("Restart Game Error:", error);
    return NextResponse.json({ error: "Failed to restart game." }, { status: 500 });
  }
}
