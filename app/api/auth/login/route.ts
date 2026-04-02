import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const accessCodeRaw = String(body.accessCode ?? "").trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let team = null;

    if (accessCodeRaw) {
      const accessCode = accessCodeRaw.toUpperCase();
      team = await Team.findOne({ accessCode });

      if (!team) {
        return NextResponse.json({ error: "Invalid team access code." }, { status: 404 });
      }

      if (user.teamId && user.teamId.toString() !== team._id.toString()) {
        return NextResponse.json(
          { error: "User is already assigned to another team." },
          { status: 409 },
        );
      }

      if (!user.teamId) {
        user.teamId = team._id;
        await user.save();
      }
    } else if (user.teamId) {
      team = await Team.findById(user.teamId);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        teamId: user.teamId,
      },
      team: team
        ? {
            id: team._id,
            teamName: team.teamName,
            accessCode: team.accessCode,
            currentLevel: team.currentLevel,
            totalPoints: team.totalPoints,
            isFinalist: team.isFinalist,
          }
        : null,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
