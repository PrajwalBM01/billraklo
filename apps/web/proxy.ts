import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "@/lib/auth";

const protectedPrefixes = ["/dashboard", "/account"];
// Signed-in users skip these and go straight to the dashboard.
const guestOnlyPaths = ["/", "/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Protected pages: a cookie check is enough to redirect early. Each page still
  // validates the real session on the server.
  if (protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!getSessionCookie(request)) {
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Guest pages: validate the session for real, so a stale cookie can't bounce
  // the user between /sign-in and /dashboard.
  if (guestOnlyPaths.includes(pathname) && getSessionCookie(request)) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/account/:path*", "/sign-in", "/sign-up"],
};
