"use client"

import useSWR from "swr"
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
import type { ActivityPoint } from "@/lib/reporting"
import {
  Users, BookOpen, Award, ClipboardCheck, ChevronRight,
  Clock, Play, TrendingUp, TrendingDown, GraduationCap,
  FileText, CheckCircle, AlertCircle, Plus, Eye,
  ShieldCheck, Monitor, Minus, ArrowRight, Sparkles, Route, Lock,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Trend {
  current: number
  previous: number | null
  pct: number | null
}

export interface StatCardProps {
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
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
      zero ? "bg-slate-100 text-slate-500"
      : up   ? "bg-emerald-100 text-emerald-800"
             : "bg-rose-100 text-rose-700"
    }`}>
      {zero ? <Minus className="h-2.5 w-2.5" />
             : up ? <TrendingUp className="h-2.5 w-2.5" />
                  : <TrendingDown className="h-2.5 w-2.5" />}
      {zero ? "—" : `${up ? "+" : ""}${trend.pct}%`}
    </span>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, subtitle, gradient = "from-emerald-600 to-teal-600", trend }: StatCardProps) {
  return (
    <Card className="gap-0 py-0 border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group bg-white rounded-2xl">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">{title}</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
            <div className="flex items-center gap-2 min-h-[20px]">
              {trend && <TrendBadge trend={trend} />}
              {trend?.pct !== null && trend?.pct !== undefined && (
                <p className="text-[11px] text-slate-400 font-medium">vs last week</p>
              )}
              {!trend && subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
            </div>
          </div>
          <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm shrink-0 ml-3`}>
            <div className="text-white [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-white">{icon}</div>
          </div>
        </div>
      </CardContent>
      <div className={`h-0.5 bg-gradient-to-r ${gradient} opacity-30`} />
    </Card>
  )
}

// ── Shared loading skeleton with Shimmer ──────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-slate-200/80 rounded-xl relative overflow-hidden shimmer" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200/80 rounded-2xl relative overflow-hidden shimmer" />
        ))}
      </div>
      <div className="h-64 bg-slate-200/80 rounded-2xl relative overflow-hidden shimmer" />
    </div>
  )
}

