"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Award,
  DollarSign,
  BarChart3,
  Settings,
  Users,
  ShieldCheck,
  ArrowRight,
  Star,
  CheckCircle,
  GraduationCap,
  BookOpen,
  Zap,
} from "lucide-react"
import { cpaceStats } from "@/data/stats"

const certifications = [
  {
    acronym: "CFMS®",
    fullName: "Certified Financial Management Specialist",
    description:
      "Validate your expertise in financial management, budgeting, financial analysis, and strategic financial planning. The CFMS® credential distinguishes professionals who demonstrate advanced competency in managing organizational finances.",
    icon: <DollarSign className="w-8 h-8 text-white" />,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    lightText: "text-emerald-700",
    lightBorder: "border-emerald-200",
    highlights: [
      "Financial Analysis & Reporting",
      "Budgeting & Forecasting",
      "Strategic Financial Planning",
      "Risk & Compliance Management",
    ],
  },
  {
    acronym: "CMMS®",
    fullName: "Certified Marketing Management Specialist",
    description:
      "Demonstrate your proficiency in modern marketing management, digital marketing strategy, brand development, and consumer insights. The CMMS® certification equips professionals to lead impactful marketing initiatives.",
    icon: <BarChart3 className="w-8 h-8 text-white" />,
    gradient: "from-blue-500 to-cyan-600",
    lightBg: "bg-blue-50",
    lightText: "text-blue-700",
    lightBorder: "border-blue-200",
    highlights: [
      "Digital Marketing Strategy",
      "Brand Management & Development",
      "Consumer Behavior & Insights",
      "Marketing Analytics & ROI",
    ],
  },
  {
    acronym: "COMS®",
    fullName: "Certified Operations Management Specialist",
    description:
      "Prove your capability in operations excellence, supply chain management, process optimization, and quality assurance. The COMS® credential is designed for professionals driving operational efficiency.",
    icon: <Settings className="w-8 h-8 text-white" />,
    gradient: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50",
    lightText: "text-violet-700",
    lightBorder: "border-violet-200",
    highlights: [
      "Supply Chain Management",
      "Process Optimization & Lean",
      "Quality Assurance Systems",
      "Project & Resource Management",
    ],
  },
  {
    acronym: "CHRA™",
    fullName: "Certified Human Resource Associate",
    description:
      "Enhance your HR expertise through the CHRA™ Review Lecture and Credential Program. Prepare for the HR profession with comprehensive training in talent management, labor law, and organizational development.",
    icon: <Users className="w-8 h-8 text-white" />,
    gradient: "from-orange-500 to-amber-600",
    lightBg: "bg-orange-50",
    lightText: "text-orange-700",
    lightBorder: "border-orange-200",
    highlights: [
      "Talent Acquisition & Management",
      "Philippine Labor Law & Compliance",
      "Compensation & Benefits Design",
      "Organizational Development",
    ],
  },
  {
    acronym: "DPODPS",
    fullName: "Data Privacy Officer / Data Protection Specialist",
    description:
      "Become a certified Data Privacy Officer or Data Protection Specialist. Master the Philippine Data Privacy Act (RA 10173), NPC guidelines, and global data protection frameworks to safeguard organizational data.",
    icon: <ShieldCheck className="w-8 h-8 text-white" />,
    gradient: "from-rose-500 to-pink-600",
    lightBg: "bg-rose-50",
    lightText: "text-rose-700",
    lightBorder: "border-rose-200",
    highlights: [
      "RA 10173 – Data Privacy Act",
      "NPC Compliance & Registration",
      "Privacy Impact Assessment (PIA)",
      "Breach Management & Response",
    ],
  },
]

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
    label: cpaceStats.programsOffered.label,
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    value: cpaceStats.successRate.value,
    label: cpaceStats.successRate.label,
    icon: <Zap className="w-5 h-5" />,
  },
]

export function ProfessionalCertifications() {
  return (
    <section className="relative overflow-hidden">
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
                Elevate your career with CPACE Philippines&apos; industry-recognized certifications. Each program is
                designed to validate your expertise, boost your professional standing, and open doors to new
                opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/#contact">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    Inquire Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="https://linktr.ee/cpaceph" target="_blank" rel="noopener noreferrer">
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
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Certification Cards ── */}
      <div className="relative py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/60 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-teal-100/60 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Sub-header */}
          <div className="text-center space-y-5 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
              <Star className="w-4 h-4 text-emerald-500" />
              Flagship Credential Programs
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              Choose your path to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                professional excellence
              </span>
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Each certification is recognized by leading employers, corporate institutions, and 20+ top academic
              universities across the Philippines.
            </p>
          </div>

          {/* Certification Cards */}
          <div className="space-y-8">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl shadow-lg border border-gray-100/80 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Left: Icon & Acronym */}
                  <div
                    className={`lg:col-span-3 bg-gradient-to-br ${cert.gradient} p-8 lg:p-10 flex flex-col items-center justify-center text-center text-white space-y-4`}
                  >
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      {cert.icon}
                    </div>
                    <div>
                      <div className="text-3xl lg:text-4xl font-black tracking-tight">{cert.acronym}</div>
                      <div className="text-sm text-white/80 font-medium mt-1">Certification Program</div>
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="lg:col-span-9 p-8 lg:p-10 space-y-6">
                    <div className="space-y-3">
                      <h4 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-200">
                        {cert.fullName}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">{cert.description}</p>
                    </div>

                    {/* Highlights Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cert.highlights.map((highlight, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 ${cert.lightBg} rounded-lg flex items-center justify-center flex-shrink-0`}
                          >
                            <CheckCircle className={`w-3.5 h-3.5 ${cert.lightText}`} />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{highlight}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Link href="/#contact">
                        <Button
                          className={`bg-gradient-to-r ${cert.gradient} hover:opacity-90 text-white font-semibold px-6 py-2.5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                        >
                          Inquire About {cert.acronym}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href="https://linktr.ee/cpaceph" target="_blank" rel="noopener noreferrer">
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
            <h4 className="text-3xl font-bold text-gray-900 mb-4">Not sure which certification is right for you?</h4>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
              Our admissions team can help you choose the best certification program based on your career goals, experience, and aspirations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#contact">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-base">
                  Talk to Admissions
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="https://linktr.ee/cpaceph" target="_blank" rel="noopener noreferrer">
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
