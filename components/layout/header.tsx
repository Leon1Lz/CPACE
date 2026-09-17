"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"

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

  const registerHref = process.env.NEXT_PUBLIC_REGISTER_URL || "/register"
  const loginHref = process.env.NEXT_PUBLIC_LMS_URL || "/login"
  const registerIsExternal = registerHref.startsWith("http")
  const loginIsExternal = loginHref.startsWith("http")

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
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
