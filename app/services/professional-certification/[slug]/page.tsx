"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  GraduationCap,
  HelpCircle,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import {
  certificationCourses,
  getCertificationCourseBySlug,
  type CertificationCourse,
} from "@/data/certification-courses"

const categoryIcons = {
  "Category A": <GraduationCap className="w-6 h-6" />,
  "Category B": <BookOpen className="w-6 h-6" />,
  "Category C": <Users className="w-6 h-6" />,
  "Category D": <Briefcase className="w-6 h-6" />,
}

function formatTrademarkText(text: string) {
  if (!text.includes("™")) return text
  const parts = text.split("™")
  return parts.map((part, idx) => (
    <span key={idx}>
      {part}
      {idx < parts.length - 1 && (
        <span className="text-[0.75em] relative -top-[0.18em]">™</span>
      )}
    </span>
  ))
}

export default function CertificationCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [allCourses, setAllCourses] = useState<CertificationCourse[]>(
    certificationCourses
  )
  const [course, setCourse] = useState<CertificationCourse | undefined>(() =>
    getCertificationCourseBySlug(slug)
  )

  useEffect(() => {
    let mounted = true
    const normalized = slug.toLowerCase().trim()

    fetch("/api/certification-programs")
      .then(res => (res.ok ? res.json() : null))
      .then((list: CertificationCourse[] | null) => {
        if (!mounted || !Array.isArray(list) || list.length === 0) return
        setAllCourses(list)
        const matched = list.find(
          item =>
            item.slug.toLowerCase() === normalized ||
            item.aliases?.includes(normalized)
        )
        if (matched) {
          setCourse(matched)
        }
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [slug])

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <div>
          <Header />
          <div className="max-w-3xl mx-auto px-4 py-28 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Certification Program Not Found
            </h1>
            <p className="text-slate-600">
              Choose one of CPACE Philippines&apos; official professional certification and review programs below.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {allCourses.map(item => (
                <Link
                  key={item.slug}
                  href={`/services/professional-certification/${item.slug}`}
                >
                  <Button variant="outline" className="rounded-xl font-semibold">
                    {formatTrademarkText(item.acronym)} — {formatTrademarkText(item.fullName)}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Header />

        {/* ── Program Switcher Bar ── */}
        <div className="bg-white border-b border-slate-200/80 sticky top-18 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/services#certifications"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All Certifications
            </Link>
            <div className="flex flex-wrap items-center gap-1.5" aria-label="Switch certification program">
              {allCourses.map(item => {
                const isCurrent = item.slug === course.slug
                return (
                  <Link
                    key={item.slug}
                    href={`/services/professional-certification/${item.slug}`}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                    }`}
                  >
                    {item.acronym === "LLL" ? "Labor Law Lecture" : formatTrademarkText(item.acronym)}
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  href={`/dashboard/programs?edit=${course.slug}`}
                  className="ml-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Program
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Hero Banner ── */}
        <section className="relative py-16 lg:py-24 bg-gradient-to-br from-slate-950 via-gray-900 to-emerald-950 text-white overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Badge Column */}
              <div className="lg:col-span-4 flex flex-col items-center">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-6 shadow-2xl flex items-center justify-center">
                  <div className="relative w-44 h-44 sm:w-52 sm:h-52">
                    <Image
                      src={course.badgeImage}
                      alt={`${course.fullName} ${course.parenthesizedAcronym} Badge`}
                      fill
                      priority
                      className="object-contain drop-shadow-2xl"
                      sizes="220px"
                    />
                  </div>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  CPACE Philippines Official Credential
                </div>
              </div>

              {/* Hero Text & Actions */}
              <div className="lg:col-span-8 space-y-6 text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    {course.category}
                  </span>
                  <span className="px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-semibold">
                    {course.formats}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                  {formatTrademarkText(course.fullName)}{" "}
                  <span className="text-emerald-400">
                    {formatTrademarkText(course.parenthesizedAcronym)}
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-3xl">
                  {formatTrademarkText(course.heroSubtitle)}
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    href={course.registerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-8 py-6 rounded-xl shadow-xl shadow-emerald-950/50 text-base">
                      Register Here
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>

                  {course.brochureUrl && (
                    <Link
                      href={course.brochureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="border-2 border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white font-semibold px-7 py-6 rounded-xl text-base"
                      >
                        <Download className="mr-2 w-4 h-4" />
                        Download Brochure / Info Sheet
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 Core Pillars ── */}
        <section className="py-14 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {course.pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-7 space-y-3 hover:shadow-md hover:border-emerald-200 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {formatTrademarkText(pillar.title)}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {formatTrademarkText(pillar.description)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Exam Format & Coverage Topics ── */}
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Exam Format Card */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-lg p-8 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                  <FileCheck2 className="w-4 h-4" />
                  Exam Format &amp; Standards
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Assessment Structure
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {formatTrademarkText(course.examFormat.overview)}
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase">
                        Duration &amp; Volume
                      </div>
                      <div className="text-sm font-bold text-slate-900 whitespace-pre-line">
                        {course.examFormat.questions
                          ? `${course.examFormat.duration} · ${course.examFormat.questions}`
                          : course.examFormat.duration}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase">
                        Passing Standard
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {course.examFormat.passingMark}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase">
                        Credential Validity
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {course.examFormat.validity}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950 text-emerald-100 text-xs leading-relaxed">
                  {formatTrademarkText(course.examFormat.authorization)}
                </div>
              </div>

              {/* Exam Coverage and Topics */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-lg p-8 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  Curriculum &amp; Competencies
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Exam Coverage and Topics
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">
                    {course.coverageTopics.length} Core Subject Areas
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  Candidates are evaluated across the following foundational and applied domain modules:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {course.coverageTopics.map((topic, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-200 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 leading-snug">
                        {formatTrademarkText(topic)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Who Are Qualified? (Categories A, B, C, D) ── */}
        <section id="categories" className="py-16 lg:py-20 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                Applicant Eligibility &amp; Categories
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Who Are Qualified?
              </h2>
              <p className="text-slate-600 text-base">
                Applicants qualify for the {formatTrademarkText(course.fullName)} {formatTrademarkText(course.parenthesizedAcronym)} program under any of the following four official qualification categories:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {course.qualificationCategories.map(cat => (
                <div
                  key={cat.code}
                  className="group rounded-3xl border border-slate-200 bg-slate-50/50 p-7 hover:bg-white hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-sm">
                        {cat.code}
                      </span>
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        {categoryIcons[cat.code]}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {cat.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {formatTrademarkText(cat.description)}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Eligible for {formatTrademarkText(course.acronym)} Registration</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Process and Requirements ── */}
        <section className="py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-gray-900 to-emerald-950 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  Step-by-Step Enrollment
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold">
                  Process and Requirements
                </h2>
                <p className="text-white/75 text-base">
                  Learning Investment:{" "}
                  <strong className="text-emerald-300 font-extrabold">
                    {course.investment}
                  </strong>{" "}
                  · Submit requirements to{" "}
                  <a
                    href={`mailto:${course.submissionEmail}`}
                    className="underline text-emerald-300 hover:text-emerald-200"
                  >
                    {course.submissionEmail}
                  </a>
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {course.brochureUrl && (
                  <Link
                    href={course.brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold rounded-xl px-6 py-5"
                    >
                      <Download className="mr-2 w-4 h-4" />
                      Get Information Sheet
                    </Button>
                  </Link>
                )}
                <Link
                  href={course.registerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl px-7 py-5 shadow-lg">
                    Register Here
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {course.processSteps.map(item => (
                <div
                  key={item.step}
                  className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-6 space-y-3"
                >
                  <div className="text-3xl font-black text-emerald-400">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed">
                    {formatTrademarkText(item.detail)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Frequently Asked Questions ── */}
        <section className="py-16 lg:py-20 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                Frequently Asked Questions
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">
                Everything You Need to Know About {formatTrademarkText(course.acronym)}
              </h2>
            </div>

            <div className="space-y-4">
              {course.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-2.5"
                >
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-start gap-2.5">
                    <span className="text-emerald-600 font-extrabold">Q.</span>
                    <span>{formatTrademarkText(faq.question)}</span>
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed pl-6">
                    {formatTrademarkText(faq.answer)}
                  </p>
                </div>
              ))}
            </div>

            {/* Direct Contact Footer Box */}
            <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-10 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Ready to earn your {formatTrademarkText(course.acronym)} credential?
                </h3>
                <p className="text-sm text-slate-600 max-w-xl">
                  Unit 1510 High Street South Corporate Plaza Tower 1, 26th St. Corner 9th Ave., BGC Taguig City, Philippines (1634)
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs font-semibold text-emerald-800">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    {course.submissionEmail}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    (02) 8260-9931 | +63 956 221-2400
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    BGC, Taguig City
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href={course.registerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-7 py-5 rounded-xl shadow-md">
                    Register Online
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/#contact">
                  <Button
                    variant="outline"
                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold px-6 py-5 rounded-xl"
                  >
                    Send an Inquiry
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}
