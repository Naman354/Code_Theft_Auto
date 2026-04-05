import { NextResponse } from "next/server";
import { getOrCreateContestState } from "@/lib/contest-state";
import { connectToDatabase } from "@/lib/mongodb";
import { ARENA_LEVELS, type ArenaLevelView } from "@/lib/arena-data";
import { getAuthenticatedTeamFromRequest } from "@/lib/arena-session";

function buildLevelViews(params: {
  teamCurrentLevel?: number;
  contestCurrentLevel?: number;
  teamLevelStates?: Array<{ levelNumber: number; status?: string; lockedScore?: number }>;
}) {
  const { teamCurrentLevel = 1, contestCurrentLevel = 1, teamLevelStates = [] } = params;

  return ARENA_LEVELS.map((level) => {
    const teamLevelState = teamLevelStates.find((state) => state.levelNumber === level.levelNumber);
    const isUnlocked = level.levelNumber <= teamCurrentLevel;
    const status: ArenaLevelView["status"] =
      teamLevelState?.status === "solved"
        ? "completed"
        : level.levelNumber === teamCurrentLevel && level.levelNumber === contestCurrentLevel
          ? "active"
          : isUnlocked
            ? "unlocked"
            : "locked";

    return {
      ...level,
      status,
    };
  });
}

export async function GET(request: Request) {
  try {
    let contestCurrentLevel = 1;
    let teamCurrentLevel = 1;

    try {
      await connectToDatabase();
      const contestState = await getOrCreateContestState();
      contestCurrentLevel = contestState.currentLevel;

      const team = await getAuthenticatedTeamFromRequest(request);

      if (team) {
        teamCurrentLevel = team.currentLevel;

        return NextResponse.json({
          success: true,
          contestState: {
            status: contestState.status,
            currentLevel: contestState.currentLevel,
            totalLevels: contestState.totalLevels,
            totalLockedScore: team.totalLockedScore,
          },
          levels: buildLevelViews({
            teamCurrentLevel,
            contestCurrentLevel,
            teamLevelStates: team.levelStates as Array<{ levelNumber: number; status?: string; lockedScore?: number }>,
          }).map((level) => ({
            ...level,
            score:
              (team.levelStates.find((state) => state.levelNumber === level.levelNumber)?.lockedScore as number | undefined) ??
              0,
            timeRemaining: level.duration,
          })),
        });
      }
    } catch {
      // Fall back to a static manifest when the database is unavailable.
    }

    return NextResponse.json({
      success: true,
      contestState: {
        status: "not_started",
        currentLevel: contestCurrentLevel,
        totalLevels: ARENA_LEVELS.length,
      },
      levels: buildLevelViews({
        teamCurrentLevel,
        contestCurrentLevel,
      }),
    });
  } catch (error) {
    console.error("Levels Error:", error);
    return NextResponse.json({ error: "Failed to fetch levels." }, { status: 500 });
  }
}
