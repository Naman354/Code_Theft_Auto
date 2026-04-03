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

    if (contestState.status === "running" && !level) {
      return NextResponse.json({ error: "Current level question was not found." }, { status: 404 });
    }

    const state = buildCurrentQuestionState({
      contestState,
      team,
      level,
      levelState,
    });

    return NextResponse.json({
      success: true,
      currentQuestion: state.question,
      state: {
        contestStatus: state.contestStatus,
        currentLevel: state.currentLevel,
        teamCurrentLevel: state.teamCurrentLevel,
        levelState: state.levelState,
        totalLockedScore: state.totalLockedScore,
        timer: state.timer,
        scoring: state.scoring,
      },
    });
  } catch (error) {
    console.error("Current Question Error:", error);
    return NextResponse.json({ error: "Failed to fetch current question." }, { status: 500 });
  }
}
