"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { AppSidebar } from "@/components/wireframe/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Loader2, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { NotificationBell } from "@/components/ui/notification-bell"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/courses": "Courses & Assessments",
  "/dashboard/reports": "Reports",
  "/dashboard/grading": "Grading Queue",
  "/dashboard/certificates": "Certificates",
  "/dashboard/users": "User Management",
  "/dashboard/insights": "Manage Insights",
  "/dashboard/settings": "Account Settings",
  "/dashboard/proctor": "Exam Monitor",
  "/dashboard/groups": "Groups",
  "/dashboard/learning-paths": "Learning Paths",
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">Loading Portal...</p>
      </div>
    )
  }

  if (!session) return null

  const userRole = session.user.role?.toLowerCase() as "admin" | "instructor" | "learner" | "proctor"
  const userName = session.user.name || "User"
  const userEmail = session.user.email || ""

  const roleColors: Record<string, string> = {
    admin: "bg-rose-50 text-rose-700 border border-rose-200/60",
    instructor: "bg-blue-50 text-blue-700 border border-blue-200/60",
    learner: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    proctor: "bg-violet-50 text-violet-700 border border-violet-200/60",
  }

  const getPageTitle = (path: string) => {
    if (pageTitles[path]) return pageTitles[path]
    if (path.startsWith("/dashboard/proctor/")) return "Motion Monitor"
    if (path.includes("/manage")) return "Manage Questions"
    if (path.includes("/take")) return "Take Assessment"
    if (path.includes("/edit")) return "Edit Course"
    if (path.includes("/create")) return "Create Course"
    if (path.includes("/participants")) return "Participants"
    return "Dashboard"
  }
  const pageTitle = getPageTitle(pathname)

  const getBreadcrumbParent = (path: string) => {
    if (path.startsWith("/dashboard/proctor/")) return { label: "Exam Monitor", href: "/dashboard/proctor" }
    if (path.startsWith("/dashboard/assessments/")) return { label: "Courses & Assessments", href: "/dashboard/courses" }
    if (path.startsWith("/dashboard/courses/")) return { label: "Courses & Assessments", href: "/dashboard/courses" }
    if (path.startsWith("/dashboard/groups/")) return { label: "Groups", href: "/dashboard/groups" }
    return null
  }
  const breadcrumbParent = getBreadcrumbParent(pathname)

  const isExamTaking = pathname.includes("/take")

  return (
    <SidebarProvider className="portal-shell" style={{ "--sidebar-width": "17.5rem" } as React.CSSProperties}>
      <AppSidebar role={userRole} userName={userName} userEmail={userEmail} isExamTaking={isExamTaking} />
      <SidebarInset>
        <header className="flex h-[76px] shrink-0 items-center gap-2 sm:gap-4 border-b border-slate-200/70 bg-white/95 backdrop-blur-md px-4 lg:px-8 sticky top-0 z-20">
          <SidebarTrigger className="-ml-1 text-slate-400 hover:text-slate-700" />
          <Separator orientation="vertical" className="h-5 bg-slate-200" />
          <Breadcrumb className="min-w-0 [&_ol]:flex-nowrap [&_li]:truncate">
            <BreadcrumbList>
              <BreadcrumbItem>
                {isExamTaking ? (
                  <span className="text-slate-400 text-sm cursor-not-allowed select-none opacity-60">
                    Dashboard
                  </span>
                ) : (
                  <BreadcrumbLink href="/dashboard" className="text-slate-500 hover:text-emerald-700 text-sm font-medium transition-colors">
                    Dashboard
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {pathname !== "/dashboard" && breadcrumbParent && (
                <>
                  <BreadcrumbSeparator className="text-slate-300" />
                  <BreadcrumbItem>
                    {isExamTaking ? (
                      <span className="text-slate-400 text-sm cursor-not-allowed select-none opacity-60">
                        {breadcrumbParent.label}
                      </span>
                    ) : (
                      <BreadcrumbLink href={breadcrumbParent.href} className="text-slate-500 hover:text-emerald-700 text-sm font-medium transition-colors">
                        {breadcrumbParent.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </>
              )}
              {pathname !== "/dashboard" && (
                <>
                  <BreadcrumbSeparator className="text-slate-300" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-slate-900 font-semibold text-sm">{pageTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {!isExamTaking && <Link href="/" className="hidden xl:inline-flex items-center gap-1.5 mr-2 text-xs font-medium text-slate-500 hover:text-emerald-800">CPACE website<ArrowUpRight className="h-3.5 w-3.5" /></Link>}
            <span className={`hidden md:inline-flex text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full ${roleColors[userRole]}`}>
              {userRole.toUpperCase()}
            </span>
            <NotificationBell />
          </div>
        </header>
        <main className="portal-main flex-1 min-w-0 overflow-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
