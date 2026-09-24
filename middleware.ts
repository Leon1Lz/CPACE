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

    const role = String(token?.role ?? "")
    const pathname = req.nextUrl.pathname
    const roleRules: Array<{ prefix: string; roles: string[] }> = [
      { prefix: "/dashboard/content", roles: ["ADMIN"] },
      { prefix: "/dashboard/schedules", roles: ["ADMIN"] },
      { prefix: "/dashboard/users", roles: ["ADMIN"] },
      { prefix: "/dashboard/audit", roles: ["ADMIN"] },
      { prefix: "/dashboard/faqs", roles: ["ADMIN"] },
      { prefix: "/dashboard/grading", roles: ["ADMIN", "INSTRUCTOR"] },
      { prefix: "/dashboard/groups", roles: ["ADMIN", "INSTRUCTOR"] },
      { prefix: "/dashboard/insights", roles: ["ADMIN", "INSTRUCTOR"] },
      { prefix: "/dashboard/reports", roles: ["ADMIN", "INSTRUCTOR", "LEARNER"] },
      { prefix: "/dashboard/certificates", roles: ["ADMIN", "LEARNER"] },
      { prefix: "/dashboard/proctor", roles: ["ADMIN", "PROCTOR"] },
      { prefix: "/dashboard/assessments", roles: ["ADMIN", "INSTRUCTOR", "LEARNER"] },
      { prefix: "/dashboard/learning-paths", roles: ["ADMIN", "INSTRUCTOR", "LEARNER"] },
    ]
    const matchedRule = roleRules.find(rule => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`))
    const staffOnlyResource = /\/dashboard\/assessments\/[^/]+\/manage$/.test(pathname)
      || pathname === "/dashboard/courses/create"
      || /\/dashboard\/courses\/[^/]+\/(edit|participants)$/.test(pathname)
    if ((matchedRule && !matchedRule.roles.includes(role)) || (staffOnlyResource && !["ADMIN", "INSTRUCTOR"].includes(role))) {
      return NextResponse.redirect(new URL("/dashboard?error=forbidden", req.url))
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
