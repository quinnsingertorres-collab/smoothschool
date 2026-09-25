import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OLD_HOSTS } from "@/lib/domain-move";

// Anything opened on the old domain (sequinn.xyz/schoolmanage/...) shows the
// "this site has moved" notice instead of the app, keeping the old URL in the
// address bar, then sends them to the same page on school.sequinn.xyz.
export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0];
  if (!OLD_HOSTS.includes(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === "/moved") return NextResponse.next();

  // Rewrite (not redirect): the old URL stays in the address bar, and the
  // notice reads it to know which page to open on the new domain.
  const url = request.nextUrl.clone();
  url.pathname = "/moved";
  url.search = "";
  return NextResponse.rewrite(url);
}

export const config = {
  // Static assets still load normally so the notice page itself can render.
  matcher: ["/((?!_next/|favicon.ico|icon.png|apple-icon.png|brand-mark.png|manifest.webmanifest).*)"],
};
