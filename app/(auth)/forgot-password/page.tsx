"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, KeyRound, GraduationCap, Star, BookOpen, Users, Award } from "lucide-react"
import Image from "next/image"

const stats = [
  { value: "10K+", label: "Professionals" },
  { value: "50+", label: "Programs" },
  { value: "98%", label: "Satisfaction" },
]

const features = [
  { icon: <BookOpen className="w-5 h-5" />, title: "50+ Certification Programs", desc: "Professional courses in Marketing, Finance, and Operations" },
  { icon: <Users className="w-5 h-5" />, title: "Expert Instructors", desc: "Learn from industry leaders with real-world experience" },
  { icon: <Award className="w-5 h-5" />, title: "Globally Recognized", desc: "Certifications respected by top employers worldwide" },
]

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const debugUrl = ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
      } else {
        setError(data.error || "An error occurred. Please try again.")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80")`
          }}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 via-teal-900/90 to-slate-900/95"></div>
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        <div className="absolute top-16 left-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-16 right-16 w-56 h-56 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="relative w-36 h-10">
              <Image src="/logo.svg" alt="CPACE" fill className="object-contain" priority />
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-semibold">
                <KeyRound className="w-3.5 h-3.5" />
                Security & Account Recovery
              </div>
              <h2 className="text-4xl font-bold text-white leading-tight">
                Recover Your Account with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  CPACE Portal
                </span>
              </h2>
              <p className="text-white/70 leading-relaxed">
                Confirm your identity to securely reset your password and resume your professional training courses.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-emerald-300 shrink-0 group-hover:bg-emerald-500/20 transition-colors duration-200">
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{f.title}</p>
                    <p className="text-white/60 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Industry Recognized</p>
                <p className="text-white/60 text-xs">Certifications trusted by top Philippine employers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center min-h-screen bg-gray-50 p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex flex-col items-center gap-2">
            <div className="relative w-36 h-10">
              <Image src="/logo.svg" alt="CPACE" fill className="object-contain" priority />
            </div>
          </div>

          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors duration-200 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back to Login
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
            <p className="text-gray-500">Enter your registered email address and we will generate a link to reset your password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-white"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 rounded-xl">
                <AlertDescription>
                  <p className="font-semibold">{message}</p>
                  {debugUrl && (
                    <div className="mt-3 p-3 bg-white border border-emerald-200 rounded-lg text-xs break-all">
                      <p className="font-bold text-emerald-700 mb-1">🔧 Local Dev Reset Link:</p>
                      <a href={debugUrl} className="text-blue-600 hover:underline font-mono font-medium">{debugUrl}</a>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Requesting reset...</>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Remembered your password?{" "}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
