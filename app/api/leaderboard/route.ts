import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";

const DEFAULT_LEADERBOARD_LIMIT = 10;
const MAX_LEADERBOARD_LIMIT = 50;

function parseLeaderboardLimit(url: string) {
  const searchParams = new URL(url).searchParams;
  const rawLimit = Number(searchParams.get("limit") ?? DEFAULT_LEADERBOARD_LIMIT);

  if (!Number.isFinite(rawLimit) || !Number.isInteger(rawLimit) || rawLimit < 1) {
    return DEFAULT_LEADERBOARD_LIMIT;
  }

  return Math.min(rawLimit, MAX_LEADERBOARD_LIMIT);
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const limit = parseLeaderboardLimit(req.url);
    
    const leaderboard = await Team.aggregate([
      {
        $addFields: {
          // 1. Count solved levels
          solvedLevelsCount: {
            $size: {
              $filter: {
                input: "$levelStates",
                as: "levelState",
                cond: { $eq: ["$$levelState.status", "solved"] },
              },
            },
          },
          // 2.Find the exact time they solved their last question
          lastSolvedAt: {
            $max: {
              $map: {
                input: {
                  $filter: {
                    input: "$levelStates",
                    as: "levelState",
                    cond: { $eq: ["$$levelState.status", "solved"] },
                  },
                },
                as: "solvedLevel",
                in: "$$solvedLevel.solvedAt",
              },
            },
          },
        },
      },
      {
        $sort: {
          totalLockedScore: -1,       // 1st Priority: Highest Score
          lastSolvedAt: 1,            // 2nd Priority: Fastest to reach that score (Earliest time)
          solvedLevelsCount: -1,      // 3rd Priority: Most levels solved
          teamNumber: 1,              // Fallback
        },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          teamName: 1,
          teamNumber: 1,
          totalLockedScore: 1,
          currentLevel: 1,
          solvedLevelsCount: 1,
          lastSolvedAt: 1
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      leaderboard: leaderboard.map((team, index) => ({
        rank: index + 1,
        teamId: team._id,
        teamName: team.teamName,
        teamNumber: team.teamNumber,
        totalLockedScore: team.totalLockedScore,
        currentLevel: team.currentLevel,
        solvedLevelsCount: team.solvedLevelsCount,
      })),
    });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard." }, { status: 500 });
  }
}
