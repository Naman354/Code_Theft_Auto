import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";
import { Types } from "mongoose";

const TEAM_SIZE = 5;

type MinimalUser = {
  _id: Types.ObjectId;
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

async function getNextTeamNumber() {
  const existingTeams = await Team.find({ teamName: /^team-\d+$/i })
    .select("teamName")
    .lean();

  let maxTeamNumber = 0;

  for (const team of existingTeams) {
    const match = /^team-(\d+)$/i.exec(team.teamName);
    if (!match) continue;

    const teamNumber = Number.parseInt(match[1], 10);
    if (teamNumber > maxTeamNumber) {
      maxTeamNumber = teamNumber;
    }
  }

  return maxTeamNumber + 1;
}

async function createUniqueTeam(startingTeamNumber: number) {
  let teamNumber = startingTeamNumber;

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      return await Team.create({
        teamName: `team-${teamNumber}`,
        accessCode: generateAccessCode(),
      });
    } catch (error) {
      const duplicateError =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000;

      if (!duplicateError) {
        throw error;
      }

      const duplicateKey =
        typeof error === "object" &&
        error !== null &&
        "keyPattern" in error &&
        typeof error.keyPattern === "object" &&
        error.keyPattern !== null
          ? error.keyPattern
          : null;

      if (duplicateKey && "teamName" in duplicateKey) {
        teamNumber++;
      }
    }
  }

  throw new Error("Could not generate a unique team/access code.");
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    await req.json().catch(() => ({}));

    const unassignedUsers = (await User.find({ teamId: null })
      .select("_id").lean()) as MinimalUser[];

    if (unassignedUsers.length < TEAM_SIZE) {
      return NextResponse.json(
        { error: `Not enough students! Need at least ${TEAM_SIZE} to form a team.` },
        { status: 400 },
      );
    }

    const shuffledUsers = shuffleArray([...unassignedUsers]);

    const teamChunks: MinimalUser[][] = [];
    for (let i = 0; i < shuffledUsers.length; i += TEAM_SIZE) {
      teamChunks.push(shuffledUsers.slice(i, i + TEAM_SIZE));
    }

    if (teamChunks.length > 1 && teamChunks[teamChunks.length - 1].length < 4) {
      const lastSmallChunk = teamChunks.pop();

      if (lastSmallChunk) {
        const eligibleTeamIndexes = shuffleArray(teamChunks.map((_, index) => index));

        if (eligibleTeamIndexes.length >= lastSmallChunk.length) {
          for (const [index, user] of lastSmallChunk.entries()) {
            teamChunks[eligibleTeamIndexes[index]].push(user);
          }
        } else {
          teamChunks.push(lastSmallChunk);
        }
      }
    }

    const createdTeams: Array<{ teamName: string; size: number }> = [];
    let nextTeamNumber = await getNextTeamNumber();

    for (const teamMembers of teamChunks) {
      const team = await createUniqueTeam(nextTeamNumber);
      const memberIds = teamMembers.map((user) => user._id);

      const teamNumberMatch = /^team-(\d+)$/i.exec(team.teamName);
      if (teamNumberMatch) {
        nextTeamNumber = Number.parseInt(teamNumberMatch[1], 10) + 1;
      }

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
      targetSizeRequested: TEAM_SIZE,
      teamsCreated: createdTeams,
    });
  } catch (error) {
    console.error("Team Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate teams" }, { status: 500 });
  }
}
