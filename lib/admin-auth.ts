import { NextResponse } from "next/server";

function getAdminApiSecret() {
  const adminApiSecret = process.env.ADMIN_API_SECRET;

  if (!adminApiSecret) {
    throw new Error("ADMIN_API_SECRET is not set in environment variables.");
  }

  return adminApiSecret;
}

export function ensureAdminAccess(request: Request) {
  const providedSecret = request.headers.get("x-admin-secret")?.trim();

  if (!providedSecret) {
    return NextResponse.json({ error: "Missing admin credentials." }, { status: 401 });
  }

  if (providedSecret !== getAdminApiSecret()) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 403 });
  }

  return null;
}
