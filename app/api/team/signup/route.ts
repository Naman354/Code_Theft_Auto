import { NextResponse } from "next/server";
import {
  getMaxTeamNameLength,
  getMinPasswordLength,
  getRequiredTeamMemberCount,
} from "@/lib/contest-config";
import { connectToDatabase } from "@/lib/mongodb";
import { isDuplicateKeyError } from "@/lib/mongoose-errors";
import { applyRateLimit } from "@/lib/request-guard";
import { hashPassword, normalizeTeamName } from "@/lib/team-auth";
import { setTeamSessionCookie } from "@/lib/team-session";
import TeamModel from "@/models/Team";
import UserModel from "@/models/User"; // Day 1 Database

// Helper to extract clean student numbers from frontend request
function extractStudentNumbers(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  return input.map(item => {
    // Check if frontend sent array of objects [{studentNumber: "25..."}] or array of strings ["25..."]
    if (typeof item === 'object' && item !== null && 'studentNumber' in item) {
      return String(item.studentNumber).trim();
    }
    return String(item).trim();
  }).filter(Boolean);
}

function validateSignupBasics(teamName: string, password: string, studentNumbers: string[]) {
  // Team Name: Only alphabets, 3-20 characters
  const nameRegex = /^[a-zA-Z0-9 ]{3,20}$/;
  if (!teamName || teamName.trim().length === 0) return "Team name is required.";
  if (!nameRegex.test(teamName)) {
    return "Team name must contain only letters, numbers, and spaces, and be between 3 and 20 characters long.";
  }

  // Password: No special symbols, 3-20 characters (alphabets and numbers allowed)
  const passwordRegex = /^[a-zA-Z0-9]{3,20}$/;
  if (!password || password.length === 0) return "Password is required.";
  if (!passwordRegex.test(password)) {
    return "Password must be alphanumeric (only letters and numbers) and between 3 and 20 characters long.";
  }
  if (studentNumbers.length === 0) return "At least one team member is required.";

  const requiredCount = getRequiredTeamMemberCount();
  if (requiredCount !== null && studentNumbers.length > requiredCount) {
    return `Each team can have at most ${requiredCount} members.`;
  }

  const regex25 = /^25[0-9]{5,6}$/;
  for (const num of studentNumbers) {
    if (!regex25.test(num)) {
      return `Invalid student number format (${num}). It must start with 25 and be 7 or 8 digits.`;
    }
  }

  const uniqueNumbers = new Set(studentNumbers);
  if (uniqueNumbers.size !== studentNumbers.length) {
    return "Student numbers must be unique within a team.";
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const rateLimitError = applyRateLimit(req, {
      bucket: "team-signup",
      limit: 12,
      windowMs: 60_000,
    });

    if (rateLimitError) {
      return rateLimitError;
    }

    await connectToDatabase();

    const body = await req.json().catch(() => ({}));
    const teamName = String(body.teamName ?? "").trim();
    const password = String(body.password ?? "");

    // Extract array of student numbers (e.g. ["2510084", "2510085"])
    // API will accept body.members OR body.studentNumbers from frontend
    const rawMembers = body.studentNumbers || body.members || [];
    const studentNumbers = extractStudentNumbers(rawMembers);

    // 1. Basic formatting checks
    const validationError = validateSignupBasics(teamName, password, studentNumbers);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // =========================================================
    // 🛡️ SECURITY LOGIC: FETCH FROM DAY 1 DB (registrations)
    // =========================================================

    // Find these students in Day 1 DB
    const validStudents = await UserModel.find({
      studentNumber: { $in: studentNumbers }
    });

    // Check if any numbers are fake/unregistered
    if (validStudents.length !== studentNumbers.length) {
      const validNumbers = validStudents.map(s => s.studentNumber);
      const invalidNumbers = studentNumbers.filter(num => !validNumbers.includes(num));

      return NextResponse.json(
        { error: `Access Denied! These Student Numbers are not registered for the event: ${invalidNumbers.join(", ")}` },
        { status: 403 }
      );
    }

    // Check if anyone is already in another team
    const alreadyInATeam = await TeamModel.findOne({
      "members.studentNumber": { $in: studentNumbers }
    });

    if (alreadyInATeam) {
      return NextResponse.json(
        { error: "Action Blocked: One or more students are already part of another team!" },
        { status: 409 }
      );
    }

    // 🎯 CREATE FINAL MEMBERS ARRAY (Student Number + Name from DB)
    const finalizedMembers = validStudents.map(student => ({
      name: student.name,
      studentNumber: student.studentNumber
    }));

    // =========================================================

    const teamNameNormalized = normalizeTeamName(teamName);
    const existingTeam = await TeamModel.exists({ teamNameNormalized });

    if (existingTeam) {
      return NextResponse.json(
        { error: "A team with this name already exists." },
        { status: 409 },
      );
    }

    // 1. Sabse highest teamNumber wali team dhoondo
    const highestTeam = await TeamModel.findOne().sort({ teamNumber: -1 });

    // 2. Agar koi team nahi hai, toh 1 se start karo, warna +1 kar do
    const nextTeamNumber = highestTeam ? highestTeam.teamNumber + 1 : 1;

    // Create the Team
    const team = await TeamModel.create({
      teamName,
      teamNameNormalized,
      teamNumber: nextTeamNumber, // NAYA: Auto-assigned number
      passwordHash: hashPassword(password),
      members: finalizedMembers, // Has Name + StudentNumber
      totalLockedScore: 0,
      currentLevel: 1,
      levelStates: [],
      lastLoginAt: new Date(),
    });

    // Link Team ID to the Students in the Day 1 DB
    await UserModel.updateMany(
      { studentNumber: { $in: studentNumbers } },
      { $set: { teamId: team._id } }
    );

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
    console.log("🛑 ACTUAL MONGO ERROR:", error); // <-- YEH LINE ADD KAREIN

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
