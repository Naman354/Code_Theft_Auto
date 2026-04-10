import { NextResponse } from "next/server";
import { ensureAdminAccess } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Team from "@/models/Team";

export async function GET(request: Request) {
  try {
    const authError = await ensureAdminAccess(request);

    if (authError) {
      return authError;
    }

    await connectToDatabase();

    const [teams, submissionSnapshots] = await Promise.all([
      Team.find({})
        .select("teamName currentLevel totalLockedScore levelStates isDisqualified tabSwitchCount")
        .sort({ totalLockedScore: -1, currentLevel: -1, teamName: 1 })
        .lean(),
      Submission.aggregate([
        {
          $group: {
            _id: "$teamId",
            lastSubmissionAt: { $max: "$submittedAt" },
          },
        },
      ]),
    ]);

    const latestSubmissionByTeam = new Map<string, Date>(
      submissionSnapshots.map((entry) => [String(entry._id), entry.lastSubmissionAt as Date]),
    );

    const payload = teams.map((team) => {
      const penaltyCount = (team.levelStates ?? []).reduce((count, levelState) => {
        let nextCount = count;
        if (levelState.clue1PenaltyApplied) {
          nextCount += 1;
        }
        if (levelState.clue2PenaltyApplied) {
          nextCount += 1;
        }
        return nextCount;
      }, 0);

      return {
        id: String(team._id),
        teamName: team.teamName,
        currentLevel: team.currentLevel ?? 1,
        score: team.totalLockedScore ?? 0,
        penalties: penaltyCount,
        lastSubmissionAt: latestSubmissionByTeam.get(String(team._id)) ?? null,
        isDisqualified: team.isDisqualified ?? false,
        tabSwitchCount: team.tabSwitchCount ?? 0,
      };
    });

    return NextResponse.json({
      success: true,
      teams: payload,
      totalTeams: payload.length,
    });
  } catch (error) {
    console.error("Admin Teams Error:", error);
    return NextResponse.json({ error: "Failed to fetch teams." }, { status: 500 });
  }
}
