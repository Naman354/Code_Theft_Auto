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
    studentNumber: { 
      type: String, 
      required: true, 
      trim: true,
      match: /^25[0-9]{5,6}$/ // UPDATED REGEX
    },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    isAdmin: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: false // Important: Allows reading from Day 1 DB without breaking due to extra fields (like branch, phone)
  },
);

// userSchema.index({ email: 1 }, { unique: true });
// userSchema.index({ studentNumber: 1 }, { unique: true });

type User = InferSchemaType<typeof userSchema>;

// VERY IMPORTANT: Collection name must be "registrations" to match your Express DB
const UserModel: Model<User> =
  (mongoose.models.Registration as Model<User>) || mongoose.model<User>("Registration", userSchema, "registrations");

export default UserModel;