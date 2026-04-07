import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "admin_session";
const TEAM_SESSION_COOKIE = "team_session";

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(TEAM_SESSION_COOKIE)?.value;
  const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionToken && !adminSessionToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Optimistic proxy check only. Strong admin authorization happens in admin layout and API handlers.
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
