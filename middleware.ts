import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isEmployeeRoute = nextUrl.pathname.startsWith("/employee");
  const isAuthRoute = nextUrl.pathname === "/login";
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isApiRoute = nextUrl.pathname.startsWith("/api");

  // Allow NextAuth API routes always
  if (isApiAuthRoute) return NextResponse.next();

  // Protect API routes
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect authenticated users away from login
  if (isAuthRoute && isLoggedIn) {
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    return NextResponse.redirect(new URL("/employee/dashboard", nextUrl));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && (isAdminRoute || isEmployeeRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Guard admin routes from employees
  if (isAdminRoute && isLoggedIn && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/employee/dashboard", nextUrl));
  }

  // Guard employee routes from admins
  if (isEmployeeRoute && isLoggedIn && role !== "EMPLOYEE") {
    return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
  }

  // Redirect root to appropriate dashboard
  if (nextUrl.pathname === "/" && isLoggedIn) {
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    return NextResponse.redirect(new URL("/employee/dashboard", nextUrl));
  }

  if (nextUrl.pathname === "/" && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
