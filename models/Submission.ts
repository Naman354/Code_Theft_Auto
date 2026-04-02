import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const submissionSchema = new Schema(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    levelNumber: { type: Number, required: true },
    pointsAwarded: { type: Number, required: true },
    cluesUsed: { type: Number, default: 0 },
    isSolved: { type: Boolean, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  },
);

submissionSchema.index({ teamId: 1, levelNumber: 1 });

type Submission = InferSchemaType<typeof submissionSchema>;

const SubmissionModel: Model<Submission> =
  (mongoose.models.Submission as Model<Submission>) ||
  mongoose.model<Submission>("Submission", submissionSchema);

export default SubmissionModel;
