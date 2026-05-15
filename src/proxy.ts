import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/dist/server/web/spec-extension/response";

export default withAuth(
  function middleware(req) {
    // You can add custom logic here if needed
    // e.g. checking user roles based on req.nextauth.token
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Return true if the user has a token, false otherwise
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.png (favicon files)
     * - login (auth page)
     * - api/auth (NextAuth endpoints)
     * - public folder contents like logo.png, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
