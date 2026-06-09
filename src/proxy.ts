import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/** Chemins accessibles sans authentification. */
const PUBLIC_PATHS = ["/login", "/api/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return NextResponse.next();
  }

  const secret = process.env.APP_SESSION_SECRET ?? "";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated =
    secret.length > 0 && (await verifySessionToken(token, secret));

  if (authenticated) {
    return NextResponse.next();
  }

  // Les routes API renvoient une erreur JSON plutôt qu'une redirection.
  if (pathname.startsWith("/api/")) {
    return Response.json(
      { error: "Authentification requise" },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Exclut les ressources statiques et fichiers internes Next.js.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
