import { NextResponse } from "next/server";
import { getArenaSessionFromRequest } from "@/lib/arena-session";
import { isAdminTeam } from "@/lib/admin-access";
import { getAdminSessionFromRequest, hasValidAdminSecret } from "@/lib/admin-session";

export async function ensureAdminAccess(request: Request) {
  const providedSecret = request.headers.get("x-admin-secret")?.trim();

  if (hasValidAdminSecret(providedSecret)) {
    return null;
  }

  if (getAdminSessionFromRequest(request)) {
    return null;
  }

  const session = getArenaSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Missing admin credentials." }, { status: 401 });
  }

  const adminAllowed = await isAdminTeam(session.teamId);
  if (!adminAllowed) {
    return NextResponse.json({ error: "Admin privileges required." }, { status: 403 });
  }

  return null;
}
