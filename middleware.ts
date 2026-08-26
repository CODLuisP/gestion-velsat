import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const auth = request.cookies.get("auth");

  if (!auth) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/panel/auditoria")) {
    const usuario = request.cookies.get("usuario")?.value;
    if (usuario !== "admin") {
      return NextResponse.redirect(new URL("/panel/dashboard", request.url));
    }
  }
}

export const config = {
  matcher: ["/panel/:path*"],
};
