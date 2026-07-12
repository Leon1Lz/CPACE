"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { signOut } from "next-auth/react"
import { AppSidebar } from "@/components/wireframe/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Bell, LogOut } from "lucide-react"
import { NotificationBell } from "@/components/ui/notification-bell"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/courses": "Courses",
  "/dashboard/assessments": "Assessments",
  "/dashboard/reports": "Reports",
  "/dashboard/certificates": "Certificates",
  "/dashboard/users": "User Management",
  "/dashboard/settings": "Settings",
  "/dashboard/proctor": "Exam Monitor",
  "/dashboard/groups": "Groups",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const userRole = session.user.role?.toLowerCase() as "admin" | "instructor" | "learner" | "proctor"
  const userName = session.user.name || "User"
  const userEmail = session.user.email || ""
  const initials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

  const roleColors: Record<string, string> = {
    admin: "bg-rose-100 text-rose-700",
    instructor: "bg-blue-100 text-blue-700",
    learner: "bg-emerald-100 text-emerald-700",
    proctor: "bg-violet-100 text-violet-700",
  }

  const getPageTitle = (path: string) => {
    if (pageTitles[path]) return pageTitles[path]
    if (path.includes("/manage")) return "Manage Questions"
    if (path.includes("/take")) return "Take Assessment"
    if (path.includes("/edit")) return "Edit Course"
    if (path.includes("/create")) return "Create Course"
    if (path.includes("/participants")) return "Participants"
    return "Dashboard"
  }
  const pageTitle = getPageTitle(pathname)

  const getBreadcrumbParent = (path: string) => {
    if (path.startsWith("/dashboard/assessments/")) return { label: "Assessments", href: "/dashboard/assessments" }
    if (path.startsWith("/dashboard/courses/")) return { label: "Courses", href: "/dashboard/courses" }
    if (path.startsWith("/dashboard/groups/")) return { label: "Groups", href: "/dashboard/groups" }
    return null
  }
  const breadcrumbParent = getBreadcrumbParent(pathname)

  return (
    <SidebarProvider>
      <AppSidebar role={userRole} userName={userName} userEmail={userEmail} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-6 sticky top-0 z-20">
          <SidebarTrigger className="-ml-1 text-gray-400 hover:text-gray-700" />
          <Separator orientation="vertical" className="h-5 bg-gray-100" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-gray-400 hover:text-emerald-600 text-sm">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathname !== "/dashboard" && breadcrumbParent && (
                <>
                  <BreadcrumbSeparator className="text-gray-300" />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={breadcrumbParent.href} className="text-gray-400 hover:text-emerald-600 text-sm">
                      {breadcrumbParent.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              {pathname !== "/dashboard" && (
                <>
                  <BreadcrumbSeparator className="text-gray-300" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-gray-700 font-medium text-sm">{pageTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${roleColors[userRole]}`}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
            <NotificationBell />
            <div className="flex items-center gap-2.5 pl-2 border-l border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-semibold text-gray-900 leading-none">{userName}</span>
                <span className="text-xs text-gray-400 mt-0.5">{userEmail}</span>
              </div>
            </div>
            <Button
              variant="ghost" size="icon"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-gray-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-gray-50/50">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
