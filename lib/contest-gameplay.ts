import Level from "@/models/Level";
import Submission from "@/models/Submission";
import type ContestState from "@/models/ContestState";
import type Team from "@/models/Team";

type TeamLevelState = {
  levelNumber: number;
  status: "not_started" | "active" | "solved" | "expired";
  lockedScore: number;
  solvedAt: Date | null;
  expiredAt: Date | null;
  clue1PenaltyApplied: boolean;
  clue1PenaltyAppliedAt: Date | null;
  clue2PenaltyApplied: boolean;
  clue2PenaltyAppliedAt: Date | null;
};

function getElapsedSeconds(levelStartedAt: Date | null, now: Date) {
  if (!levelStartedAt) {
    return 0;
  }

  return Math.max(0, Math.floor((now.getTime() - levelStartedAt.getTime()) / 1000));
}

function getContestElapsedSeconds(
  contestState: InstanceType<typeof ContestState>,
  now: Date,
) {
  const baseElapsed = contestState.elapsedSeconds ?? 0;

  if (contestState.status !== "running") {
    return baseElapsed;
  }

  return baseElapsed + getElapsedSeconds(contestState.levelStartedAt ?? null, now);
}

function getTimeRemainingSeconds(levelEndsAt: Date | null, now: Date) {
  if (!levelEndsAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((levelEndsAt.getTime() - now.getTime()) / 1000));
}

function calculateTimeDecay(elapsedSeconds: number, gracePeriodSeconds: number, decayPerSecond: number) {
  return Math.max(0, elapsedSeconds - gracePeriodSeconds) * decayPerSecond;
}


export function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function getOrCreateTeamLevelState(team: InstanceType<typeof Team>, levelNumber: number) {
  const existingState = team.levelStates.find((levelState) => levelState.levelNumber === levelNumber);

  if (existingState) {
    return existingState;
  }

  const newState: TeamLevelState = {
    levelNumber,
    status: "not_started",
    lockedScore: 0,
    solvedAt: null,
    expiredAt: null,
    clue1PenaltyApplied: false,
    clue1PenaltyAppliedAt: null,
    clue2PenaltyApplied: false,
    clue2PenaltyAppliedAt: null,
  };

  team.levelStates.push(newState);
  return team.levelStates[team.levelStates.length - 1];
}

export async function getLevelForContest(levelNumber: number) {
  return Level.findOne({ levelNumber });
}

