import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";

type MinimalUser = {
  _id: string;
};

function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateAccessCode() {
  return `GTA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

function generateTeamName() {
  return `Phantom_Squad_${Math.floor(Math.random() * 9000) + 1000}`;
}

async function createUniqueTeam() {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      return await Team.create({
        teamName: generateTeamName(),
        accessCode: generateAccessCode(),
      });
    } catch {
      // Retry on potential duplicate key collision.
    }
  }

  throw new Error("Could not generate a unique team name/access code.");
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const body = await req.json().catch(() => ({}));
    const parsedTeamSize = Number.parseInt(String(body.teamSize ?? "4"), 10);
    const targetTeamSize = Number.isFinite(parsedTeamSize) ? parsedTeamSize : 4;

    if (targetTeamSize < 2) {
      return NextResponse.json(
        { error: "teamSize must be at least 2." },
        { status: 400 },
      );
    }

    const unassignedUsers = (await User.find({ teamId: null })
      .select("_id")
      .lean()) as MinimalUser[];

    if (unassignedUsers.length < targetTeamSize) {
      return NextResponse.json(
        { error: `Not enough students! Need at least ${targetTeamSize} to form a team.` },
        { status: 400 },
      );
    }

    const shuffledUsers = shuffleArray([...unassignedUsers]);

    const teamChunks: MinimalUser[][] = [];
    for (let i = 0; i < shuffledUsers.length; i += targetTeamSize) {
      teamChunks.push(shuffledUsers.slice(i, i + targetTeamSize));
    }

    if (
      teamChunks.length > 1 &&
      teamChunks[teamChunks.length - 1].length < Math.max(2, targetTeamSize - 1)
    ) {
      const lastSmallChunk = teamChunks.pop();
      let distributeIndex = 0;

      if (lastSmallChunk) {
        for (const user of lastSmallChunk) {
          teamChunks[distributeIndex % teamChunks.length].push(user);
          distributeIndex++;
        }
      }
    }

    const createdTeams: Array<{ teamName: string; size: number }> = [];

    for (const teamMembers of teamChunks) {
      const team = await createUniqueTeam();
      const memberIds = teamMembers.map((user) => user._id);

      await User.updateMany(
        { _id: { $in: memberIds } },
        { $set: { teamId: team._id } },
      );

      createdTeams.push({
        teamName: team.teamName,
        size: teamMembers.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${teamChunks.length} teams generated successfully!`,
      targetSizeRequested: targetTeamSize,
      teamsCreated: createdTeams,
    });
  } catch (error) {
    console.error("Team Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate teams" }, { status: 500 });
  }
}
