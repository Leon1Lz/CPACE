"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { ChevronDown, LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/#contact" },
]

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const registerHref = process.env.NEXT_PUBLIC_REGISTER_URL || "/register"
  const loginHref = process.env.NEXT_PUBLIC_LMS_URL || "/login"
  const registerIsExternal = registerHref.startsWith("http")
  const loginIsExternal = loginHref.startsWith("http")
  const userName = session?.user.name?.trim() || "CPACE User"
  const userEmail = session?.user.email || ""
  const userRole = session?.user.role || "Member"
  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled
        ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100"
        : "bg-white border-b border-gray-100"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-64 sm:w-80 h-14 sm:h-16">
              <Image
                src="/cpace-logo.png"
                alt="CPACE Philippines - Center for Professional Advancement and Continuing Education"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors duration-200 ${
                    isActive
                      ? "text-emerald-600 font-semibold"
                      : "text-gray-600 hover:text-emerald-600 font-medium"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {status === "loading" ? (
              <div
                aria-label="Checking account"
                className="h-10 w-44 animate-pulse rounded-xl bg-gray-100"
              />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Open profile menu for ${userName}`}
                    className="flex h-11 max-w-64 items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-2.5 pr-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-xs font-bold text-white shadow-sm">
                      {initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-800">{userName}</span>
                      <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        {userRole}
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-2xl border-gray-100 p-1.5 shadow-xl">
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>
                    <p className="truncate text-xs text-gray-500">{userEmail}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5">
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                      Go to Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5">
                    <Link href="/dashboard/settings">
                      <Settings className="h-4 w-4 text-gray-400" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl px-3 py-2.5 font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                    onClick={() => void signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href={registerHref} target={registerIsExternal ? "_blank" : undefined} rel={registerIsExternal ? "noopener noreferrer" : undefined}>
                  <Button variant="outline" className="border-gray-200 text-gray-700 hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50/40 font-medium rounded-lg px-4 h-9 text-sm transition-all duration-200">
                    Register
                  </Button>
                </Link>
                <Link href={loginHref} target={loginIsExternal ? "_blank" : undefined} rel={loginIsExternal ? "noopener noreferrer" : undefined}>
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-lg px-5 h-9 text-sm shadow-sm hover:shadow transition-all duration-200">
                    Learning Portal
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? "text-emerald-600 bg-emerald-50/60 font-semibold"
                      : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}

            <div className="pt-3 border-t border-gray-100 space-y-2">
              {status === "loading" ? (
                <div aria-label="Checking account" className="h-20 animate-pulse rounded-xl bg-gray-100" />
              ) : session ? (
                <>
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-sm font-bold text-white shadow-sm">
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>
                      <p className="truncate text-xs text-gray-500">{userEmail}</p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">{userRole}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-start gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 font-medium text-white shadow-sm">
                      <LayoutDashboard className="h-4 w-4" />
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-2 rounded-lg border-gray-200 font-medium text-gray-700">
                      <Settings className="h-4 w-4" />
                      Account Settings
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 rounded-lg font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      void signOut({ callbackUrl: "/" })
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href={registerHref} target={registerIsExternal ? "_blank" : undefined} rel={registerIsExternal ? "noopener noreferrer" : undefined} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:text-emerald-600 hover:border-emerald-600 font-medium rounded-lg">
                      Register
                    </Button>
                  </Link>
                  <Link href={loginHref} target={loginIsExternal ? "_blank" : undefined} rel={loginIsExternal ? "noopener noreferrer" : undefined} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg shadow-sm">
                      Learning Portal
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
