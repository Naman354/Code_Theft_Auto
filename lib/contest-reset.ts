import Submission from "@/models/Submission";
import Team from "@/models/Team";

export async function resetTeamsForLevel(levelNumber: number) {
  const teams = await Team.find({});

  for (const team of teams) {
    const levelState = team.levelStates.find((entry) => entry.levelNumber === levelNumber);

    if (levelState?.status === "solved") {
      team.totalLockedScore = Math.max(0, team.totalLockedScore - (levelState.lockedScore ?? 0));
    }

    team.levelStates = team.levelStates.filter((entry) => entry.levelNumber !== levelNumber) as typeof team.levelStates;
    team.currentLevel = levelNumber;
    await team.save();
  }

  await Submission.deleteMany({ levelNumber });
}

export async function resetEntireContest() {
  const teams = await Team.find({});

  for (const team of teams) {
    team.totalLockedScore = 0;
    team.currentLevel = 1;
    team.levelStates = [];
    await team.save();
  }

  await Submission.deleteMany({});
}
