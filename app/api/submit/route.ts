import { NextResponse } from "next/server";
import { getArenaLevelByNumber } from "@/lib/arena-data";
import { buildScoringSnapshot, getLevelForContest, normalizeAnswer, syncTeamProgressForCurrentLevel } from "@/lib/contest-gameplay";
import { getOrCreateContestState } from "@/lib/contest-state";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedTeamFromRequest } from "@/lib/arena-session";
import { isDuplicateKeyError } from "@/lib/mongoose-errors";
import { applyRateLimit } from "@/lib/request-guard";
import Submission from "@/models/Submission";

export async function POST(request: Request) {
  try {
    const rateLimitError = applyRateLimit(request, {
      bucket: "submit-answer",
      limit: 40,
      windowMs: 60_000,
    });

    if (rateLimitError) {
      return rateLimitError;
    }

    await connectToDatabase();

    const team = await getAuthenticatedTeamFromRequest(request);

    if (!team) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const contestState = await getOrCreateContestState();
    const body = await request.json().catch(() => ({}));
    const submittedAnswer = String(body.answer ?? "");
    const requestedLevel = Number(body.levelNumber ?? contestState.currentLevel);

    if (!submittedAnswer) {
      return NextResponse.json({ error: "Answer is required." }, { status: 400 });
    }

    if (!Number.isInteger(requestedLevel) || requestedLevel < 1) {
      return NextResponse.json({ error: "Level number is invalid." }, { status: 400 });
    }

    if (requestedLevel !== contestState.currentLevel) {
      return NextResponse.json(
        { error: "Answers can only be submitted for the active level." },
        { status: 409 },
      );
    }

    const level = (await getLevelForContest(requestedLevel)) ?? getArenaLevelByNumber(requestedLevel);

    if (!level) {
      return NextResponse.json({ error: "Requested level is not available." }, { status: 404 });
    }

    const now = new Date();
    const levelState = await syncTeamProgressForCurrentLevel(team, contestState, now);

    if (contestState.status !== "running") {
      return NextResponse.json({ error: "No active level is currently running." }, { status: 409 });
    }

    if (levelState.status === "solved") {
      return NextResponse.json({ error: "This level has already been solved." }, { status: 409 });
    }

    if (levelState.status === "expired") {
      return NextResponse.json({ error: "The current level has expired." }, { status: 409 });
    }

    const submittedAnswerNormalized = normalizeAnswer(submittedAnswer);
    const correctAnswerNormalized = normalizeAnswer(
      "answer" in level ? String(level.answer) : level.demoAnswer,
    );
    const isCorrect = submittedAnswerNormalized === correctAnswerNormalized;
    const scoringSnapshot = buildScoringSnapshot({ contestState, levelState, now });

    if (!isCorrect) {
      return NextResponse.json({
        success: true,
        isCorrect: false,
        message: "Incorrect answer.",
      });
    }

    const lockedScore = scoringSnapshot.liveScore;
    levelState.status = "solved";
    levelState.lockedScore = lockedScore;
    levelState.solvedAt = now;
    team.totalLockedScore += lockedScore;
    team.currentLevel = contestState.currentLevel;
    await team.save();

    await Submission.create({
      teamId: team._id,
      levelNumber: requestedLevel,
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
      lockedScore,
      message: "Mission progress recorded.",
      state: {
        currentLevel: contestState.currentLevel,
        totalLockedScore: team.totalLockedScore,
        levelStatus: levelState.status,
        awaitingAdminAdvance: true,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ error: "A final result has already been recorded." }, { status: 409 });
    }

    console.error("Submit Error:", error);
    return NextResponse.json({ error: "Failed to submit answer." }, { status: 500 });
  }
}
