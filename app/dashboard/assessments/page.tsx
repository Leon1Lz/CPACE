"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  ClipboardCheck, Plus, BookOpen, CheckCircle, AlertCircle,
  Loader2, FlaskConical, ScrollText, Trophy, ShieldCheck,
  Clock, RotateCcw, Lock, ChevronRight, ChevronLeft, GraduationCap,
  Building2, Wrench, BarChart3, Trash2,
} from "lucide-react"

type Assessment = {
  id: string
  title: string
  description?: string
  type: string
  timeLimit?: number | null
  attempts?: number | null
  passingScore: number
  isPublished: boolean
  releaseScores?: boolean
  scoresReleasedAt?: string | Date | null
  courseId: string
  course?: { id: string; title: string; category?: string | null }
  _count?: { questions: number; results: number }
  results?: { score: number; passed: boolean }[]
}

const GROUPS = [
  {
    type: "REVIEWER",
    label: "Reviewer",
    subtitle: "Open-book study aid — retake as many times as you need",
    icon: BookOpen,
    gradient: "from-sky-500 to-cyan-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    badge: "bg-sky-100 text-sky-700",
    pill: "bg-sky-500",
  },
  {
    type: "PRACTICE_EXAM",
    label: "Practice Exam",
    subtitle: "Timed drill to prepare for the real thing — retakable",
    icon: FlaskConical,
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    badge: "bg-violet-100 text-violet-700",
    pill: "bg-violet-500",
  },
  {
    type: "RULES_GUIDELINES",
    label: "Rules & Guidelines",
    subtitle: "Read and acknowledge exam rules before proceeding",
    icon: ScrollText,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
    badge: "bg-amber-100 text-amber-700",
    pill: "bg-amber-500",
  },
  {
    type: "FINAL_EXAM",
    label: "Final Examination",
    subtitle: "Graded exam — passing earns your certificate",
    icon: Trophy,
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    badge: "bg-rose-100 text-rose-700",
    pill: "bg-rose-500",
  },
]

const PROGRAMS = [
  {
    key: "CFMS",
    label: "CFMS",
    fullName: "Certificate in Financial Management Services",
    icon: BarChart3,
    gradient: "from-emerald-600 to-teal-700",
    lightBg: "bg-emerald-50",
    border: "border-emerald-100",
    accent: "text-emerald-700",
  },
  {
    key: "CMMS",
    label: "CMMS",
    fullName: "Certificate in Marketing Management Services",
    icon: Building2,
    gradient: "from-blue-600 to-indigo-700",
    lightBg: "bg-blue-50",
    border: "border-blue-100",
    accent: "text-blue-700",
  },
  {
    key: "COMS",
    label: "COMS",
    fullName: "Certificate in Operations Management Services",
    icon: Wrench,
    gradient: "from-orange-500 to-amber-600",
    lightBg: "bg-orange-50",
    border: "border-orange-100",
    accent: "text-orange-700",
  },
]

