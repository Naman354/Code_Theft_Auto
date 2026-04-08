import ContestState from "@/models/ContestState";
import Level from "@/models/Level";

export async function getOrCreateContestState() {
  const contestState =
    (await ContestState.findOne({ key: "global" })) ||
    (await ContestState.create({
      key: "global",
    }));

  const highestConfiguredLevel = await Level.findOne({})
    .sort({ levelNumber: -1 })
    .select("levelNumber")
    .lean();

  const nextTotalLevels = highestConfiguredLevel?.levelNumber ?? contestState.totalLevels;

  if (contestState.totalLevels !== nextTotalLevels) {
    contestState.totalLevels = nextTotalLevels;
    await contestState.save();
  }

  return contestState;
}
