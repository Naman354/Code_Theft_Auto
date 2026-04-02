import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const contestStateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    status: {
      type: String,
      enum: ["not_started", "running", "paused", "completed"],
      default: "not_started",
    },
    totalLevels: { type: Number, required: true, default: 4, min: 1 },
    currentLevel: { type: Number, required: true, default: 1, min: 1 },
    levelStartedAt: { type: Date, default: null },
    levelEndsAt: { type: Date, default: null },
    maxPointsPerQuestion: { type: Number, required: true, default: 1400, min: 0 },
    gracePeriodSeconds: { type: Number, required: true, default: 30, min: 0 },
    durationSeconds: { type: Number, required: true, default: 900, min: 1 },
    decayPerSecond: { type: Number, required: true, default: 1, min: 0 },
    clue1UnlockSeconds: { type: Number, required: true, default: 420, min: 0 },
    clue1Penalty: { type: Number, required: true, default: 200, min: 0 },
    clue2UnlockSeconds: { type: Number, required: true, default: 720, min: 0 },
    clue2Penalty: { type: Number, required: true, default: 250, min: 0 },
  },
  {
    timestamps: true,
  },
);

contestStateSchema.index({ key: 1 }, { unique: true });

type ContestState = InferSchemaType<typeof contestStateSchema>;

const ContestStateModel: Model<ContestState> =
  (mongoose.models.ContestState as Model<ContestState>) ||
  mongoose.model<ContestState>("ContestState", contestStateSchema);

export default ContestStateModel;
