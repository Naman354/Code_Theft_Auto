import ContestState from "@/models/ContestState";

export async function getOrCreateContestState() {
  const contestState =
    (await ContestState.findOne({ key: "global" })) ||
    (await ContestState.create({
      key: "global",
    }));

  return contestState;
}
