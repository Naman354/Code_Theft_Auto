import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

const legacyUserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
  },
  { strict: false },
);

const legacyCollectionName = process.env.LEGACY_USERS_COLLECTION || "legacy_users";

const LegacyUser =
  (mongoose.models.LegacyUser as mongoose.Model<{ name?: string; email?: string }>) ||
  mongoose.model("LegacyUser", legacyUserSchema, legacyCollectionName);

export async function POST() {
  try {
    await connectToDatabase();

    const legacyUsers = await LegacyUser.find({}).lean();

    if (legacyUsers.length === 0) {
      return NextResponse.json(
        {
          message: `No users found in legacy collection '${legacyCollectionName}'.`,
        },
        { status: 404 },
      );
    }

    let migratedCount = 0;

    for (const rawUser of legacyUsers) {
      const name = rawUser.name?.trim();
      const email = rawUser.email?.trim().toLowerCase();

      if (!name || !email) {
        continue;
      }

      const exists = await User.exists({ email });
      if (exists) {
        continue;
      }

      await User.create({ name, email });
      migratedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${migratedCount} users migrated into the primary Mongo user collection.`,
      legacyCollection: legacyCollectionName,
    });
  } catch (error) {
    console.error("Migration Error:", error);
    return NextResponse.json({ error: "Failed to migrate users" }, { status: 500 });
  }
}
