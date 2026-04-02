import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    isAdmin: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

userSchema.index({ email: 1 }, { unique: true });

type User = InferSchemaType<typeof userSchema>;

const UserModel: Model<User> =
  (mongoose.models.User as Model<User>) || mongoose.model<User>("User", userSchema);

export default UserModel;
