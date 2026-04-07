import { NextResponse } from "next/server";
import { ensureAdminAccess } from "@/lib/admin-auth";
import { ARENA_LEVELS } from "@/lib/arena-data";
import { connectToDatabase } from "@/lib/mongodb";
import LevelModel from "@/models/Level";

type SeedLevelInput = {
  levelNumber: number;
  question: string;
  answer: string;
  clue1?: string | null;
  clue2?: string | null;
  maxPoints?: number;
  gracePeriodSeconds?: number;
  durationSeconds?: number;
  decayPerSecond?: number;
  clue1UnlockSeconds?: number;
  clue1Penalty?: number;
  clue2UnlockSeconds?: number;
  clue2Penalty?: number;
};

function getDefaultSeedLevels() {
  return ARENA_LEVELS.map((level) => ({
    levelNumber: level.levelNumber,
    question: level.objective,
    answer: level.demoAnswer,
    clue1: `Hint 1: Focus on ${level.title.split("-").at(-1)?.trim() ?? "the objective"}.`,
    clue2: `Hint 2: The expected answer resembles ${level.demoAnswer}.`,
  }));
}

export async function POST(request: Request) {
  try {
    const authError = await ensureAdminAccess(request);

    if (authError) {
      return authError;
    }

    await connectToDatabase();

    const body = (await request.json().catch(() => ({}))) as { levels?: SeedLevelInput[] };
    const inputLevels = Array.isArray(body.levels) && body.levels.length > 0 ? body.levels : getDefaultSeedLevels();

    if (!Array.isArray(inputLevels) || inputLevels.length === 0) {
      return NextResponse.json({ error: "Levels payload is required." }, { status: 400 });
    }

    await LevelModel.deleteMany({});
    const insertedLevels = await LevelModel.insertMany(inputLevels);

    return NextResponse.json(
      {
        success: true,
        message: `${insertedLevels.length} levels have been seeded successfully.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Seed Levels Error:", error);
    return NextResponse.json({ error: "Failed to seed levels." }, { status: 500 });
  }
}
