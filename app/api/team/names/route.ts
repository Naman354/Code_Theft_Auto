import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";

export async function GET() {
  try {
    await connectToDatabase();

    const teams = await Team.find({})
      .select("teamName members")
      .sort({ teamName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      totalTeams: teams.length,
      teams: teams.map((team) => ({
        id: String(team._id),
        teamName: team.teamName,
        memberCount: Array.isArray(team.members) ? team.members.length : 0,
      })),
    });
  } catch (error) {
    console.error("Team Names Error:", error);
    return NextResponse.json({ error: "Failed to fetch team names." }, { status: 500 });
  }
}
