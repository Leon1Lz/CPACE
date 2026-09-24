"use client"

import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"
import { ArrowLeft, Shield, Clock, Award, GraduationCap, TrendingUp, CheckCircle } from "lucide-react"
import Image from "next/image"

const features = [
  { icon: <Shield className="w-5 h-5" />, title: "Secure Learning Environment", desc: "Your data and progress are protected with enterprise-grade security" },
  { icon: <Clock className="w-5 h-5" />, title: "Learn at Your Own Pace", desc: "Flexible scheduling designed to fit your busy professional lifestyle" },
  { icon: <Award className="w-5 h-5" />, title: "Industry-Recognized Certificates", desc: "Earn credentials that employers value and respect worldwide" },
]

const programs = [
  { name: "Certified Marketing Specialist", tag: "NEW", tagColor: "bg-emerald-500/30 text-emerald-300" },
  { name: "Certified Financial Management", tag: "HOT", tagColor: "bg-rose-500/30 text-rose-300" },
  { name: "Certified Operations Management", tag: "TRENDING", tagColor: "bg-amber-500/30 text-amber-300" },
]

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left — Visual Panel ── */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80")`
          }}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/95 via-emerald-900/90 to-slate-900/95"></div>
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        <div className="absolute top-20 right-12 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-12 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="relative w-52 h-14">
            <Image src="/cpace-logo.png" alt="CPACE Philippines" fill className="object-contain object-left brightness-0 invert" priority />
          </div>

          {/* Main content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-full text-xs font-semibold">
                <GraduationCap className="w-3.5 h-3.5" />
                Start Your Journey
              </div>
              <h2 className="text-4xl font-bold text-white leading-tight">
                Start Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                  Professional Journey
                </span>{" "}
                Today
              </h2>
              <p className="text-white/70 leading-relaxed">
                Create your account and gain access to world-class certification programs designed to accelerate your career growth.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-teal-300 shrink-0 group-hover:bg-teal-500/20 transition-colors duration-200">
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{f.title}</p>
                    <p className="text-white/60 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Programs card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-semibold text-sm">Popular Programs</span>
            </div>
            <div className="space-y-2.5">
              {programs.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.tagColor}`}>{p.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right — Register Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center min-h-screen bg-gray-50 p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-2">
            <div className="relative w-52 h-14">
              <Image src="/cpace-logo.png" alt="CPACE Philippines" fill className="object-contain" priority />
            </div>
          </div>

          {/* Back */}
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors duration-200 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500">Join CPACE Learning Portal and start your journey toward professional excellence.</p>
          </div>

          {/* Form */}
          <RegisterForm />

          {/* Footer */}
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Sign in
            </Link>
          </p>

        </div>
      </div>

    </div>
  )
}
