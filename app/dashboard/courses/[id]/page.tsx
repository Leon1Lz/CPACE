"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen, Clock, ChevronRight, ChevronLeft, CheckCircle,
  PlayCircle, FileText, Lock, Award, ArrowLeft, Loader2,
  GraduationCap, BarChart3, ClipboardCheck, Eye, X as XIcon, Download,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import Link from "next/link"
import { SafeHtml } from "@/components/ui/safe-html"
import { calculateModuleProgress } from "@/lib/learning-path-progress"

type Module = {
  id: string
  title: string
  description: string | null
  content: string | null
  videoUrl: string | null
  order: number
  duration: number | null
}

type Assessment = {
  id: string
  title: string
  description: string | null
  type: string
  timeLimit: number | null
  attempts: number | null
  passingScore: number
  materialUrl?: string | null
  materialName?: string | null
  _count?: { questions: number }
}

type Course = {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  duration: number | null
  thumbnail: string | null
  status: string
  instructor: { firstName: string; lastName: string } | null
  modules: Module[]
  assessments?: Assessment[]
  _count: { enrollments: number; modules: number; assessments: number }
}

type Enrollment = {
  id: string
  status: string
  progress: number
  completedModules: string[]
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeModule, setActiveModule] = useState<Module | null>(null)
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [materialViewerOpen, setMaterialViewerOpen] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${id}?modules=true`).then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || "Unable to load this course")
        return data
      }),
      fetch(`/api/enrollments?courseId=${id}`).then(r => r.ok ? r.json() : null),
    ]).then(([courseData, enrollData]) => {
      if (courseData?.id) {
        setCourse(courseData)
        // Auto-open first module
        if (courseData.modules?.length > 0) setActiveModule(courseData.modules[0])
      }
      if (enrollData?.id) {
        setEnrollment(enrollData)
        setCompletedIds(new Set(enrollData.completedModules ?? []))
      }
    }).catch(error => setLoadError(error instanceof Error ? error.message : "Unable to load this course")).finally(() => setLoading(false))
  }, [id])

  const markComplete = async (moduleId: string) => {
    if (completedIds.has(moduleId) || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const newCompleted = new Set([...completedIds, moduleId])
      // Update progress
      const progressPct = course ? calculateModuleProgress(newCompleted.size, course.modules.length) : 0
      const response = await fetch(`/api/enrollments?courseId=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedModules: [...newCompleted], progress: progressPct }),
      })
      const update = await response.json()
      if (!response.ok) throw new Error(update.error || "Module completion was not saved")
      setCompletedIds(new Set(update.completedModules))
      setEnrollment(previous => previous ? { ...previous, progress: update.progress, status: update.status, completedModules: update.completedModules } : previous)
      // Auto-advance to next module
      if (course) {
        const idx = course.modules.findIndex(m => m.id === moduleId)
        if (idx < course.modules.length - 1) setActiveModule(course.modules[idx + 1])
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Module completion was not saved. Please retry.")
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p role="alert" className="mx-auto max-w-lg text-gray-500">{loadError || "Course not found."}</p>
        <Button asChild className="mt-4 mr-2 rounded-xl bg-[#105C2E] hover:bg-[#0B4523]"><Link href="/dashboard/learning-paths">View my learning paths</Link></Button>
        <Button asChild variant="outline" className="mt-4 rounded-xl" size="sm">
          <Link href="/dashboard/courses">← Back to Courses</Link>
        </Button>
      </div>
    )
  }

  const totalModules = course.modules.length
  const completedCount = completedIds.size
  const progress = calculateModuleProgress(completedCount, totalModules)
  const activeIdx = activeModule ? course.modules.findIndex(m => m.id === activeModule.id) : -1

  const levelColors: Record<string, string> = {
    BEGINNER: "bg-emerald-100 text-emerald-700",
    INTERMEDIATE: "bg-amber-100 text-amber-700",
    ADVANCED: "bg-red-100 text-red-700",
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {saveError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{saveError}</p>}
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="sm" className="rounded-xl shrink-0 mt-1 text-gray-500 hover:text-gray-700">
            <Link href="/dashboard/courses"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {course.category && <Badge variant="secondary" className="text-xs">{course.category}</Badge>}
              {course.level && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelColors[course.level] ?? "bg-gray-100 text-gray-600"}`}>
                  {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900">{course.title}</h1>
            {course.instructor && (
              <p className="text-sm text-gray-400 mt-1">
                Instructor: {course.instructor.firstName} {course.instructor.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Progress ring area */}
        <div className="shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 text-center min-w-[140px]">
            <div className="relative w-16 h-16 mx-auto mb-2">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26" fill="none" stroke="#10b981" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-gray-900">
                {progress}%
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">{completedCount}/{totalModules} modules</p>
            {progress === 100 && (
              <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1 justify-center">
                <CheckCircle className="h-3 w-3" /> Complete!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar (mobile) */}
      <div className="md:hidden">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span><span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {totalModules === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-20 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">No modules added yet</p>
            <p className="text-sm text-gray-300 mt-1">Check back soon — your instructor is preparing content.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-5 items-start">
          {/* ── Left: Module list sidebar ──────────────────────────────── */}
          <div className="w-72 shrink-0 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-3">Course Content</p>
            {course.modules.map((mod, i) => {
              const isDone = completedIds.has(mod.id)
              const isActive = activeModule?.id === mod.id
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod)}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition-all duration-150 flex items-start gap-3 ${
                    isActive
                      ? "border-emerald-400 bg-emerald-50 shadow-sm"
                      : isDone
                      ? "border-gray-100 bg-white hover:border-emerald-200"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isDone ? "bg-emerald-500 text-white" : isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                  }`}>
                    {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : <span className="text-xs font-black">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-tight line-clamp-2 ${isActive ? "text-emerald-700" : isDone ? "text-gray-600" : "text-gray-800"}`}>
                      {mod.title}
                    </p>
                    {mod.duration && (
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {mod.duration} min
                      </p>
                    )}
                  </div>
                </button>
              )
            })}

            {/* Course Assessments Section */}
            {course.assessments && course.assessments.length > 0 && (
              <div className="pt-4 border-t border-gray-100 space-y-2 animate-fade-in">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">Assessments</p>
                {course.assessments.map((ass) => {
                  const isActive = activeAssessment?.id === ass.id
                  const isFinal = ass.type === "FINAL_EXAM"
                  const isReviewer = ass.type === "REVIEWER"
                  return (
                    <button
                      key={ass.id}
                      onClick={() => { setActiveAssessment(ass); setActiveModule(null); }}
                      className={`w-full text-left p-3 rounded-2xl border-2 transition-all duration-150 flex items-start gap-3 ${
                        isActive
                          ? "border-amber-400 bg-amber-50 shadow-sm"
                          : "border-gray-100 bg-white hover:border-amber-200"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive ? "bg-amber-100 text-amber-700" : isFinal ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"
                      }`}>
                        <ClipboardCheck className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-tight line-clamp-2 ${isActive ? "text-amber-700" : "text-gray-800"}`}>
                          {ass.title}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-bold">
                          {ass.type.replace("_", " ")}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Right: Module content viewer ──────────────────────────── */}
          <div className="flex-1 min-w-0">
            {activeModule ? (
              <Card className="border-0 shadow-md">
                {/* Module header */}
                <CardHeader className="border-b border-gray-50 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                          Module {activeIdx + 1} of {totalModules}
                        </span>
                        {completedIds.has(activeModule.id) && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                            <CheckCircle className="h-3 w-3" /> Completed
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-xl font-black text-gray-900">{activeModule.title}</CardTitle>
                      {activeModule.description && (
                        <p className="text-sm text-gray-500 mt-1">{activeModule.description}</p>
                      )}
                    </div>
                    {activeModule.duration && (
                      <div className="shrink-0 flex items-center gap-1.5 text-sm text-gray-400 bg-gray-50 rounded-xl px-3 py-1.5">
                        <Clock className="h-3.5 w-3.5" /> {activeModule.duration} min
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Video embed */}
                  {activeModule.videoUrl && (
                    <div className="mb-6 rounded-2xl overflow-hidden bg-black aspect-video shadow-lg">
                      {activeModule.videoUrl.includes("youtube.com") || activeModule.videoUrl.includes("youtu.be") ? (
                        <iframe
                          src={activeModule.videoUrl.replace("watch?v=", "embed/")}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      ) : (
                        <video src={activeModule.videoUrl} controls className="w-full h-full" />
                      )}
                    </div>
                  )}

                  {/* Text content */}
                  {activeModule.content ? (
                    <SafeHtml
                      html={activeModule.content}
                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3"
                      externalLinks
                    />
                  ) : !activeModule.videoUrl ? (
                    <div className="text-center py-12 text-gray-300">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-gray-400">No content for this module yet.</p>
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={() => activeIdx > 0 && setActiveModule(course.modules[activeIdx - 1])}
                      disabled={activeIdx === 0}
                      className="rounded-xl gap-1.5"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>

                    <div className="flex gap-3">
                      {!completedIds.has(activeModule.id) && (
                        <Button
                          onClick={() => markComplete(activeModule.id)}
                          disabled={saving}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Mark Complete
                        </Button>
                      )}
                      {activeIdx < totalModules - 1 && (
                        <Button
                          onClick={() => setActiveModule(course.modules[activeIdx + 1])}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5"
                        >
                          Next <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : activeAssessment ? (
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-gray-50 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {activeAssessment.type.replace("_", " ")}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-black text-gray-900">{activeAssessment.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {activeAssessment.description && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 leading-relaxed">
                      {activeAssessment.description}
                    </p>
                  )}

                  {/* Details grid matching taker intro details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-gray-50/50 border border-gray-100">
                      <p className="text-xs text-gray-400 font-medium">Questions</p>
                      <p className="text-base font-bold text-gray-900 mt-0.5">
                        {activeAssessment._count?.questions ?? 0} items
                      </p>
                    </div>
                    {activeAssessment.type !== "REVIEWER" && activeAssessment.type !== "RULES_GUIDELINES" && (
                      <>
                        <div className="p-3.5 rounded-xl bg-gray-50/50 border border-gray-100">
                          <p className="text-xs text-gray-400 font-medium">Passing Score</p>
                          <p className="text-base font-bold text-gray-900 mt-0.5">
                            {activeAssessment.passingScore}%
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-gray-50/50 border border-gray-100">
                          <p className="text-xs text-gray-400 font-medium">Time Limit</p>
                          <p className="text-base font-bold text-gray-900 mt-0.5">
                            {activeAssessment.timeLimit ? `${activeAssessment.timeLimit} min` : "No limit"}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-gray-50/50 border border-gray-100">
                          <p className="text-xs text-gray-400 font-medium">Attempts</p>
                          <p className="text-base font-bold text-gray-900 mt-0.5">
                            {activeAssessment.attempts ?? "Unlimited"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Attached material with viewer slideshow */}
                  {activeAssessment.materialUrl && (
                    <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-lg font-bold text-xs uppercase shrink-0">
                          {activeAssessment.materialName?.split(".").pop() ?? "FILE"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">Study Material Attached</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{activeAssessment.materialName}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => setMaterialViewerOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> View Material
                      </Button>
                    </div>
                  )}

                  {/* Start Button */}
                  <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-11 font-semibold text-sm">
                    <Link href={`/dashboard/assessments/${activeAssessment.id}/take`}>
                      Start {activeAssessment.type === "FINAL_EXAM" ? "Exam Verification" : "Assessment"} →
                    </Link>
                  </Button>
                </CardContent>

                {/* Study Material Slideshow Viewer Dialog */}
                {activeAssessment.materialUrl && (
                  <Dialog open={materialViewerOpen} onOpenChange={setMaterialViewerOpen}>
                    <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 rounded-2xl overflow-hidden [&>button]:hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-lg font-bold text-[10px] uppercase shrink-0">
                            {activeAssessment.materialName?.split(".").pop() ?? "FILE"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{activeAssessment.materialName}</p>
                            <p className="text-[10px] text-gray-400">Study Material</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 h-8">
                            <a href={activeAssessment.materialUrl} download>
                              <Download className="h-3 w-3" /> Download
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setMaterialViewerOpen(false)} className="rounded-xl h-8 w-8 p-0">
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-900 relative" style={{ height: 'calc(90vh - 56px)' }}>
                        {activeAssessment.materialName?.toLowerCase().endsWith('.pdf') ? (
                          <iframe
                            src={activeAssessment.materialUrl}
                            className="w-full h-full border-0"
                            title="Material Viewer"
                          />
                        ) : (
                          <iframe
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(window.location.origin + activeAssessment.materialUrl)}&embedded=true`}
                            className="w-full h-full border-0"
                            title="Material Viewer"
                            onError={() => {}}
                          />
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </Card>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <PlayCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a module or assessment to start learning</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
