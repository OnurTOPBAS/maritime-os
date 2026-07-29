import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next()
  }

  // Check for auth token
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    // Redirect to sign-in if no token
    const url = new URL("/auth/signin", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  try {
    // Verify token
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch (error) {
    // Invalid token, redirect to sign-in
    const url = new URL("/auth/signin", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
