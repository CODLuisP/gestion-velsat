import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const auth = request.cookies.get("auth");

  if (!auth) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/panel/:path*"],
};
