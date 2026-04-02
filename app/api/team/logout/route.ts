import { NextResponse } from "next/server";
import { clearTeamSessionCookie } from "@/lib/team-session";

export async function POST() {
  await clearTeamSessionCookie();

  return NextResponse.json({
    success: true,
  });
}