// ── Avatar helper ─────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
      {initials}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE:    "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    COMPLETED: "bg-blue-50 text-blue-700 border border-blue-200/60",
    DROPPED:   "bg-rose-50 text-rose-700 border border-rose-200/60",
    PUBLISHED: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    DRAFT:     "bg-slate-100 text-slate-600 border border-slate-200",
    ARCHIVED:  "bg-amber-50 text-amber-700 border border-amber-200/60",
    SUSPENDED: "bg-orange-50 text-orange-700 border border-orange-200/60",
  }
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colors[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

// ── Sparkline chart data builder ──────────────────────────────────────────────

const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Unable to load dashboard data")
  return data
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export interface AdminRecentEnrollment {
  id: string
  enrolledAt: string
  status: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  course: {
    title: string
    category: string | null
  }
}

export interface AdminStats {
  role: "ADMIN"
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  totalCertificates: number
  recentEnrollments: AdminRecentEnrollment[]
  enrollmentActivity: ActivityPoint[]
  trends: {
    users: Trend
    courses: Trend
    enrollments: Trend
    certificates: Trend
  }
}

export function AdminDashboard({ userName = "Admin" }: { userName?: string }) {
  const { data, error, isLoading } = useSWR<AdminStats>("/api/dashboard/stats", fetcher)

  if (isLoading && !error) return <DashboardSkeleton />
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-800">Failed to load admin stats</h3>
        <p className="text-sm text-slate-400">Please try refreshing the page.</p>
      </div>
    )
  }

  if (!data) return <DashboardSkeleton />
  const enrollmentChart = data.enrollmentActivity ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#105C2E] via-emerald-800 to-teal-800 p-6 sm:p-8 text-white">
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">CPACE / Administration</p><h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, {userName}</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-50/80">Your learning community, at a glance. Manage programs, follow learner progress, and keep every certification journey moving.</p></div>
          <Button asChild className="shrink-0 self-start sm:self-auto rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 shadow-sm"><Link href="/dashboard/courses">Manage programs<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"    value={data.totalUsers}        icon={<Users />}      gradient="from-emerald-600 to-teal-600"  trend={data.trends?.users} />
        <StatCard title="Total Courses"  value={data.totalCourses}      icon={<BookOpen />}   gradient="from-blue-600 to-cyan-600"     trend={data.trends?.courses} />
        <StatCard title="Enrollments"    value={data.totalEnrollments}  icon={<TrendingUp />} gradient="from-violet-600 to-purple-600" trend={data.trends?.enrollments} />
        <StatCard title="Certificates"   value={data.totalCertificates} icon={<Award />}      gradient="from-amber-600 to-orange-600"  trend={data.trends?.certificates} />
      </div>

      {/* Enrollment trend chart */}
      <Card className="border border-slate-200/70 shadow-sm rounded-2xl bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900">Enrollment Activity (Last 7 Days)</CardTitle>
            <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold">Daily totals · PH time</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={enrollmentChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", fontSize: 12, backgroundColor: "#ffffff" }}
                formatter={(v: any) => [isNaN(Number(v)) ? "0" : Number(v).toString(), "Enrollments"]}
              />
              <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} fill="url(#enrollGrad)" dot={{ fill: "#059669", strokeWidth: 0, r: 3.5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Enrollments */}
      <Card className="border border-slate-200/70 shadow-sm rounded-2xl bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900">Recent Enrollments</CardTitle>
            <Button variant="ghost" size="sm" className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl" asChild>
              <Link href="/dashboard/reports">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentEnrollments?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100">
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Learner</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Course</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Category</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentEnrollments.map((e) => (
                  <TableRow key={e.id} className="border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={`${e.user.firstName} ${e.user.lastName}`} />
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{e.user.firstName} {e.user.lastName}</p>
                          <p className="text-xs text-slate-400">{e.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-700">{e.course.title}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs font-semibold">{e.course.category ?? "—"}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-400">{new Date(e.enrolledAt).toLocaleDateString()}</TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Users className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">No enrollments recorded yet</p>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-semibold">
                <Link href="/dashboard/courses"><Plus className="h-3.5 w-3.5 mr-1.5" />Create a Course</Link>
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
export interface InstructorCourse {
  id: string
  title: string
  status: string
  _count: {
    enrollments: number
  }
}

export interface InstructorSubmission {
  id: string
  score: number | null
  passed: boolean | null
  completedAt: string | null
  user: {
    firstName: string
    lastName: string
  }
  assessment: {
    title: string
    course: {
      title: string
    }
  } | null
}

export interface InstructorStats {
  role: "INSTRUCTOR"
  myCourses: InstructorCourse[]
  recentSubmissions: InstructorSubmission[]
  totalLearners: number
  pendingGrading: number
  trends: {
    learners: Trend
    submissions: Trend
  }
}

export function InstructorDashboard({ userName = "Instructor" }: { userName?: string }) {
  const { data, error, isLoading } = useSWR<InstructorStats>("/api/dashboard/stats", fetcher)

  if (isLoading && !error) return <DashboardSkeleton />
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-800">Failed to load instructor stats</h3>
        <p className="text-sm text-slate-400">Please try refreshing the page.</p>
      </div>
    )
  }

  if (!data) return <DashboardSkeleton />
  const submissionChart = (data.myCourses ?? []).slice(0, 6).map((c) => ({
    name: c.title.split(" ").slice(0, 2).join(" "),
    learners: c._count.enrollments,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome, {userName} 👋</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your cohorts, monitor grades, and publish course content.</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm">
          <Link href="/dashboard/courses/create"><Plus className="h-4 w-4 mr-2" /> New Course</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="My Courses"    value={data.myCourses?.length ?? 0}  icon={<BookOpen />}      gradient="from-blue-600 to-cyan-600"    subtitle="Active programs" />
        <StatCard title="Total Learners" value={data.totalLearners}      icon={<Users />}         gradient="from-emerald-600 to-teal-600" trend={data.trends?.learners} />
        <StatCard title="Submissions"   value={data.recentSubmissions?.length ?? 0} icon={<ClipboardCheck />} gradient="from-amber-600 to-orange-600" subtitle="Recent assessments" />
      </div>

      {/* Learners per course bar chart */}
      {submissionChart.length > 0 && (
        <Card className="border border-slate-200/70 shadow-sm rounded-2xl bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Learners per Course</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={submissionChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", fontSize: 12, backgroundColor: "#ffffff" }}
                  formatter={(v: any) => [isNaN(Number(v)) ? "0" : Number(v).toString(), "Learners"]}
                />
                <Bar dataKey="learners" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* My Courses grid */}
      <Card className="border border-slate-200/70 shadow-sm rounded-2xl bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">My Assigned Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {data.myCourses?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.myCourses.map((course) => (
                <div key={course.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:shadow-md hover:border-emerald-200 transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-xs">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <StatusBadge status={course.status} />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-slate-500 mb-4">{course._count.enrollments} learners currently enrolled</p>
                  <Button variant="outline" size="sm" asChild className="w-full rounded-xl text-xs font-semibold hover:border-emerald-600 hover:text-emerald-700">
                    <Link href={`/dashboard/courses/${course.id}`}><Eye className="h-3.5 w-3.5 mr-1" /> Manage Syllabus</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <BookOpen className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">No courses created yet</p>
              <Button asChild className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
                <Link href="/dashboard/courses/create"><Plus className="h-3.5 w-3.5 mr-1" /> Create your first course</Link>
              </Button>
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
export interface ProctorStats {
  role: "PROCTOR"
  activeSessions: number
  todaySessions: number
  flaggedSessions: number
  trends: {
    sessions: Trend
  }
}

export function ProctorDashboard({ userName = "Proctor" }: { userName?: string }) {
  const { data, error, isLoading } = useSWR<ProctorStats>("/api/dashboard/stats", fetcher)

  if (isLoading && !error) return <DashboardSkeleton />
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-800">Failed to load proctor stats</h3>
        <p className="text-sm text-slate-400">Please try refreshing the page.</p>
      </div>
    )
  }

  if (!data) return <DashboardSkeleton />
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome, {userName} 👋</h1>
        <p className="text-sm text-slate-500 mt-1">Live proctoring console & exam integrity monitoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Active Sessions"  value={data.activeSessions}  icon={<Monitor />}      gradient="from-violet-600 to-purple-600" subtitle="In progress right now" />
        <StatCard title="Exams Today"      value={data.todaySessions}   icon={<ClipboardCheck />} gradient="from-blue-600 to-cyan-600"   trend={data.trends?.sessions} />
        <StatCard title="Flagged Sessions" value={data.flaggedSessions} icon={<ShieldCheck />}  gradient="from-rose-600 to-pink-600"    subtitle="Integrity warnings" />
      </div>

      <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-violet-100 bg-gradient-to-b from-violet-50/50 to-white text-center shadow-xs">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center mb-4 shadow-md shadow-violet-900/20">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Live Proctor Console</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Monitor browser focus events, tab switches, and live candidate sessions with real-time audit logs.
        </p>
        <Button asChild className="mt-5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md font-semibold">
          <Link href="/dashboard/proctor"><Monitor className="h-4 w-4 mr-2" /> Launch Live Monitor</Link>
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARNER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export interface LearnerEnrollment {
  id: string
  status: string
  progress: number
  course: {
    id: string
    title: string
    category: string | null
    thumbnail: string | null
    _count: {
      modules: number
    }
  }
}

export interface LearnerCertificate {
  id: string
  title: string
  issuedAt: string
  certificateNumber: string
  course: {
    title: string
  }
}

export interface LearnerAssessment {
  id: string
  title: string
  timeLimit: number | null
  course: {
    title: string
  } | null
}

export interface LearnerStats {
  role: "LEARNER"
  enrollments: LearnerEnrollment[]
  certificates: LearnerCertificate[]
  upcomingAssessments: LearnerAssessment[]
  trends: {
    completed: Trend
    inProgress: Trend
  }
}

interface LearnerPathSummary {
  id: string
  title: string
  description: string | null
  progress: number
  completedSteps: number
  currentStepId: string | null
  steps: Array<{
    id: string
    type: "COURSE" | "ASSESSMENT"
    title?: string | null
    completed: boolean
    locked: boolean
    href: string
    course?: { title: string } | null
    assessment?: { title: string } | null
  }>
}

export function LearnerDashboard({ userName = "Learner" }: { userName?: string }) {
  const { data, error, isLoading } = useSWR<LearnerStats>("/api/dashboard/stats", fetcher)
  const { data: learningPaths = [] } = useSWR<LearnerPathSummary[]>("/api/learning-paths", fetcher)

  if (isLoading && !error) return <DashboardSkeleton />
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-800">Failed to load learner dashboard</h3>
        <p className="text-sm text-slate-400">Please try refreshing the page.</p>
      </div>
    )
  }

  if (!data) return <DashboardSkeleton />
  const enrollments = data.enrollments ?? []
  const certificates = data.certificates ?? []
  const upcomingAssessments = data.upcomingAssessments ?? []

  const completed = enrollments.filter((e) => e.status === "COMPLETED").length
  const inProgress = enrollments.filter((e) => e.status === "ACTIVE").length

  const heroCourse = enrollments.find((e) => e.status === "ACTIVE") ?? enrollments[0] ?? null
  const nextPath = Array.isArray(learningPaths) ? learningPaths.find(path => path.progress < 100 && path.currentStepId) : undefined
  const nextPathStep = nextPath?.steps.find(step => step.id === nextPath.currentStepId && !step.locked)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back, {userName} 👋</h1>
        <p className="text-sm text-slate-500 mt-1">Track your progress and continue your professional training.</p>
      </div>

      {/* Hero Continue Card */}
      {nextPath && nextPathStep ? (
        <div className="rounded-3xl bg-gradient-to-br from-[#105C2E] to-teal-800 p-6 sm:p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Your certification journey</p>
          <h2 className="mt-3 text-2xl font-bold">{nextPath.title}</h2>
          <p className="mt-2 text-sm text-emerald-100">Next: {nextPathStep.title || nextPathStep.course?.title || nextPathStep.assessment?.title}</p>
          <div className="mt-5 max-w-md"><p className="mb-2 text-xs text-emerald-100">{nextPath.progress}% complete</p><div className="h-2 rounded-full bg-white/20"><div className="h-full rounded-full bg-emerald-200" style={{ width: `${nextPath.progress}%` }} /></div></div>
          <Button asChild className="mt-6 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50"><Link href={nextPathStep.href}>Continue my learning path<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      ) : heroCourse && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-slate-900 p-6 sm:p-8 shadow-xl text-white">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-emerald-400/20 rounded-full blur-3xl animate-drift" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl animate-drift delay-1000" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                <span className="text-emerald-200 text-xs font-bold uppercase tracking-widest">
                  {heroCourse.status === "ACTIVE" ? "Current Cohort Module" : "Course Completed"}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white leading-tight mb-1">
                {heroCourse.course.title}
              </h2>
              <p className="text-emerald-200/90 text-sm mb-5 font-medium">{heroCourse.course.category ?? "Professional Certification"}</p>

              {/* Progress bar */}
              <div className="space-y-1.5 mb-6 max-w-md">
                <div className="flex justify-between text-xs text-emerald-100 font-semibold">
                  <span>Module Progress</span>
                  <span>{Math.round(heroCourse.progress)}%</span>
                </div>
                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-300 to-teal-200 rounded-full transition-all duration-700"
                    style={{ width: `${Math.round(heroCourse.progress)}%` }}
                  />
                </div>
              </div>

              <Button asChild className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all h-11 px-6">
                <Link href={`/dashboard/courses/${heroCourse.course.id}`}>
                  <Play className="h-4 w-4 mr-2 fill-emerald-800" />
                  {heroCourse.status === "ACTIVE" ? "Resume Learning" : "Review Modules"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Right mini stats */}
            <div className="flex md:flex-col gap-3 w-full md:w-auto shrink-0">
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/15 min-w-[100px]">
                <p className="text-2xl font-black text-white">{inProgress}</p>
                <p className="text-[11px] text-emerald-200 font-semibold mt-0.5">In Progress</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/15 min-w-[100px]">
                <p className="text-2xl font-black text-white">{completed}</p>
                <p className="text-[11px] text-emerald-200 font-semibold mt-0.5">Completed</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/15 min-w-[100px]">
                <p className="text-2xl font-black text-white">{certificates.length}</p>
                <p className="text-[11px] text-emerald-200 font-semibold mt-0.5">Certificates</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback stat cards */}
      {!heroCourse && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Enrolled Courses" value={enrollments.length} icon={<BookOpen />} subtitle="Active enrollments"  gradient="from-emerald-600 to-teal-600" />
          <StatCard title="In Progress"       value={inProgress}        icon={<Play />}     subtitle="Currently studying" gradient="from-blue-600 to-cyan-600" />
          <StatCard title="Certificates"      value={certificates.length} icon={<Award />}  subtitle="Earned credentials"  gradient="from-violet-600 to-purple-600" />
        </div>
      )}

      {learningPaths.length > 0 && (
        <Card className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-white shadow-sm">
          <CardHeader className="border-b border-emerald-100 bg-emerald-50/50 pb-3">
            <div className="flex items-center justify-between">
              <div><CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900"><Route className="h-4 w-4 text-emerald-700" /> Certification Learning Paths</CardTitle><p className="mt-1 text-xs text-slate-500">Complete each required step to unlock the next.</p></div>
              <Button asChild variant="ghost" size="sm" className="rounded-xl font-semibold text-emerald-700 hover:bg-emerald-100"><Link href="/dashboard/learning-paths">View paths <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 lg:grid-cols-2">
            {learningPaths.slice(0, 4).map((path) => {
              const currentStep = path.steps.find((step) => step.id === path.currentStepId)
              const currentTitle = currentStep?.title || currentStep?.course?.title || currentStep?.assessment?.title
              return (
                <Link key={path.id} href={currentStep && !currentStep.locked ? currentStep.href : "/dashboard/learning-paths"} className="group rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-black text-slate-900">{path.title}</h3><p className="mt-1 truncate text-[11px] text-slate-500">{currentTitle ? `Next: ${currentTitle}` : "All assigned steps completed"}</p></div><span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-emerald-700 shadow-sm">{path.progress}%</span></div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${path.progress}%` }} /></div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400"><span>{path.completedSteps} of {path.steps.length} steps</span><span className="flex items-center gap-1 font-semibold text-emerald-700">{currentStep?.locked ? <Lock className="h-3 w-3" /> : null} Open path <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" /></span></div>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* My Courses */}
      <Card className="border border-slate-200/70 shadow-sm rounded-2xl bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900">Enrolled Courses</CardTitle>
            {enrollments.length > 0 && (
              <Button variant="ghost" size="sm" className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl font-semibold" asChild>
                <Link href="/dashboard/courses">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {enrollments.length > 0 ? enrollments.slice(0, 4).map((e) => (
            <div key={e.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-200/80 transition-all duration-200">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shrink-0 shadow-xs">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{e.course.title}</h3>
                  <StatusBadge status={e.status} />
                </div>
                <p className="text-xs text-slate-400 mb-2 font-medium">{e.course.category ?? "General"}</p>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${Math.round(e.progress)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 shrink-0">{Math.round(e.progress)}%</span>
                </div>
              </div>
              <Button asChild size="sm" className={`shrink-0 rounded-xl font-semibold ${e.status === "COMPLETED" ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"}`}>
                <Link href={`/dashboard/courses/${e.course.id}`}>
                  {e.status === "COMPLETED" ? <><Eye className="h-3.5 w-3.5 mr-1" />Review</> : <><Play className="h-3.5 w-3.5 mr-1" />Continue</>}
                </Link>
              </Button>
            </div>
          )) : (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <BookOpen className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">You haven&apos;t enrolled in any courses yet</p>
              <Button asChild className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
                <Link href="/dashboard/courses"><ArrowRight className="h-3.5 w-3.5 mr-1.5" /> Explore Course Catalog</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Assessments */}
      <Card className="border border-slate-200/70 shadow-sm rounded-2xl bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900">Upcoming Assessments</CardTitle>
            {upcomingAssessments.length > 0 && (
              <Button variant="ghost" size="sm" className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl font-semibold" asChild>
                <Link href="/dashboard/courses">View Assessments <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingAssessments.length > 0 ? upcomingAssessments.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.course?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {a.timeLimit && (
                  <div className="hidden sm:flex items-center text-xs text-slate-500 font-medium">
                    <Clock className="h-3.5 w-3.5 mr-1 text-slate-400" />{a.timeLimit} min
                  </div>
                )}
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs">
                  <Link href={`/dashboard/assessments/${a.id}/take`}>Start Exam</Link>
                </Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <ClipboardCheck className="h-9 w-9 mx-auto opacity-30" />
              <p className="text-sm font-medium">No pending assessments</p>
              <p className="text-xs text-slate-400">Assessments will appear once assigned in your course syllabus</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
