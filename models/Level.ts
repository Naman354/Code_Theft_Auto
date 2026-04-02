import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const levelSchema = new Schema(
  {
    levelNumber: { type: Number, required: true, unique: true },
    type: { type: String, required: true, trim: true },
    questionData: { type: Schema.Types.Mixed, required: true },
    answerHash: { type: String, required: true },
    clue1: { type: String, default: null },
    clue2: { type: String, default: null },
  },
  {
    timestamps: false,
  },
);

levelSchema.index({ levelNumber: 1 }, { unique: true });

type Level = InferSchemaType<typeof levelSchema>;

const LevelModel: Model<Level> =
  (mongoose.models.Level as Model<Level>) || mongoose.model<Level>("Level", levelSchema);

export default LevelModel;
