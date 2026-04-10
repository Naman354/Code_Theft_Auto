import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const teamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    studentNumber: {
      type: String,
      required: true,
      trim: true,
      match: /^25[0-9]{5,6}$/, // UPDATED: Must start with 25 and be 7 or 8 digits
    },
  },
  {
    _id: false,
  },
);

const teamLevelStateSchema = new Schema(
  {
    levelNumber: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["not_started", "active", "solved", "expired"],
      default: "not_started",
    },
    lockedScore: { type: Number, default: 0, min: 0 },
    solvedAt: { type: Date, default: null },
    expiredAt: { type: Date, default: null },
    clue1PenaltyApplied: { type: Boolean, default: false },
    clue1PenaltyAppliedAt: { type: Date, default: null },
    clue2PenaltyApplied: { type: Boolean, default: false },
    clue2PenaltyAppliedAt: { type: Date, default: null },
  },
  {
    _id: false,
  },
);

const teamSchema = new Schema(
  {
    teamName: { type: String, required: true, unique: true, trim: true },
    teamNameNormalized: { type: String, required: true, unique: true, trim: true },
    teamNumber: { type: Number, required: true, unique: true },
    passwordHash: { type: String, required: true },
    members: {
      type: [teamMemberSchema],
      required: true,
      validate: {
        validator: (members: Array<{ studentNumber: string }>) => {
          if (members.length === 0) {
            return false;
          }

          const uniqueStudentNumbers = new Set(
            members.map((member) => member.studentNumber.trim()),
          );

          return uniqueStudentNumbers.size === members.length;
        },
        message: "Each member must have a unique student number.",
      },
    },
    totalLockedScore: { type: Number, default: 0, min: 0 },
    currentLevel: { type: Number, default: 1 },
    levelStates: { type: [teamLevelStateSchema], default: [] },
    lastLoginAt: { type: Date, default: null },
    isDisqualified: { type: Boolean, default: false },
    tabSwitchCount: { type: Number, default: 0, min: 0 },
    activeSessions: {
      type: [
        {
          sessionId: { type: String, required: true },
          lastActive: { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// teamSchema.index({ teamName: 1 }, { unique: true });
// teamSchema.index({ teamNameNormalized: 1 }, { unique: true });

type Team = InferSchemaType<typeof teamSchema>;

const TeamModel: Model<Team> =
  (mongoose.models.Team as Model<Team>) || mongoose.model<Team>("Team", teamSchema);

export default TeamModel;