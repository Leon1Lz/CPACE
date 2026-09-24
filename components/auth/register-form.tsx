"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Account created successfully! Redirecting to login...")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    setError("")
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch {
      setError("Failed to initiate Google sign-up. Please try again.")
      setIsGoogleLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const inputClass = "h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-white"
  const labelClass = "text-sm font-medium text-gray-700"

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignUp}
        disabled={isLoading || isGoogleLoading}
        className="w-full h-11 border-gray-200 hover:bg-gray-100/80 bg-white text-gray-700 font-medium rounded-xl flex items-center justify-center gap-3 transition-colors duration-150 shadow-sm"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Sign up with Google</span>
      </Button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-gray-200 w-full" />
        <span className="bg-gray-50 px-3 text-xs text-gray-500 uppercase tracking-wider shrink-0 font-medium">
          or register with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className={labelClass}>First Name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Juan"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className={labelClass}>Last Name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Dela Cruz"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className={labelClass}>Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@email.com"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className={labelClass}>Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
            minLength={8}
            className={`${inputClass} pr-10`}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className={labelClass}>Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Repeat your password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            required
            className={`${inputClass} pr-10`}
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        disabled={isLoading}
      >
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  </div>
  )
}

