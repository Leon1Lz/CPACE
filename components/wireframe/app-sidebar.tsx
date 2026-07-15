"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, BookOpen, ClipboardCheck, BarChart3,
  Award, Users, Settings, LogOut, Bell, ChevronDown, ShieldCheck, UsersRound,
  Newspaper,
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
}

const menuItems = {
  admin: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "courses", label: "Courses", icon: BookOpen, href: "/dashboard/courses" },
    { id: "assessments", label: "Assessments", icon: ClipboardCheck, href: "/dashboard/assessments" },
    { id: "reports", label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
    { id: "certificates", label: "Certificates", icon: Award, href: "/dashboard/certificates" },
    { id: "proctor", label: "Exam Monitor", icon: ShieldCheck, href: "/dashboard/proctor" },
    { id: "groups", label: "Groups", icon: UsersRound, href: "/dashboard/groups" },
    { id: "users", label: "User Management", icon: Users, href: "/dashboard/users" },
    { id: "insights", label: "Manage Insights", icon: Newspaper, href: "/dashboard/insights" },
    { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ],
  instructor: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "courses", label: "My Courses", icon: BookOpen, href: "/dashboard/courses" },
    { id: "assessments", label: "Assessments", icon: ClipboardCheck, href: "/dashboard/assessments" },
    { id: "groups", label: "Groups", icon: UsersRound, href: "/dashboard/groups" },
    { id: "reports", label: "Learner Progress", icon: BarChart3, href: "/dashboard/reports" },
    { id: "insights", label: "Manage Insights", icon: Newspaper, href: "/dashboard/insights" },
    { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ],
  learner: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "courses", label: "My Courses", icon: BookOpen, href: "/dashboard/courses" },
    { id: "assessments", label: "Assessments", icon: ClipboardCheck, href: "/dashboard/assessments" },
    { id: "certificates", label: "My Certificates", icon: Award, href: "/dashboard/certificates" },
    { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ],
  proctor: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "proctor", label: "Exam Monitor", icon: ShieldCheck, href: "/dashboard/proctor" },
    { id: "reports", label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
    { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ],
}

const roleColors: Record<UserRole, string> = {
  admin: "bg-rose-100 text-rose-700",
  instructor: "bg-blue-100 text-blue-700",
  learner: "bg-emerald-100 text-emerald-700",
  proctor: "bg-violet-100 text-violet-700",
}

export function AppSidebar({ role = "learner", activePage, onNavigate, userName = "User", userEmail = "" }: AppSidebarProps) {
  const items = menuItems[role]
  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-gray-100">
      {/* Header — Logo */}
      <SidebarHeader className="border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative w-28 h-8">
            <Image src="/logo.svg" alt="CPACE" fill className="object-contain object-left" priority />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 pl-0.5">Learning Portal</p>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`rounded-xl px-3 py-2.5 transition-all duration-200 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Link href={item.href}>
                        <item.icon className={`h-4 w-4 ${isActive ? "text-emerald-600" : "text-gray-400"}`} />
                        <span className="text-sm">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="bg-gray-100" />

      {/* Footer — User */}
      <SidebarFooter className="px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="cursor-pointer rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-all duration-200 h-auto">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {initials}
                  </div>
                  <div className="flex flex-col flex-1 text-left min-w-0">
                    <span className="font-semibold text-sm text-gray-900 truncate">{userName}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit mt-0.5 capitalize ${roleColors[role]}`}>
                      {role}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width] rounded-xl shadow-xl border-gray-100">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-400">{userEmail}</p>
                </div>
                <DropdownMenuItem className="cursor-pointer rounded-lg mx-1 mt-1">
                  <Bell className="h-4 w-4 mr-2 text-gray-400" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg mx-1">
                  <Settings className="h-4 w-4 mr-2 text-gray-400" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="mx-1" />
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg mx-1 mb-1 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                  onClick={() => signOut({ callbackUrl: "/" })}
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