function AssessmentCard({ a, role, groupBadge, onTogglePublish, onDelete }: { a: Assessment; role?: string; groupBadge: string; onTogglePublish?: (id: string, current: boolean) => void; onDelete?: (id: string) => void }) {
  const myResult = a.results?.[0]
  const isUnlimited = a.type === "REVIEWER" || a.type === "PRACTICE_EXAM"
  const isFinal = a.type === "FINAL_EXAM"

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${isFinal ? "from-rose-500 to-pink-600" : "from-gray-400 to-gray-500"} flex items-center justify-center shrink-0`}>
          <ClipboardCheck className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{a.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {a.course && <span className="text-xs text-gray-400">{a.course.title}</span>}
            {a.timeLimit && (
              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                <Clock className="h-3 w-3" />{a.timeLimit} min
              </span>
            )}
            {isUnlimited && (
              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                <RotateCcw className="h-3 w-3" />Unlimited retakes
              </span>
            )}
            {isFinal && a.attempts && (
              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                <Lock className="h-3 w-3" />{a.attempts} attempt{a.attempts > 1 ? "s" : ""}
              </span>
            )}
            <span className="text-xs text-gray-400">{a._count?.questions ?? 0} questions</span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${a.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
              {a.isPublished ? "Published" : "Draft"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-3">
        {role === "learner" && myResult && (
          myResult.score === null || (myResult as any).scoresPending ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-100">
              <Clock className="h-3 w-3 animate-pulse" />
              Pending Release
            </span>
          ) : (
            <span className={`flex items-center gap-1 text-xs font-bold ${myResult.passed ? "text-emerald-600" : "text-red-500"}`}>
              {myResult.passed ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              {myResult.score?.toFixed(0)}%
            </span>
          )
        )}
        {role === "learner" && !myResult && (
          <span className="text-xs text-gray-400">Not taken</span>
        )}
        {role !== "learner" && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTogglePublish?.(a.id, a.isPublished)}
              className={`rounded-xl text-xs ${a.isPublished ? "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}
            >
              {a.isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs border-gray-200 hover:border-emerald-400 hover:text-emerald-600">
              <Link href={`/dashboard/assessments/${a.id}/manage`}>
                Manage
              </Link>
            </Button>
            {isFinal && (
              <Button asChild size="sm" variant="outline" className="rounded-xl border-blue-200 text-xs text-blue-700 hover:bg-blue-50">
                <Link href={`/dashboard/assessments/${a.id}/manage?motionTest=1`}>
                  <FlaskConical className="mr-1 h-3.5 w-3.5" /> Test Motion
                </Link>
              </Button>
            )}
            <Button
              size="icon"
              variant="outline"
              onClick={() => onDelete?.(a.id)}
              className="rounded-xl h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border-gray-200 shrink-0"
              title="Delete Assessment"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button asChild size="sm" className={`rounded-xl text-xs ${isFinal ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}>
          <Link href={`/dashboard/assessments/${a.id}/take`}>
            {role === "learner" ? (isFinal ? "Take Exam" : "Start") : "Preview"}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function AssessmentsPage() {
  const { data: session } = useSession()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "REVIEWER",
    courseId: "",
    timeLimit: "",
    passingScore: "70",
    attempts: "1",
    releaseScores: true,
    scoresReleasedAt: "",
  })
  const [saving, setSaving] = useState(false)

  const role = session?.user?.role?.toLowerCase()

  useEffect(() => {
    Promise.all([
      fetch("/api/assessments?limit=200").then(r => r.json()),
      fetch("/api/courses?limit=200").then(r => r.json()),
    ]).then(([a, c]) => {
      setAssessments(Array.isArray(a) ? a : Array.isArray(a?.data) ? a.data : [])
      setCourses(Array.isArray(c) ? c : Array.isArray(c?.data) ? c.data : [])
    }).finally(() => setLoading(false))
  }, [])

  const handleTogglePublish = async (id: string, currentPublished: boolean) => {
    const res = await fetch(`/api/assessments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !currentPublished }),
    })
    if (res.ok) {
      setAssessments(prev => prev.map(a => a.id === id ? { ...a, isPublished: !currentPublished } : a))
    }
  }

  const handleDeleteAssessment = async (id: string) => {
    const item = assessments.find(x => x.id === id)
    if (!item) return
    if (!confirm(`Are you sure you want to delete "${item.title}"? This will permanently delete this assessment, all its questions, and all learners' results. This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/assessments/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setAssessments(prev => prev.filter(x => x.id !== id))
      } else {
        alert("Failed to delete assessment. Please try again.")
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred while deleting the assessment.")
    }
  }

  const handleCreate = async () => {
    setSaving(true)
    const isUnlimited = form.type === "REVIEWER" || form.type === "PRACTICE_EXAM"
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        timeLimit: form.timeLimit ? parseInt(form.timeLimit) : null,
        passingScore: parseFloat(form.passingScore),
        attempts: isUnlimited ? null : parseInt(form.attempts),
        releaseScores: form.releaseScores,
        scoresReleasedAt: form.releaseScores ? null : (form.scoresReleasedAt ? new Date(form.scoresReleasedAt) : null),
      }),
    })
    if (res.ok) {
      const newA = await res.json()
      setAssessments(prev => [newA, ...prev])
      setOpen(false)
      setForm({
        title: "",
        description: "",
        type: "REVIEWER",
        courseId: "",
        timeLimit: "",
        passingScore: "70",
        attempts: "1",
        releaseScores: true,
        scoresReleasedAt: "",
      })
    }
    setSaving(false)
  }

  const isUnlimitedType = form.type === "REVIEWER" || form.type === "PRACTICE_EXAM"

  // Filter courses by selected program for the create dialog
  const programCourses = selectedProgram
    ? courses.filter(c => c.category === selectedProgram)
    : courses

  // Assessments for the selected program
  const programAssessments = selectedProgram
    ? assessments.filter(a => a.course?.category === selectedProgram || courses.find(c => c.id === a.courseId)?.category === selectedProgram)
    : assessments

  const activeProgram = PROGRAMS.find(p => p.key === selectedProgram)

  // ── LEVEL 1: Program selection ──────────────────────────
  if (!selectedProgram) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="text-sm text-gray-500 mt-1">Select a program to view its assessments</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROGRAMS.map((prog) => {
              const Icon = prog.icon
              const progAssessments = assessments.filter(a =>
                courses.find(c => c.id === a.courseId)?.category === prog.key
              )
              const finalCount = progAssessments.filter(a => a.type === "FINAL_EXAM").length
              const practiceCount = progAssessments.filter(a => a.type === "PRACTICE_EXAM" || a.type === "REVIEWER").length

              return (
                <button
                  key={prog.key}
                  onClick={() => setSelectedProgram(prog.key)}
                  className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  {/* Top gradient band */}
                  <div className={`bg-gradient-to-r ${prog.gradient} px-6 pt-8 pb-6`}>
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">{prog.label}</h2>
                    <p className="text-sm text-white/75 mt-1 leading-snug">{prog.fullName}</p>
                  </div>

                  {/* Stats row */}
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xl font-black text-gray-900">{progAssessments.length}</p>
                          <p className="text-xs text-gray-400 font-medium">Total</p>
                        </div>
                        <div className="h-8 w-px bg-gray-100" />
                        <div className="text-center">
                          <p className="text-xl font-black text-gray-900">{practiceCount}</p>
                          <p className="text-xs text-gray-400 font-medium">Practice</p>
                        </div>
                        <div className="h-8 w-px bg-gray-100" />
                        <div className="text-center">
                          <p className="text-xl font-black text-gray-900">{finalCount}</p>
                          <p className="text-xs text-gray-400 font-medium">Final</p>
                        </div>
                      </div>
                    </div>
                    <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${prog.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <ChevronRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── LEVEL 2: 4 sections for selected program ────────────
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedProgram(null)}
            className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{activeProgram?.label}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${activeProgram?.lightBg} ${activeProgram?.accent}`}>
                {activeProgram?.fullName}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {programAssessments.length} assessment{programAssessments.length !== 1 ? "s" : ""} across 4 categories
            </p>
          </div>
        </div>

        {role !== "learner" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                <Plus className="h-4 w-4 mr-2" /> New Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle>Create Assessment — {activeProgram?.label}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input placeholder="e.g. Module 1 Reviewer" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REVIEWER">Reviewer</SelectItem>
                      <SelectItem value="PRACTICE_EXAM">Practice Exam</SelectItem>
                      <SelectItem value="RULES_GUIDELINES">Rules & Guidelines</SelectItem>
                      <SelectItem value="FINAL_EXAM">Final Examination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Course</Label>
                  <Select value={form.courseId} onValueChange={v => setForm(p => ({ ...p, courseId: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {programCourses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 {form.type !== "REVIEWER" && form.type !== "RULES_GUIDELINES" && (
                   <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Time Limit (min)</Label>
                      <Input type="number" placeholder="No limit" value={form.timeLimit} onChange={e => setForm(p => ({ ...p, timeLimit: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Passing Score (%)</Label>
                      <Input type="number" value={form.passingScore} onChange={e => setForm(p => ({ ...p, passingScore: e.target.value }))} className="rounded-xl" />
                    </div>
                  </div>
                 )}
                {!isUnlimitedType && (
                  <div className="space-y-1.5">
                    <Label>Max Attempts</Label>
                    <Input type="number" min="1" value={form.attempts} onChange={e => setForm(p => ({ ...p, attempts: e.target.value }))} className="rounded-xl" />
                  </div>
                )}
                {isUnlimitedType && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
                    <RotateCcw className="h-3.5 w-3.5" /> Unlimited retakes for this type
                  </div>
                )}
                {/* Score Release Policy settings */}
                {form.type !== "REVIEWER" && (
                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score Release Policy</p>
                    
                    <div className="flex items-center justify-between gap-4">
                      <Label className="flex flex-col gap-0.5 cursor-pointer">
                        <span className="font-semibold text-xs text-gray-800">Release Scores Immediately</span>
                        <span className="text-[10px] text-gray-400 font-normal leading-tight">Show results to learners immediately upon completing the exam</span>
                      </Label>
                      <Checkbox
                        checked={form.releaseScores}
                        onCheckedChange={(v) => setForm(p => ({ ...p, releaseScores: !!v }))}
                      />
                    </div>

                    {!form.releaseScores && (
                      <div className="space-y-1.5 pt-2.5 border-t border-slate-200/50">
                        <Label className="text-xs text-gray-600">Scheduled Release Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={form.scoresReleasedAt}
                          onChange={(e) => setForm(p => ({ ...p, scoresReleasedAt: e.target.value }))}
                          className="rounded-xl h-9 text-xs"
                        />
                        <p className="text-[9px] text-gray-400 leading-snug">
                          Leave blank to only release results manually. Learners will see a "Pending Release" screen.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <RichTextEditor
                    value={form.description}
                    onChange={description => setForm(previous => ({ ...previous, description }))}
                    placeholder="Add instructions, preparation notes, or exam details..."
                    maxLength={5000}
                    minHeight="140px"
                  />
                </div>
                <Button onClick={handleCreate} disabled={saving || !form.title || !form.courseId} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create Assessment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 4 group cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {GROUPS.map((group) => {
          const Icon = group.icon
          const items = programAssessments.filter(a => a.type === group.type)
          return (
            <div key={group.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              {/* Card header */}
              <div className={`bg-gradient-to-r ${group.gradient} px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white leading-tight">{group.label}</h2>
                    <p className="text-xs text-white/70 mt-0.5">{group.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {group.type === "FINAL_EXAM" && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-white bg-white/20 px-2.5 py-1 rounded-lg">
                      <ShieldCheck className="h-3 w-3" /> Certificate
                    </div>
                  )}
                  <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="flex-1 divide-y divide-gray-50">
                {items.length > 0 ? items.map(a => (
                  <AssessmentCard key={a.id} a={a} role={role} groupBadge={group.badge} onTogglePublish={handleTogglePublish} onDelete={handleDeleteAssessment} />
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${group.gradient} opacity-10 flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">
                      {role === "learner"
                        ? `No ${group.label.toLowerCase()} available yet`
                        : `No ${group.label.toLowerCase()} yet`}
                    </p>
                    {role !== "learner" && (
                      <p className="text-xs text-gray-300 mt-1">Click "New Assessment" to create one</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
