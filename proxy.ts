import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, expectedAuthValue } from "@/lib/auth";

// Gates every page and API route behind a single shared app password.
// This is a light "keep casual visitors out" gate, not real
// authentication — see lib/auth.ts for the tradeoffs.
export function proxy(request: NextRequest) {
  const expected = expectedAuthValue();

  // No password configured (e.g. local dev without APP_PASSWORD set):
  // don't lock the owner out, just let everything through.
  if (!expected) return NextResponse.next();

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === expected) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!login|api/login|_next/static|_next/image|favicon.ico|icon.png|brand-mark.png).*)",
  ],
};
