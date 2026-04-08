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
    contestState.status = "completed";
    contestState.levelStartedAt = null;
    contestState.levelEndsAt = null;
    contestState.elapsedSeconds = 0;
    await contestState.save();

    return NextResponse.json({
      success: true,
      message: "Game stopped successfully.",
      contestState: {
        status: contestState.status,
        currentLevel: contestState.currentLevel,
        levelStartedAt: contestState.levelStartedAt,
        levelEndsAt: contestState.levelEndsAt,
        elapsedSeconds: contestState.elapsedSeconds,
      },
    });
  } catch (error) {
    console.error("Stop Game Error:", error);
    return NextResponse.json({ error: "Failed to stop game." }, { status: 500 });
  }
}
