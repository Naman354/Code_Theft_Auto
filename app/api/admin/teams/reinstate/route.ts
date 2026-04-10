import { NextResponse } from "next/server";
import { ensureAdminAccess } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";

export async function POST(request: Request) {
  try {
    const authError = await ensureAdminAccess(request);

    if (authError) {
      return authError;
    }

    const { teamId } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId." }, { status: 400 });
    }

    await connectToDatabase();

    const team = await Team.findById(teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    // Reset DQ status, switch count, and clear active sessions
    await Team.updateOne(
      { _id: team._id },
      {
        $set: {
          isDisqualified: false,
          tabSwitchCount: 0,
          activeSessions: [],
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: `Team ${team.teamName} has been reinstated.`,
    });
  } catch (error) {
    console.error("Admin Reinstate Error:", error);
    return NextResponse.json({ error: "Failed to reinstate team." }, { status: 500 });
  }
}
