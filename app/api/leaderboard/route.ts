import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";

const DEFAULT_LEADERBOARD_LIMIT = 10;
const MAX_LEADERBOARD_LIMIT = 10;

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
          solvedLevelsCount: {
            $size: {
              $filter: {
                input: "$levelStates",
                as: "levelState",
                cond: { $eq: ["$$levelState.status", "solved"] },
              },
            },
          },
        },
      },
      {
        $sort: {
          totalLockedScore: -1,
          solvedLevelsCount: -1,
          createdAt: 1,
          teamName: 1,
        },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          teamName: 1,
          totalLockedScore: 1,
          currentLevel: 1,
          solvedLevelsCount: 1,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      leaderboard: leaderboard.map((team, index) => ({
        rank: index + 1,
        teamId: team._id,
        teamName: team.teamName,
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
