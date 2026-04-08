import { NextResponse } from "next/server";
import { getAuthenticatedTeamFromRequest } from "@/lib/arena-session";
import { getOrCreateContestState } from "@/lib/contest-state";
import { buildCurrentQuestionState, getLevelForContest, syncTeamProgressForCurrentLevel } from "@/lib/contest-gameplay";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const team = await getAuthenticatedTeamFromRequest(request);

    if (!team) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const contestState = await getOrCreateContestState();
    const levelState = await syncTeamProgressForCurrentLevel(team, contestState);
    const level = await getLevelForContest(contestState.currentLevel);

    return NextResponse.json({
      success: true,
      team: {
        id: team._id,
        teamName: team.teamName,
        members: team.members,
        totalLockedScore: team.totalLockedScore,
        currentLevel: team.currentLevel,
      },
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
