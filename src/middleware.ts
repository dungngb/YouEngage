import NextAuth from "next-auth";
import authConfig from "./lib/auth.config";

const { auth } = NextAuth(authConfig);

// Routes that don't require authentication
const publicPaths = ["/login", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  if (isPublic) return;

  // Redirect unauthenticated users to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }

  // Admin-only routes
  if (pathname.startsWith("/admin")) {
    const role = req.auth.user?.role;
    if (role !== "admin") {
      const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
      return Response.redirect(dashboardUrl);
    }
  }
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
