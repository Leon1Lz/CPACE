"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts"
import Link from "next/link"
import {
  Users, BookOpen, Award, ClipboardCheck, ChevronRight,
  Clock, Play, TrendingUp, TrendingDown, GraduationCap,
  FileText, CheckCircle, AlertCircle, Plus, Eye,
  ShieldCheck, Monitor, Minus, ArrowRight, Sparkles,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
interface Trend { current: number; previous: number | null; pct: number | null }

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
  gradient?: string
  trend?: Trend
}

// ── Trend Badge ───────────────────────────────────────────────────────────────
function TrendBadge({ trend }: { trend?: Trend }) {
  if (!trend || trend.pct === null) return null
  const up = trend.pct >= 0
  const zero = trend.pct === 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
      zero ? "bg-gray-100 text-gray-500"
      : up   ? "bg-emerald-100 text-emerald-700"
             : "bg-red-100 text-red-600"
    }`}>
      {zero ? <Minus className="h-2.5 w-2.5" />
             : up ? <TrendingUp className="h-2.5 w-2.5" />
                  : <TrendingDown className="h-2.5 w-2.5" />}
      {zero ? "—" : `${up ? "+" : ""}${trend.pct}%`}
    </span>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, subtitle, gradient = "from-emerald-500 to-teal-600", trend }: StatCardProps) {
  return (
    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <div className="flex items-center gap-2 min-h-[20px]">
              {trend && <TrendBadge trend={trend} />}
              {trend?.pct !== null && trend?.pct !== undefined && (
                <p className="text-[11px] text-gray-400">vs last week</p>
              )}
              {!trend && subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
          </div>
          <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0 ml-3`}>
            <div className="text-white [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-white">{icon}</div>
          </div>
        </div>
      </CardContent>
      <div className={`h-0.5 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
    </Card>
  )
}

// ── Shared loading skeleton ────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  )
}

// ── Avatar helper ─────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
      {initials}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE:    "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    DROPPED:   "bg-red-100 text-red-700",
    PUBLISHED: "bg-emerald-100 text-emerald-700",
    DRAFT:     "bg-gray-100 text-gray-600",
    ARCHIVED:  "bg-amber-100 text-amber-700",
    SUSPENDED: "bg-orange-100 text-orange-700",
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

// ── Sparkline chart data builder (7-day mock based on total) ──────────────────
function buildSparkline(total: number) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const base = Math.max(1, Math.floor(total / 7))
  return days.map((d, i) => ({
    day: d,
    value: Math.max(0, base + Math.floor(Math.sin(i) * base * 0.4)),
  }))
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export function AdminDashboard({ userName = "Admin" }: { userName?: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats").then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const enrollmentChart = buildSparkline(data?.totalEnrollments ?? 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {userName} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Here's what's happening across the learning portal today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"    value={data?.totalUsers ?? 0}        icon={<Users />}      gradient="from-emerald-500 to-teal-600"  trend={data?.trends?.users} />
        <StatCard title="Total Courses"  value={data?.totalCourses ?? 0}      icon={<BookOpen />}   gradient="from-blue-500 to-cyan-600"     trend={data?.trends?.courses} />
        <StatCard title="Enrollments"    value={data?.totalEnrollments ?? 0}  icon={<TrendingUp />} gradient="from-violet-500 to-purple-600" trend={data?.trends?.enrollments} />
        <StatCard title="Certificates"   value={data?.totalCertificates ?? 0} icon={<Award />}      gradient="from-amber-500 to-orange-600"  trend={data?.trends?.certificates} />
      </div>

      {/* Enrollment trend chart */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">Enrollment Activity (This Week)</CardTitle>
            <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-0">Live</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={enrollmentChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                formatter={(v: number) => [v, "Enrollments"]}
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#enrollGrad)" dot={{ fill: "#10b981", strokeWidth: 0, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Enrollments */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">Recent Enrollments</CardTitle>
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" asChild>
              <Link href="/dashboard/reports">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data?.recentEnrollments?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100">
                  <TableHead className="text-gray-500 font-medium">Learner</TableHead>
                  <TableHead className="text-gray-500 font-medium">Course</TableHead>
                  <TableHead className="text-gray-500 font-medium">Category</TableHead>
                  <TableHead className="text-gray-500 font-medium">Date</TableHead>
                  <TableHead className="text-gray-500 font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentEnrollments.map((e: any) => (
                  <TableRow key={e.id} className="border-gray-50 hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={`${e.user.firstName} ${e.user.lastName}`} />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{e.user.firstName} {e.user.lastName}</p>
                          <p className="text-xs text-gray-400">{e.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{e.course.title}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{e.course.category ?? "—"}</Badge></TableCell>
                    <TableCell className="text-xs text-gray-400">{new Date(e.enrolledAt).toLocaleDateString()}</TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-400 space-y-3">
              <Users className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm">No enrollments yet</p>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <Link href="/dashboard/courses"><Plus className="h-3.5 w-3.5 mr-1.5" />Create a Course to get started</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTRUCTOR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export function InstructorDashboard({ userName = "Instructor" }: { userName?: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats").then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const submissionChart = (data?.myCourses ?? []).slice(0, 6).map((c: any) => ({
    name: c.title.split(" ").slice(0, 2).join(" "),
    learners: c._count.enrollments,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {userName} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your courses and track learner progress.</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
          <Link href="/dashboard/courses/create"><Plus className="h-4 w-4 mr-2" /> New Course</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="My Courses"    value={data?.myCourses?.length ?? 0}  icon={<BookOpen />}      gradient="from-blue-500 to-cyan-600"    subtitle="Created by you" />
        <StatCard title="Total Learners" value={data?.totalLearners ?? 0}      icon={<Users />}         gradient="from-emerald-500 to-teal-600" trend={data?.trends?.learners} />
        <StatCard title="Submissions"   value={data?.recentSubmissions?.length ?? 0} icon={<ClipboardCheck />} gradient="from-amber-500 to-orange-600" subtitle="Recent activity" />
      </div>

      {/* Learners per course bar chart */}
      {submissionChart.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Learners per Course</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={submissionChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                  formatter={(v: number) => [v, "Learners"]}
                />
                <Bar dataKey="learners" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* My Courses grid */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">My Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.myCourses?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.myCourses.map((course: any) => (
                <div key={course.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <StatusBadge status={course.status} />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">{course._count.enrollments} learners enrolled</p>
                  <Button variant="outline" size="sm" asChild className="w-full rounded-xl text-xs hover:border-emerald-500 hover:text-emerald-600">
                    <Link href={`/dashboard/courses/${course.id}`}><Eye className="h-3 w-3 mr-1" /> Manage</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 space-y-3">
              <BookOpen className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm">No courses yet</p>
              <Button asChild className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs">
                <Link href="/dashboard/courses/create"><Plus className="h-3 w-3 mr-1" /> Create your first course</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Recent Assessment Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentSubmissions?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100">
                  <TableHead className="text-gray-500 font-medium">Learner</TableHead>
                  <TableHead className="text-gray-500 font-medium">Assessment</TableHead>
                  <TableHead className="text-gray-500 font-medium">Score</TableHead>
                  <TableHead className="text-gray-500 font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentSubmissions.map((r: any) => (
                  <TableRow key={r.id} className="border-gray-50 hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={`${r.user.firstName} ${r.user.lastName}`} />
                        <span className="font-medium text-sm">{r.user.firstName} {r.user.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{r.assessment?.title}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-semibold ${r.passed ? "text-emerald-600" : "text-red-500"}`}>
                        {r.score?.toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.passed
                        ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="h-3 w-3" /> Passed</span>
                        : <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" /> Failed</span>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-gray-400 space-y-3">
              <FileText className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm">No submissions yet</p>
              <p className="text-xs text-gray-400">Submissions will appear here once learners take your assessments</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCTOR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export function ProctorDashboard({ userName = "Proctor" }: { userName?: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats").then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {userName} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor active exam sessions and learner activity in real time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Active Sessions"  value={data?.activeSessions ?? 0}  icon={<Monitor />}      gradient="from-violet-500 to-purple-600" subtitle="Currently in progress" />
        <StatCard title="Exams Today"      value={data?.todaySessions ?? 0}   icon={<ClipboardCheck />} gradient="from-blue-500 to-cyan-600"   trend={data?.trends?.sessions} />
        <StatCard title="Flagged Sessions" value={data?.flaggedSessions ?? 0} icon={<ShieldCheck />}  gradient="from-rose-500 to-pink-600"    subtitle="Needs review" />
      </div>

      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-violet-100 bg-violet-50/30 text-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Exam Monitor</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Real-time exam session monitoring. See live learner activity, flag suspicious sessions.
        </p>
        <Button asChild className="mt-5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
          <Link href="/dashboard/proctor"><Monitor className="h-4 w-4 mr-2" /> Open Exam Monitor</Link>
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARNER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export function LearnerDashboard({ userName = "Learner" }: { userName?: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats").then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const enrollments: any[] = data?.enrollments ?? []
  const certificates: any[] = data?.certificates ?? []
  const upcomingAssessments: any[] = data?.upcomingAssessments ?? []

  const completed = enrollments.filter(e => e.status === "COMPLETED").length
  const inProgress = enrollments.filter(e => e.status === "ACTIVE").length

  // #2 — Most recent active course for the hero card
  const heroCourse = enrollments.find(e => e.status === "ACTIVE") ?? enrollments[0] ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userName} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Continue your learning journey where you left off.</p>
      </div>

      {/* ── #2 Hero "Continue" Card ───────────────────────────────────────────── */}
      {heroCourse && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 shadow-xl">
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/10 rounded-full blur-2xl" />

          <div className="relative z-10 flex items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-200 text-xs font-semibold uppercase tracking-widest">
                  {heroCourse.status === "ACTIVE" ? "Continue Learning" : "Completed"}
                </span>
              </div>
              <h2 className="text-xl font-black text-white leading-tight mb-1 line-clamp-2">
                {heroCourse.course.title}
              </h2>
              <p className="text-emerald-200 text-sm mb-4">{heroCourse.course.category ?? "General"}</p>

              {/* Progress bar */}
              <div className="space-y-1.5 mb-5">
                <div className="flex justify-between text-xs text-emerald-200">
                  <span>Progress</span>
                  <span className="font-bold">{Math.round(heroCourse.progress)}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${Math.round(heroCourse.progress)}%` }}
                  />
                </div>
              </div>

              <Button asChild className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                <Link href={`/dashboard/courses/${heroCourse.course.id}`}>
                  <Play className="h-4 w-4 mr-2 fill-emerald-700" />
                  {heroCourse.status === "ACTIVE" ? "Resume Course" : "Review Course"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Right — mini stats */}
            <div className="hidden md:flex flex-col gap-3 shrink-0">
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center min-w-[90px]">
                <p className="text-2xl font-black text-white">{inProgress}</p>
                <p className="text-[11px] text-emerald-200 font-medium">In Progress</p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-white">{completed}</p>
                <p className="text-[11px] text-emerald-200 font-medium">Completed</p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-white">{certificates.length}</p>
                <p className="text-[11px] text-emerald-200 font-medium">Certificates</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards — shown when no hero (no enrollments) */}
      {!heroCourse && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Enrolled Courses" value={enrollments.length} icon={<BookOpen />} subtitle="Total courses"  gradient="from-emerald-500 to-teal-600" />
          <StatCard title="In Progress"       value={inProgress}        icon={<Play />}     subtitle="Active right now" gradient="from-blue-500 to-cyan-600" />
          <StatCard title="Certificates"      value={certificates.length} icon={<Award />}  subtitle="Earned so far"  gradient="from-violet-500 to-purple-600" />
        </div>
      )}

      {/* My Courses */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">My Courses</CardTitle>
            {enrollments.length > 0 && (
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" asChild>
                <Link href="/dashboard/courses">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {enrollments.length > 0 ? enrollments.slice(0, 4).map((e: any) => (
            <div key={e.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:shadow-sm transition-all duration-200">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{e.course.title}</h3>
                  <StatusBadge status={e.status} />
                </div>
                <p className="text-xs text-gray-400 mb-2">{e.course.category ?? "General"}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.round(e.progress)}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 shrink-0">{Math.round(e.progress)}%</span>
                </div>
              </div>
              <Button asChild size="sm" className={`shrink-0 rounded-xl ${e.status === "COMPLETED" ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}>
                <Link href={`/dashboard/courses/${e.course.id}`}>
                  {e.status === "COMPLETED" ? <><Eye className="h-3 w-3 mr-1" />View</> : <><Play className="h-3 w-3 mr-1" />Continue</>}
                </Link>
              </Button>
            </div>
          )) : (
            <div className="text-center py-12 text-gray-400 space-y-3">
              <BookOpen className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">You haven't enrolled in any courses yet</p>
              <p className="text-xs text-gray-400">Browse the course catalog to get started on your journey</p>
              <Button asChild className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs">
                <Link href="/dashboard/courses"><ArrowRight className="h-3.5 w-3.5 mr-1.5" /> Browse the course catalog</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Assessments */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">Available Assessments</CardTitle>
            {upcomingAssessments.length > 0 && (
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" asChild>
                <Link href="/dashboard/assessments">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingAssessments.length > 0 ? upcomingAssessments.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:shadow-sm transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-400">{a.course?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {a.timeLimit && (
                  <div className="hidden sm:flex items-center text-xs text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />{a.timeLimit} min
                  </div>
                )}
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs">
                  <Link href={`/dashboard/assessments/${a.id}/take`}>Start</Link>
                </Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-gray-400 space-y-3">
              <ClipboardCheck className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm">No assessments available right now</p>
              <p className="text-xs text-gray-400">Enroll in a course to unlock assessments</p>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <Link href="/dashboard/courses"><ArrowRight className="h-3.5 w-3.5 mr-1.5" /> Browse Courses</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificates */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">My Certificates</CardTitle>
            {certificates.length > 0 && (
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" asChild>
                <Link href="/dashboard/certificates">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {certificates.length > 0 ? certificates.map((c: any) => (
            <div key={c.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50">
              <div className="h-14 w-20 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                <Award className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900">{c.title}</h3>
                <p className="text-xs text-gray-500">{c.course?.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Issued: {new Date(c.issuedAt).toLocaleDateString()} · #{c.certificateNumber}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="rounded-xl text-xs" asChild>
                  <Link href={`/dashboard/certificates`}>View</Link>
                </Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-gray-400 space-y-3">
              <Award className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">No certificates earned yet</p>
              <p className="text-xs text-gray-400">Complete a course and pass the final exam to earn your certificate</p>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <Link href="/dashboard/assessments"><ArrowRight className="h-3.5 w-3.5 mr-1.5" /> Take a Final Exam</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
