import { NextResponse } from "next/server";
import {
  getMaxTeamNameLength,
  getMinPasswordLength,
  getRequiredTeamMemberCount,
} from "@/lib/contest-config";
import { connectToDatabase } from "@/lib/mongodb";
import { isDuplicateKeyError } from "@/lib/mongoose-errors";
import { hashPassword, isValidStudentNumber, normalizeTeamName } from "@/lib/team-auth";
import { setTeamSessionCookie } from "@/lib/team-session";
import Team from "@/models/Team";

type SignupMember = {
  name?: string;
  studentNumber?: string;
};

function sanitizeMembers(members: unknown) {
  if (!Array.isArray(members)) {
    return [];
  }

  return members.map((member) => {
    const typedMember = (member ?? {}) as SignupMember;

    return {
      name: String(typedMember.name ?? "").trim(),
      studentNumber: String(typedMember.studentNumber ?? "").trim(),
    };
  });
}

function validateSignupInput(teamName: string, password: string, members: SignupMember[]) {
  if (!teamName) {
    return "Team name is required.";
  }

  if (teamName.length > getMaxTeamNameLength()) {
    return `Team name must be at most ${getMaxTeamNameLength()} characters long.`;
  }

  if (!password) {
    return "Password is required.";
  }

  if (password.length < getMinPasswordLength()) {
    return `Password must be at least ${getMinPasswordLength()} characters long.`;
  }

  if (members.length === 0) {
    return "At least one team member is required.";
  }

  const requiredTeamMemberCount = getRequiredTeamMemberCount();

  if (requiredTeamMemberCount !== null && members.length > requiredTeamMemberCount) {
    return `Each team can have at most ${requiredTeamMemberCount} members.`;
  }

  for (const member of members) {
    if (!member.name?.trim()) {
      return "Each team member must have a name.";
    }

    if (!member.studentNumber?.trim()) {
      return "Each team member must have a student number.";
    }

    if (!isValidStudentNumber(member.studentNumber)) {
      return "Student numbers must be 7 or 8 digits.";
    }
  }

  const uniqueStudentNumbers = new Set(
    members.map((member) => String(member.studentNumber).trim()),
  );

  if (uniqueStudentNumbers.size !== members.length) {
    return "Student numbers must be unique within a team.";
  }

  return null;
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const body = await req.json().catch(() => ({}));
    const teamName = String(body.teamName ?? "").trim();
    const password = String(body.password ?? "");
    const members = sanitizeMembers(body.members);

    const validationError = validateSignupInput(teamName, password, members);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const teamNameNormalized = normalizeTeamName(teamName);

    const existingTeam = await Team.exists({ teamNameNormalized });

    if (existingTeam) {
      return NextResponse.json(
        { error: "A team with this name already exists." },
        { status: 409 },
      );
    }

    const team = await Team.create({
      teamName,
      teamNameNormalized,
      passwordHash: hashPassword(password),
      members,
      totalLockedScore: 0,
      currentLevel: 1,
      levelStates: [],
      lastLoginAt: new Date(),
    });

    await setTeamSessionCookie(team._id.toString());

    return NextResponse.json(
      {
        success: true,
        team: {
          id: team._id,
          teamName: team.teamName,
          members: team.members,
          totalLockedScore: team.totalLockedScore,
          currentLevel: team.currentLevel,
          levelStates: team.levelStates,
          lastLoginAt: team.lastLoginAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: "A team with this name already exists." },
        { status: 409 },
      );
    }

    console.error("Team Signup Error:", error);
    return NextResponse.json({ error: "Failed to sign up team." }, { status: 500 });
  }
}
