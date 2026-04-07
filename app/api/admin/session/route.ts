import { NextResponse } from "next/server";
import { clearAdminSessionCookie, hasValidAdminSecret, setAdminSessionCookie } from "@/lib/admin-session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const providedSecret =
      request.headers.get("x-admin-secret")?.trim() ||
      (typeof body.secret === "string" ? body.secret.trim() : "");

    if (!hasValidAdminSecret(providedSecret)) {
      return NextResponse.json({ error: "Invalid admin secret." }, { status: 401 });
    }

    await setAdminSessionCookie();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Admin Session Error:", error);
    return NextResponse.json({ error: "Failed to establish admin session." }, { status: 500 });
  }
}

export async function DELETE() {
  await clearAdminSessionCookie();

  return NextResponse.json({
    success: true,
  });
}

