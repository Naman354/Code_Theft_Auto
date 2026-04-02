import { NextResponse } from "next/server";
import { getOrCreateContestState } from "@/lib/contest-state";
import { buildCurrentQuestionState, getLevelForContest, syncTeamProgressForCurrentLevel } from "@/lib/contest-gameplay";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedTeam } from "@/lib/team-access";

export async function GET() {
  try {
    await connectToDatabase();

    const team = await getAuthenticatedTeam();

    if (!team) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const contestState = await getOrCreateContestState();
    const levelState = await syncTeamProgressForCurrentLevel(team, contestState);
    const level = await getLevelForContest(contestState.currentLevel);

    return NextResponse.json({
      success: true,
      state: buildCurrentQuestionState({
        contestState,
        team,
        level,
        levelState,
      }),
    });
  } catch (error) {
    console.error("Team State Error:", error);
    return NextResponse.json({ error: "Failed to fetch team state." }, { status: 500 });
  }
}
