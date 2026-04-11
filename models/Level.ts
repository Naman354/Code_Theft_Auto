import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const levelSchema = new Schema(
  {
    levelNumber: { type: Number, required: true, unique: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    snippets: [
  {
    language: { type: String, required: true }, // 'python', 'java', 'cpp', 'c'
    code: { type: String, required: true }
  }
],
    clue1: { type: String, default: null },
    clue2: { type: String, default: null },
    maxPoints: { type: Number, required: true, default: 1400, min: 0 },
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

levelSchema.index({ levelNumber: 1 }, { unique: true });

type Level = InferSchemaType<typeof levelSchema>;

const LevelModel: Model<Level> =
  (mongoose.models.Level as Model<Level>) || mongoose.model<Level>("Level", levelSchema);

export default LevelModel;
