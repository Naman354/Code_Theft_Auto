import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const teamSchema = new Schema(
  {
    teamName: { type: String, required: true, unique: true, trim: true },
    accessCode: { type: String, required: true, unique: true, trim: true },
    totalPoints: { type: Number, default: 0 },
    currentLevel: { type: Number, default: 1 },
    isFinalist: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

teamSchema.index({ teamName: 1 }, { unique: true });
teamSchema.index({ accessCode: 1 }, { unique: true });

type Team = InferSchemaType<typeof teamSchema>;

const TeamModel: Model<Team> =
  (mongoose.models.Team as Model<Team>) || mongoose.model<Team>("Team", teamSchema);

export default TeamModel;
