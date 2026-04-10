import { NextResponse } from "next/server";
import { getOrCreateContestState } from "@/lib/contest-state";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import { ARENA_LEVELS, DEFAULT_LEADERBOARD } from "@/lib/arena-data";

export async function GET() {
  try {
    await connectToDatabase();

    const contestState = await getOrCreateContestState();
    const leaderboard = await Team.aggregate([
      {
        $project: {
          teamName: 1,
          totalLockedScore: { $ifNull: ["$totalLockedScore", 0] },
          currentLevel: { $ifNull: ["$currentLevel", 1] },
          isDisqualified: { $ifNull: ["$isDisqualified", false] },
        },
      },
      { $sort: { totalLockedScore: -1, currentLevel: -1, teamName: 1 } },
      {
        $project: {
          teamName: 1,
          score: "$totalLockedScore",
          level: "$currentLevel",
          isDisqualified: 1,
        },
      },
    ]);

    const activeLevel =
      ARENA_LEVELS.find((level) => level.levelNumber === contestState.currentLevel) ?? ARENA_LEVELS[0] ?? null;

    return NextResponse.json({
      success: true,
      contestState: {
        status: contestState.status,
        currentLevel: contestState.currentLevel,
        totalLevels: contestState.totalLevels,
      },
      activeLevel: activeLevel
        ? {
            levelNumber: activeLevel.levelNumber,
            title: activeLevel.title,
            difficulty: activeLevel.difficulty,
            description: activeLevel.description,
            reward: activeLevel.reward,
          }
        : null,
      leaderboard:
        leaderboard.length > 0
          ? leaderboard.map((team, index) => ({
              rank: index + 1,
              teamName: String(team.teamName ?? "UNKNOWN"),
              score: Number(team.score ?? 0),
              level: Number(team.level ?? 1),
              isDisqualified: Boolean(team.isDisqualified),
            }))
          : DEFAULT_LEADERBOARD.map((row) => ({
              ...row,
              isDisqualified: false,
            })),
    });
  } catch (error) {
    console.error("Showcase Error:", error);

    const fallbackLevel = ARENA_LEVELS[0] ?? null;

    return NextResponse.json({
      success: true,
      contestState: {
        status: "not_started",
        currentLevel: 1,
        totalLevels: ARENA_LEVELS.length,
      },
      activeLevel: fallbackLevel
        ? {
            levelNumber: fallbackLevel.levelNumber,
            title: fallbackLevel.title,
            difficulty: fallbackLevel.difficulty,
            description: fallbackLevel.description,
            reward: fallbackLevel.reward,
          }
        : null,
      leaderboard: DEFAULT_LEADERBOARD.map((row) => ({
        ...row,
        isDisqualified: false,
      })),
    });
  }
}
