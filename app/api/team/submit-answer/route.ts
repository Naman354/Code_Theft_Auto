import { NextResponse } from "next/server";
import {
  buildScoringSnapshot,
  getLevelForContest,
  normalizeAnswer,
  syncTeamProgressForCurrentLevel,
} from "@/lib/contest-gameplay";
import { getOrCreateContestState } from "@/lib/contest-state";
import { connectToDatabase } from "@/lib/mongodb";
import { isDuplicateKeyError } from "@/lib/mongoose-errors";
import { getAuthenticatedTeam } from "@/lib/team-access";
import Submission from "@/models/Submission";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const team = await getAuthenticatedTeam();

    if (!team) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const contestState = await getOrCreateContestState();

    if (contestState.status !== "running") {
      return NextResponse.json({ error: "No active level is currently running." }, { status: 409 });
    }

    const body = await req.json().catch(() => ({}));
    const submittedAnswer = String(body.answer ?? "").trim();

    if (!submittedAnswer) {
      return NextResponse.json({ error: "Answer is required." }, { status: 400 });
    }

    const level = await getLevelForContest(contestState.currentLevel);

    if (!level) {
      return NextResponse.json({ error: "Current level question was not found." }, { status: 404 });
    }

    const now = new Date();
    const levelState = await syncTeamProgressForCurrentLevel(team, contestState, now);

    if (levelState.status === "solved") {
      return NextResponse.json(
        { error: "This level has already been solved by the team." },
        { status: 409 },
      );
    }

    if (levelState.status === "expired") {
      return NextResponse.json(
        { error: "The current level has already expired for this team." },
        { status: 409 },
      );
    }

    const submittedAnswerNormalized = normalizeAnswer(submittedAnswer);
    const correctAnswerNormalized = normalizeAnswer(level.answer);
    const isCorrect = submittedAnswerNormalized === correctAnswerNormalized;
    const scoringSnapshot = buildScoringSnapshot({
      contestState,
      levelState,
      now,
    });

    if (!isCorrect) {
      return NextResponse.json({
        success: true,
        isCorrect: false,
        message: "Incorrect answer.",
        state: {
          currentLevel: contestState.currentLevel,
          totalLockedScore: team.totalLockedScore,
          levelStatus: levelState.status,
        },
      });
    }

    const lockedScore = scoringSnapshot.liveScore;

    levelState.status = "solved";
    levelState.lockedScore = lockedScore;
    levelState.solvedAt = now;
    team.totalLockedScore += lockedScore;
    team.currentLevel = Math.min(contestState.currentLevel + 1, contestState.totalLevels);
    await team.save();

    await Submission.create({
      teamId: team._id,
      levelNumber: contestState.currentLevel,
      resultType: "solved",
      submittedAnswer,
      submittedAnswerNormalized,
      isCorrect: true,
      lockedScore,
      clue1PenaltyApplied: levelState.clue1PenaltyApplied,
      clue2PenaltyApplied: levelState.clue2PenaltyApplied,
      responseTimeSeconds: scoringSnapshot.responseTimeSeconds,
      submittedAt: now,
    });

    return NextResponse.json({
      success: true,
      isCorrect: true,
      message: "Correct answer submitted successfully.",
      lockedScore,
      state: {
        currentLevel: contestState.currentLevel,
        nextLevel: team.currentLevel,
        totalLockedScore: team.totalLockedScore,
        levelStatus: levelState.status,
        solvedAt: levelState.solvedAt,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: "A final result has already been recorded for this level." },
        { status: 409 },
      );
    }

    console.error("Submit Answer Error:", error);
    return NextResponse.json({ error: "Failed to submit answer." }, { status: 500 });
  }
}