export async function syncTeamProgressForCurrentLevel(
  team: InstanceType<typeof Team>,
  contestState: InstanceType<typeof ContestState>,
  now = new Date(),
) {
  const levelState = getOrCreateTeamLevelState(team, contestState.currentLevel);
  let hasChanges = false;

  if (team.currentLevel !== contestState.currentLevel && levelState.status !== "solved") {
    team.currentLevel = contestState.currentLevel;
    hasChanges = true;
  }

  if (contestState.status === "running" && levelState.status === "not_started") {
    levelState.status = "active";
    hasChanges = true;
  }

  const elapsedSeconds = getContestElapsedSeconds(contestState, now);

  if (
    contestState.status === "running" &&
    elapsedSeconds >= contestState.clue1UnlockSeconds &&
    !levelState.clue1PenaltyApplied
  ) {
    levelState.clue1PenaltyApplied = true;
    levelState.clue1PenaltyAppliedAt = now;
    hasChanges = true;
  }

  if (
    contestState.status === "running" &&
    elapsedSeconds >= contestState.clue2UnlockSeconds &&
    !levelState.clue2PenaltyApplied
  ) {
    levelState.clue2PenaltyApplied = true;
    levelState.clue2PenaltyAppliedAt = now;
    hasChanges = true;
  }

  if (
    contestState.status === "running" &&
    contestState.levelEndsAt &&
    now >= contestState.levelEndsAt &&
    levelState.status !== "solved" &&
    levelState.status !== "expired"
  ) {
    levelState.status = "expired";
    levelState.lockedScore = 0;
    levelState.expiredAt = now;
    hasChanges = true;
  }

  if (hasChanges) {
    await team.save();
  }

  if (levelState.status === "expired") {
    const scoringSnapshot = buildScoringSnapshot({
      contestState,
      levelState,
      now,
    });

    await Submission.findOneAndUpdate(
      {
        teamId: team._id,
        levelNumber: contestState.currentLevel,
      },
      {
        $setOnInsert: {
          resultType: "expired",
          submittedAnswer: null,
          submittedAnswerNormalized: null,
          isCorrect: false,
          lockedScore: 0,
          clue1PenaltyApplied: levelState.clue1PenaltyApplied,
          clue2PenaltyApplied: levelState.clue2PenaltyApplied,
          responseTimeSeconds: scoringSnapshot.responseTimeSeconds,
          submittedAt: now,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  return levelState;
}

export function buildCurrentQuestionState(params: {
  contestState: InstanceType<typeof ContestState>;
  team: InstanceType<typeof Team>;
  level: Awaited<ReturnType<typeof getLevelForContest>>;
  levelState: ReturnType<typeof getOrCreateTeamLevelState>;
  now?: Date;
}) {
  const { contestState, team, level, levelState } = params;
  const now = params.now ?? new Date();

  const elapsedContestSeconds = getContestElapsedSeconds(contestState, now);
  const timeRemainingSeconds =
    contestState.status === "paused"
      ? Math.max(0, contestState.durationSeconds - elapsedContestSeconds)
      : getTimeRemainingSeconds(contestState.levelEndsAt ?? null, now);
  const clue1Visible = contestState.status === "running" && elapsedContestSeconds >= contestState.clue1UnlockSeconds;
  const clue2Visible = contestState.status === "running" && elapsedContestSeconds >= contestState.clue2UnlockSeconds;
  const timeDecay = calculateTimeDecay(
    Math.min(elapsedContestSeconds, contestState.durationSeconds),
    contestState.gracePeriodSeconds,
    contestState.decayPerSecond,
  );
  const cluePenaltyTotal =
    (levelState.clue1PenaltyApplied ? contestState.clue1Penalty : 0) +
    (levelState.clue2PenaltyApplied ? contestState.clue2Penalty : 0);
  const liveScore =
    levelState.status === "solved" || levelState.status === "expired"
      ? levelState.lockedScore
      : Math.max(0, contestState.maxPointsPerQuestion - timeDecay - cluePenaltyTotal);

  return {
    contestStatus: contestState.status,
    currentLevel: contestState.currentLevel,
    teamCurrentLevel: team.currentLevel,
    levelState: {
      levelNumber: levelState.levelNumber,
      status: levelState.status,
      lockedScore: levelState.lockedScore,
      solvedAt: levelState.solvedAt,
      expiredAt: levelState.expiredAt,
      clue1PenaltyApplied: levelState.clue1PenaltyApplied,
      clue1PenaltyAppliedAt: levelState.clue1PenaltyAppliedAt,
      clue2PenaltyApplied: levelState.clue2PenaltyApplied,
      clue2PenaltyAppliedAt: levelState.clue2PenaltyAppliedAt,
    },
    totalLockedScore: team.totalLockedScore,
    timer: {
      levelStartedAt: contestState.levelStartedAt,
      levelEndsAt: contestState.levelEndsAt,
      elapsedSeconds: elapsedContestSeconds,
      timeRemainingSeconds,
      durationSeconds: contestState.durationSeconds,
    },
    scoring: {
      maxPointsPerQuestion: contestState.maxPointsPerQuestion,
      gracePeriodSeconds: contestState.gracePeriodSeconds,
      decayPerSecond: contestState.decayPerSecond,
      clue1UnlockSeconds: contestState.clue1UnlockSeconds,
      clue1Penalty: contestState.clue1Penalty,
      clue2UnlockSeconds: contestState.clue2UnlockSeconds,
      clue2Penalty: contestState.clue2Penalty,
      timeDecay,
      cluePenaltyTotal,
      liveScore,
    },
    question: level
      ? {
        levelNumber: level.levelNumber,
        question: level.question,
        snippets: Array.isArray(level.snippets)
          ? level.snippets.map((snippet) => ({
              language: snippet.language,
              code: snippet.code,
            }))
          : [],
        clue1: clue1Visible ? level.clue1 : null,
        clue2: clue2Visible ? level.clue2 : null,
      }
      : null,
  };
}

export function buildScoringSnapshot(params: {
  contestState: InstanceType<typeof ContestState>;
  levelState: ReturnType<typeof getOrCreateTeamLevelState>;
  now?: Date;
}) {
  const { contestState, levelState } = params;
  const now = params.now ?? new Date();

  const elapsedSeconds = getContestElapsedSeconds(contestState, now);
  const responseTimeSeconds = Math.min(elapsedSeconds, contestState.durationSeconds);
  const timeDecay = calculateTimeDecay(
    responseTimeSeconds,
    contestState.gracePeriodSeconds,
    contestState.decayPerSecond,
  );
  const cluePenaltyTotal =
    (levelState.clue1PenaltyApplied ? contestState.clue1Penalty : 0) +
    (levelState.clue2PenaltyApplied ? contestState.clue2Penalty : 0);
  const liveScore = Math.max(0, contestState.maxPointsPerQuestion - timeDecay - cluePenaltyTotal);

  return {
    elapsedSeconds,
    responseTimeSeconds,
    timeDecay,
    cluePenaltyTotal,
    liveScore,
  };
}
