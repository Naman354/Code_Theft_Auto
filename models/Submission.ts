import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const submissionSchema = new Schema(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    levelNumber: { type: Number, required: true },
    submittedAnswer: { type: String, required: true, trim: true },
    submittedAnswerNormalized: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, required: true },
    lockedScore: { type: Number, required: true, min: 0 },
    clue1PenaltyApplied: { type: Boolean, required: true, default: false },
    clue2PenaltyApplied: { type: Boolean, required: true, default: false },
    responseTimeSeconds: { type: Number, required: true, min: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  },
);

submissionSchema.index({ teamId: 1, levelNumber: 1 });
submissionSchema.index({ teamId: 1, levelNumber: 1, submittedAt: -1 });

type Submission = InferSchemaType<typeof submissionSchema>;

const SubmissionModel: Model<Submission> =
  (mongoose.models.Submission as Model<Submission>) ||
  mongoose.model<Submission>("Submission", submissionSchema);

export default SubmissionModel;
