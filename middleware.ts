import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    if (token?.error === "SessionExpired") {
      return NextResponse.redirect(new URL("/login?error=session_expired", req.url))
    }
    if (token?.error === "UserSuspended") {
      return NextResponse.redirect(new URL("/login?error=suspended", req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token && token?.error !== "SessionExpired" && token?.error !== "UserSuspended",
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*"],
}
