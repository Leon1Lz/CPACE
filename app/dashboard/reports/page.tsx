"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Users, BookOpen, Award, TrendingUp, GraduationCap, CheckCircle, XCircle, Loader2, Download } from "lucide-react"

export default function ReportsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const role = session?.user?.role?.toLowerCase()

  useEffect(() => {
    fetch("/api/reports").then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (role === "admin") {
    const usersByRole = data?.usersByRole ?? []
    const enrollmentsByStatus = data?.enrollmentsByStatus ?? []
    const topCourses = data?.topCourses ?? []
    const avgScore = data?.assessmentResults?._avg?.score

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Platform-wide insights and statistics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Users by Role */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" /> Users by Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usersByRole.map((r: any) => {
                const total = usersByRole.reduce((s: number, x: any) => s + x._count.id, 0)
                const pct = total ? Math.round((r._count.id / total) * 100) : 0
                const roleStyle: Record<string, { bar: string; badge: string }> = {
                  ADMIN:      { bar: "bg-rose-500",    badge: "bg-rose-100 text-rose-700" },
                  INSTRUCTOR: { bar: "bg-blue-500",    badge: "bg-blue-100 text-blue-700" },
                  LEARNER:    { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
                  PROCTOR:    { bar: "bg-violet-500",  badge: "bg-violet-100 text-violet-700" },
                }
                const style = roleStyle[r.role] ?? { bar: "bg-gray-400", badge: "bg-gray-100 text-gray-600" }
                return (
                  <div key={r.role} className="space-y-1.5">
                    <div className="flex justify-between text-sm items-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>{r.role}</span>
                      <span className="text-gray-500">{r._count.id} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              {usersByRole.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
            </CardContent>
          </Card>

          {/* Enrollments by Status */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" /> Enrollments by Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollmentsByStatus.map((e: any) => {
                const total = enrollmentsByStatus.reduce((s: number, x: any) => s + x._count.id, 0)
                const pct = total ? Math.round((e._count.id / total) * 100) : 0
                const colors: Record<string, string> = { ACTIVE: "text-emerald-600 bg-emerald-100", COMPLETED: "text-blue-600 bg-blue-100", DROPPED: "text-red-600 bg-red-100", SUSPENDED: "text-amber-600 bg-amber-100" }
                return (
                  <div key={e.status} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors[e.status] ?? "bg-gray-100 text-gray-600"}`}>{e.status}</span>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{e._count.id}</p>
                      <p className="text-xs text-gray-400">{pct}%</p>
                    </div>
                  </div>
                )
              })}
              {enrollmentsByStatus.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
            </CardContent>
          </Card>

          {/* Top Courses */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-violet-600" /> Top Courses by Enrollment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCourses.length > 0 ? topCourses.map((c: any, i: number) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">{c.category ?? "General"}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0">{c._count.enrollments}</span>
                </div>
              )) : <p className="text-sm text-gray-400 text-center py-4">No courses yet</p>}
            </CardContent>
          </Card>

          {/* Assessment Summary */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-600" /> Assessment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-5xl font-black text-gray-900 mb-1">
                  {avgScore != null ? `${avgScore.toFixed(1)}%` : "—"}
                </div>
                <p className="text-sm text-gray-500">Average Assessment Score</p>
                <p className="text-xs text-gray-400 mt-1">{data?.assessmentResults?._count?.id ?? 0} total attempts</p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Data Export */}
          <Card className="border-0 shadow-md md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Download className="h-4 w-4 text-emerald-600" /> Detailed Data Export
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-11 justify-center border-gray-200 hover:border-emerald-500 rounded-xl"
                onClick={() => window.open("/api/reports?export=users", "_blank")}
              >
                <Users className="h-4 w-4 text-gray-500" /> Export User Directory
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-11 justify-center border-gray-200 hover:border-emerald-500 rounded-xl"
                onClick={() => window.open("/api/reports?export=enrollments", "_blank")}
              >
                <TrendingUp className="h-4 w-4 text-gray-500" /> Export Enrollments
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-11 justify-center border-gray-200 hover:border-emerald-500 rounded-xl"
                onClick={() => window.open("/api/reports?export=results", "_blank")}
              >
                <Award className="h-4 w-4 text-gray-500" /> Export Exam Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (role === "instructor") {
    const courses = data?.courses ?? []
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learner Progress</h1>
          <p className="text-sm text-gray-500 mt-1">Track how your learners are progressing</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {courses.length > 0 ? courses.map((c: any) => {
            const avgProgress = c.enrollments.length
              ? c.enrollments.reduce((s: number, e: any) => s + e.progress, 0) / c.enrollments.length
              : 0
            const completed = c.enrollments.filter((e: any) => e.status === "COMPLETED").length
            return (
              <Card key={c.id} className="border-0 shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{c.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{c._count.enrollments} enrolled · {c._count.assessments} assessments</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{c.status}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Avg Progress</span><span>{avgProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${avgProgress.toFixed(0)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Completed: <strong className="text-blue-600">{completed}</strong></span>
                      <span>In Progress: <strong className="text-emerald-600">{c.enrollments.length - completed}</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          }) : (
            <div className="text-center py-16 text-gray-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No courses to report yet</p>
            </div>
          )}
        </div>

        {/* Detailed Data Export */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Download className="h-4 w-4 text-emerald-600" /> Detailed Data Export
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2 h-11 justify-center border-gray-200 hover:border-emerald-500 rounded-xl"
              onClick={() => window.open("/api/reports?export=enrollments", "_blank")}
            >
              <TrendingUp className="h-4 w-4 text-gray-500" /> Export Course Enrollments
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-11 justify-center border-gray-200 hover:border-emerald-500 rounded-xl"
              onClick={() => window.open("/api/reports?export=results", "_blank")}
            >
              <Award className="h-4 w-4 text-gray-500" /> Export Exam Results
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // LEARNER
  const enrollments = data?.enrollments ?? []
  const results = data?.results ?? []
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
        <p className="text-sm text-gray-500 mt-1">Track your learning journey and assessment results</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-600" /> Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrollments.length > 0 ? enrollments.map((e: any) => (
              <div key={e.id} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 truncate max-w-[200px]">{e.course?.title}</span>
                  <span className="text-gray-500 shrink-0 ml-2">{Math.round(e.progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round(e.progress)}%` }} />
                </div>
              </div>
            )) : <p className="text-sm text-gray-400 text-center py-4">No enrollments yet</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" /> Assessment Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.length > 0 ? results.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.assessment?.title}</p>
                  <p className="text-xs text-gray-400">{r.assessment?.course?.title}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  {r.passed ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
                  <span className={`font-bold text-sm ${r.passed ? "text-emerald-600" : "text-red-500"}`}>{r.score?.toFixed(0)}%</span>
                </div>
              </div>
            )) : <p className="text-sm text-gray-400 text-center py-4">No assessment results yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
