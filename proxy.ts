import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "admin_session";
const TEAM_SESSION_COOKIE = "team_session";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionToken = request.cookies.get(TEAM_SESSION_COOKIE)?.value;
  const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (pathname.startsWith("/admin") && !sessionToken && !adminSessionToken) {
    const redirectResponse = NextResponse.redirect(new URL("/admin-login", request.url));
    redirectResponse.headers.set("X-Frame-Options", "DENY");
    redirectResponse.headers.set("X-Content-Type-Options", "nosniff");
    redirectResponse.headers.set("Referrer-Policy", "same-origin");
    redirectResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return redirectResponse;
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
