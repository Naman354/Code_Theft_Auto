import { NextResponse } from "next/server";
import { ensureAdminAccess } from "@/lib/admin-auth";
import { getOrCreateContestState } from "@/lib/contest-state";
import { connectToDatabase } from "@/lib/mongodb";
// a simple comment to fix my deployemnt
export async function GET(request: Request) {
  try {
    const authError = await ensureAdminAccess(request);

    if (authError) {
      return authError;
    }

    await connectToDatabase();

    const contestState = await getOrCreateContestState();

    return NextResponse.json({
      success: true,
      contestState: {
        status: contestState.status,
        totalLevels: contestState.totalLevels,
        currentLevel: contestState.currentLevel,
        levelStartedAt: contestState.levelStartedAt,
        levelEndsAt: contestState.levelEndsAt,
        elapsedSeconds: contestState.elapsedSeconds ?? 0,
        maxPointsPerQuestion: contestState.maxPointsPerQuestion,
        gracePeriodSeconds: contestState.gracePeriodSeconds,
        durationSeconds: contestState.durationSeconds,
        decayPerSecond: contestState.decayPerSecond,
        clue1UnlockSeconds: contestState.clue1UnlockSeconds,
        clue1Penalty: contestState.clue1Penalty,
        clue2UnlockSeconds: contestState.clue2UnlockSeconds,
        clue2Penalty: contestState.clue2Penalty,
      },
    });
  } catch (error) {
    console.error("Contest State Error:", error);
    return NextResponse.json({ error: "Failed to fetch contest state." }, { status: 500 });
  }
}
