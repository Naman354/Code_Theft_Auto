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

    const { teamId, isBlocked } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId." }, { status: 400 });
    }

    await connectToDatabase();

    const team = await Team.findById(teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    // Manual block sets isDisqualified to the desired status.
    // If blocking, we also wipe their active sessions to kick them out.
    await Team.updateOne(
      { _id: team._id },
      {
        $set: {
          isDisqualified: isBlocked,
          activeSessions: isBlocked ? [] : team.activeSessions,
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: `Team ${team.teamName} has been ${isBlocked ? "blocked" : "unblocked"}.`,
    });
  } catch (error) {
    console.error("Admin Toggle Block Error:", error);
    return NextResponse.json({ error: "Failed to toggle team status." }, { status: 500 });
  }
}
