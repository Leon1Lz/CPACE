"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, GraduationCap, BarChart3,
  Award, Users, Settings, LogOut, ChevronDown, ShieldCheck, UsersRound,
  Newspaper, Route, ClipboardCheck,
  CalendarClock, CalendarDays, PanelsTopLeft, ScrollText,
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type UserRole = "admin" | "instructor" | "learner" | "proctor"

interface AppSidebarProps {
  role?: UserRole
  activePage?: string
  onNavigate?: (page: string) => void
  userName?: string
  userEmail?: string
  isExamTaking?: boolean
}

const menuItems = {
  admin: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "calendar", label: "Calendar", icon: CalendarDays, href: "/dashboard/calendar" },
    { id: "courses", label: "Courses & Assessments", icon: GraduationCap, href: "/dashboard/courses" },
    { id: "schedules", label: "Manage Schedules", icon: CalendarClock, href: "/dashboard/schedules" },
    { id: "learning-paths", label: "Learning Paths", icon: Route, href: "/dashboard/learning-paths" },
    { id: "grading", label: "Grading Queue", icon: ClipboardCheck, href: "/dashboard/grading" },
    { id: "reports", label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
    { id: "certificates", label: "Certificates", icon: Award, href: "/dashboard/certificates" },
    { id: "proctor", label: "Exam Monitor", icon: ShieldCheck, href: "/dashboard/proctor" },
    { id: "groups", label: "Groups", icon: UsersRound, href: "/dashboard/groups" },
    { id: "users", label: "User Management", icon: Users, href: "/dashboard/users" },
    { id: "content", label: "Website Content", icon: PanelsTopLeft, href: "/dashboard/content" },
    { id: "audit", label: "Audit Log", icon: ScrollText, href: "/dashboard/audit" },
    { id: "insights", label: "Manage Insights", icon: Newspaper, href: "/dashboard/insights" },
  ],
  instructor: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "calendar", label: "Calendar", icon: CalendarDays, href: "/dashboard/calendar" },
    { id: "courses", label: "Courses & Assessments", icon: GraduationCap, href: "/dashboard/courses" },
    { id: "learning-paths", label: "Learning Paths", icon: Route, href: "/dashboard/learning-paths" },
    { id: "grading", label: "Grading Queue", icon: ClipboardCheck, href: "/dashboard/grading" },
    { id: "groups", label: "Groups", icon: UsersRound, href: "/dashboard/groups" },
    { id: "reports", label: "Learner Progress", icon: BarChart3, href: "/dashboard/reports" },
    { id: "insights", label: "Manage Insights", icon: Newspaper, href: "/dashboard/insights" },
  ],
  learner: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "calendar", label: "My Calendar", icon: CalendarDays, href: "/dashboard/calendar" },
    { id: "courses", label: "Courses & Assessments", icon: GraduationCap, href: "/dashboard/courses" },
    { id: "learning-paths", label: "My Learning Paths", icon: Route, href: "/dashboard/learning-paths" },
    { id: "reports", label: "My Progress", icon: BarChart3, href: "/dashboard/reports" },
    { id: "certificates", label: "My Certificates", icon: Award, href: "/dashboard/certificates" },
  ],
  proctor: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "calendar", label: "Calendar", icon: CalendarDays, href: "/dashboard/calendar" },
    { id: "proctor", label: "Exam Monitor", icon: ShieldCheck, href: "/dashboard/proctor" },
  ],
}

const roleColors: Record<UserRole, string> = {
  admin: "bg-rose-50 text-rose-700 border border-rose-200/60",
  instructor: "bg-blue-50 text-blue-700 border border-blue-200/60",
  learner: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  proctor: "bg-violet-50 text-violet-700 border border-violet-200/60",
}

export function AppSidebar({ role = "learner", userName = "User", userEmail = "", isExamTaking = false }: AppSidebarProps) {
  const items = menuItems[role]
  const groups = [
    { label: "Overview", ids: ["dashboard", "calendar"] },
    { label: "Learning", ids: ["courses", "learning-paths"] },
    { label: role === "learner" ? "My Results" : "Exams & Results", ids: ["proctor", "grading", "reports", "certificates"] },
    { label: "Administration", ids: ["content", "schedules", "groups", "users", "insights", "audit"] },
  ].map(group => ({ ...group, items: group.ids.flatMap(id => items.filter(item => item.id === id)) })).filter(group => group.items.length)
  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-emerald-950/10 bg-white">
      {/* Header — Logo */}
      <SidebarHeader className="border-b border-slate-100 px-5 pb-5 pt-3">
        <div className="relative h-20 w-full">
          <Image src="/cpace-logo.png" alt="CPACE Philippines — Continuing Education" fill sizes="240px" className="object-contain object-left" preload />
        </div>
        <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /><p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-[0.16em]">Learning Portal</p></div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3 py-4">
        {isExamTaking && <p role="status" className="px-3 text-xs font-semibold text-amber-700">🔒 Locked</p>}
        {groups.map(group => <SidebarGroup key={group.label} className="py-1">
          <SidebarGroupLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1 flex items-center justify-between">
            <span>{group.label}</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)) || (item.id === "courses" && pathname.startsWith("/dashboard/assessments/"))
                return (
                  <SidebarMenuItem key={item.id}>
                    {isExamTaking ? (
                      <div
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 select-none opacity-40 cursor-not-allowed ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-slate-400"
                        }`}
                        title="Navigation is locked during examination"
                      >
                        <item.icon className={`h-4 w-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                        <span className="text-sm">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        )}
                      </div>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`relative rounded-xl px-3 py-2.5 transition-all duration-200 ${
                          isActive
                            ? "bg-[#105C2E] text-white font-semibold shadow-sm border border-[#105C2E] hover:bg-[#0B4523] hover:text-white data-[active=true]:bg-[#105C2E] data-[active=true]:text-white"
                            : "text-slate-600 border border-transparent hover:bg-emerald-50/70 hover:text-emerald-900"
                        }`}
                      >
                        <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                          <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-emerald-100" : "text-slate-400 group-hover:text-emerald-700"}`} />
                          <span className="text-sm">{item.label}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 bg-emerald-300 rounded-full"></span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>)}
      </SidebarContent>

      <SidebarSeparator className="bg-slate-100" />

      {/* Footer — User */}
      <SidebarFooter className="px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton aria-label="Account menu" className="cursor-pointer rounded-xl px-3 py-2.5 hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all duration-200 h-auto">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                    {initials}
                  </div>
                  <div className="flex flex-col flex-1 text-left min-w-0">
                    <span className="font-semibold text-sm text-slate-800 truncate">{userName}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full w-fit mt-0.5 uppercase tracking-wide ${roleColors[role]}`}>
                      {role}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width] rounded-2xl shadow-xl border-slate-100 p-1.5">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-400">{userEmail}</p>
                </div>
                {isExamTaking ? <DropdownMenuItem disabled><Settings className="h-4 w-4 mr-2" />Account Settings (exam locked)</DropdownMenuItem> : <DropdownMenuItem className="cursor-pointer rounded-xl mx-1 mt-1 text-slate-700" asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="h-4 w-4 mr-2 text-slate-400" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>}
                <DropdownMenuSeparator className="mx-1" />
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl mx-1 mb-1 text-rose-600 focus:text-rose-700 focus:bg-rose-50 font-medium"
                  onClick={() => {
                    if (isExamTaking && !window.confirm("Signing out leaves this exam. Unsaved changes may be lost. Sign out?")) return
                    void signOut({ callbackUrl: "/" })
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
