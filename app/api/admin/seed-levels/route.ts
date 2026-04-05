import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import LevelModel from "@/models/Level";
// import { checkAdminAuth } from "@/lib/admin-auth"; // Agar admin auth lagana ho toh

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // WARNING: Live event mein is route par Admin Authentication zaroor lagayein!
    
    const body = await req.json();
    const { levels } = body;

    if (!levels || !Array.isArray(levels)) {
      return NextResponse.json({ error: "Format galat hai. Levels ka array bhejein." }, { status: 400 });
    }

    // 1. Purane saare questions delete kar do (Taaki duplicate na hon)
    await LevelModel.deleteMany({});

    // 2. Naye questions ek saath database mein daal do
    const insertedLevels = await LevelModel.insertMany(levels);

    return NextResponse.json({
      success: true,
      message: `Mission Accomplished! ${insertedLevels.length} levels successfully database mein load ho gaye hain.`,
    }, { status: 201 });

  } catch (error) {
    console.error("Seeder Error:", error);
    return NextResponse.json({ error: "Levels upload fail ho gaye." }, { status: 500 });
  }
}