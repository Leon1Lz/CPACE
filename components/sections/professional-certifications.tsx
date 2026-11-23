"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Award,
  Users,
  ArrowRight,
  Star,
  CheckCircle,
  GraduationCap,
  BookOpen,
  Zap,
  Layers,
} from "lucide-react"
import { cpaceStats } from "@/data/stats"
import {
  CERTIFICATION_CATEGORIES,
  certificationCourses,
} from "@/data/certification-courses"

const stats = [
  {
    value: cpaceStats.certifiedProfessionals.value,
    label: cpaceStats.certifiedProfessionals.label,
    icon: <Award className="w-5 h-5" />,
  },
  {
    value: cpaceStats.chraPassers.value,
    label: cpaceStats.chraPassers.label,
    icon: <Users className="w-5 h-5" />,
  },
  {
    value: cpaceStats.programsOffered.value,
    label: "Customized Training Programs",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    value: cpaceStats.successRate.value,
    label: "Overall Passing Rate",
    icon: <Zap className="w-5 h-5" />,
  },
]

export function ProfessionalCertifications() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Programs")

  const filteredCourses =
    selectedCategory === "All Programs"
      ? certificationCourses
      : certificationCourses.filter(course => course.category === selectedCategory)

  return (
    <section id="certifications" className="relative overflow-hidden">
      {/* ── Hero Banner ── */}
      <div className="relative py-20 lg:py-28 bg-gradient-to-br from-gray-900 via-slate-900 to-emerald-950 overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{
              backgroundImage: `url("https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")`,
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-slate-900/85 to-emerald-950/90"></div>
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>
        <div className="absolute top-10 left-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-sm font-semibold backdrop-blur-sm">
                <GraduationCap className="w-4 h-4" />
                Industry-Recognized Credentials
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Professional{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Certification
                </span>{" "}
                Programs
              </h2>
              <p className="text-lg text-white/70 leading-relaxed">
                Elevate your career with CPACE Philippines&apos;
                industry-recognized certifications. Each program is designed to
                validate your expertise, boost your professional standing, and
                open doors to new opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/services/professional-certification">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    Explore Programs
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link
                  href="https://bit.ly/cpaceprograms"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    className="border-2 border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 font-semibold px-8 py-3 backdrop-blur-sm transition-all duration-300"
                  >
                    Register Online
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right — Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-xl flex items-center justify-center mb-4 text-emerald-300 group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Certification Cards ── */}
      <div className="relative pt-16 pb-10 lg:pt-20 lg:pb-12 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/60 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-teal-100/60 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Sub-header */}
          <div className="text-center space-y-5 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
              <Star className="w-4 h-4 text-emerald-500" />
              Flagship Credential Programs
            </div>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              <span className="text-emerald-900">Choose your path to </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
                professional excellence
              </span>
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Each certification is recognized by leading employers, corporate
              institutions, and 20+ top academic universities across the
              Philippines.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5" role="tablist" aria-label="Filter certification programs by category">
            {CERTIFICATION_CATEGORIES.map(category => {
              const active = selectedCategory === category
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(category)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {category}
                </button>
              )
            })}
          </div>

          {/* Certification Cards */}
          <div className="space-y-8">
            {filteredCourses.map(cert => (
              <div
                key={cert.slug}
                className="group relative bg-white rounded-3xl shadow-lg border border-gray-100/80 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Left: Badge Logo */}
                  <div
                    className={`lg:col-span-3 bg-gradient-to-br ${cert.gradient} p-8 lg:p-10 flex flex-col items-center justify-center text-center text-white space-y-4`}
                  >
                    <Link
                      href={`/services/professional-certification/${cert.slug}`}
                      className="relative w-40 h-40 lg:w-48 lg:h-48 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg block"
                    >
                      <Image
                        src={cert.badgeImage}
                        alt={`${cert.acronym} Badge`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1024px) 160px, 192px"
                      />
                    </Link>
                  </div>

                  {/* Right: Details */}
                  <div className="lg:col-span-9 p-8 lg:p-10 space-y-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`inline-flex items-center rounded-full border ${cert.lightBorder} ${cert.lightBg} px-3 py-0.5 text-xs font-bold ${cert.lightText}`}>
                            {cert.category}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Categories A, B, C &amp; D Eligible
                          </span>
                        </div>
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          {cert.formats}
                        </span>
                      </div>
                      <Link href={`/services/professional-certification/${cert.slug}`}>
                        <h4 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-200">
                          {cert.fullName} ({cert.acronym})
                        </h4>
                      </Link>
                      <p className="text-gray-600 leading-relaxed">
                        {cert.shortDescription}
                      </p>
                    </div>

                    {/* Highlights Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cert.highlights.map((highlight, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 ${cert.lightBg} rounded-lg flex items-center justify-center flex-shrink-0`}
                          >
                            <CheckCircle
                              className={`w-3.5 h-3.5 ${cert.lightText}`}
                            />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">
                            {highlight}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Link href={`/services/professional-certification/${cert.slug}`}>
                        <Button
                          className={`bg-gradient-to-r ${cert.gradient} hover:opacity-90 text-white font-semibold px-6 py-2.5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                        >
                          Inquire About {cert.acronym}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>

                      <Link
                        href={cert.registerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          className={`${cert.lightBorder} ${cert.lightText} hover:${cert.lightBg} font-semibold px-6 py-2.5 transition-all duration-200`}
                        >
                          Register Online
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Bottom accent */}
                <div
                  className={`h-1 bg-gradient-to-r ${cert.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}
                ></div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-10 lg:p-14 border border-emerald-100">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-3xl font-bold text-gray-900 mb-4">
              Not sure which certification is right for you?
            </h4>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
              Our team can help you choose the best certification program based on your career goals, experience, and qualifications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#contact">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-base">
                  Talk to Our Team
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link
                href="https://bit.ly/cpaceprograms"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold px-8 py-4 text-base"
                >
                  View Registration Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
