"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Users, 
  Clock, 
  BookOpen,
  TrendingUp,
  CheckCircle,
  Loader2,
  GraduationCap,
  Globe,
  EyeOff,
  Archive,
  ClipboardCheck,
  FlaskConical,
  ScrollText,
  Trophy,
  ShieldCheck,
  RotateCcw,
  Lock,
  ChevronRight,
  ChevronLeft,
  Building2,
  Wrench,
  BarChart3,
  Trash2,
  AlertCircle,
  PlayCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { PaginationControls } from "@/components/ui/pagination-controls"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Course {
  id: string
  title: string
  description: string
  category: string
  level: string
  duration: string
  status: string
  thumbnail?: string
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  instructor: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  _count: {
    enrollments: number
    modules: number
    assessments: number
  }
}

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

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const GROUPS = [
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
    fullName: "Certified Financial Management Specialist",
    icon: BarChart3,
    gradient: "from-emerald-600 to-teal-700",
    lightBg: "bg-emerald-50",
    border: "border-emerald-100",
    accent: "text-emerald-700",
  },
  {
    key: "CMMS",
    label: "CMMS",
    fullName: "Certified Marketing Management Specialist",
    icon: Building2,
    gradient: "from-blue-600 to-indigo-700",
    lightBg: "bg-blue-50",
    border: "border-blue-100",
    accent: "text-blue-700",
  },
  {
    key: "COMS",
    label: "COMS",
    fullName: "Certified Operational Management Specialist",
    icon: Wrench,
    gradient: "from-orange-500 to-amber-600",
    lightBg: "bg-orange-50",
    border: "border-orange-100",
    accent: "text-orange-700",
  },
]

// ═══════════════════════════════════════════════════════════════
// ASSESSMENT CARD SUB-COMPONENT
// ═══════════════════════════════════════════════════════════════

function AssessmentCard({ a, role, groupBadge, onTogglePublish, onDelete }: { a: Assessment; role?: string; groupBadge: string; onTogglePublish?: (id: string, current: boolean) => void; onDelete?: (id: string) => void }) {
  const myResult = a.results?.[0]
  const isUnlimited = a.type === "PRACTICE_EXAM"
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

// ═══════════════════════════════════════════════════════════════
// TAB BAR COMPONENT
// ═══════════════════════════════════════════════════════════════

function TabBar({ activeTab, onTabChange }: { activeTab: "courses" | "assessments"; onTabChange: (tab: "courses" | "assessments") => void }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-2xl w-fit">
      <button
        onClick={() => onTabChange("courses")}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
          activeTab === "courses"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <BookOpen className="h-4 w-4" />
        Courses
      </button>
      <button
        onClick={() => onTabChange("assessments")}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
          activeTab === "assessments"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <ClipboardCheck className="h-4 w-4" />
        Assessments
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function CoursesAndAssessmentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const role = session?.user?.role?.toLowerCase()

  // ── Tab state ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"courses" | "assessments">("courses")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      if (tab === "assessments" || tab === "courses") {
        setActiveTab(tab)
      }
    }
  }, [])

  const handleTabChange = (tab: "courses" | "assessments") => {
    setActiveTab(tab)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", tab)
      window.history.replaceState(null, "", url.toString())
    }
  }

  // ── Courses state ─────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("ALL")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [learnerEnrollments, setLearnerEnrollments] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [dbStats, setDbStats] = useState({ total: 0, published: 0, enrollments: 0 })
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // ── Assessments state ─────────────────────────────────────
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [assessmentCourses, setAssessmentCourses] = useState<any[]>([])
  const [assessmentsLoading, setAssessmentsLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false)
  const [assessmentForm, setAssessmentForm] = useState({
    title: "",
    description: "",
    type: "PRACTICE_EXAM",
    courseId: "",
    timeLimit: "",
    passingScore: "70",
    attempts: "1",
    releaseScores: true,
    scoresReleasedAt: "",
  })
  const [assessmentSaving, setAssessmentSaving] = useState(false)
  const [assessmentError, setAssessmentError] = useState("")

  // ── Course fetching ───────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setPage(1)
  }, [filterCategory, filterStatus])

  const fetchCourses = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: (role === "learner" ? "50" : limit.toString()),
      })
      if (filterCategory && filterCategory !== "ALL") params.append("category", filterCategory)
      if (filterStatus && filterStatus !== "ALL") params.append("status", filterStatus)
      if (debouncedSearch) params.append("search", debouncedSearch)

      const response = await fetch(`/api/courses?${params.toString()}`)
      if (response.ok) {
        const json = await response.json()
        if (json.data) {
          setCourses(json.data)
          setTotal(json.total)
          setTotalPages(json.totalPages)
          if (json.stats) setDbStats(json.stats)
        }
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setCoursesLoading(false)
    }
  }, [page, limit, filterCategory, filterStatus, debouncedSearch, role])

  useEffect(() => {
    fetchCourses()
    if (role === "learner") {
      fetch("/api/enrollments").then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          setEnrolledIds(new Set(data.map((e: any) => e.courseId)))
          setLearnerEnrollments(data)
        }
      })
    }
  }, [fetchCourses, role, session])

  // ── Assessment fetching ───────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/assessments?limit=200").then(r => r.json()),
      fetch("/api/courses?limit=200").then(r => r.json()),
    ]).then(([a, c]) => {
      setAssessments(Array.isArray(a) ? a : Array.isArray(a?.data) ? a.data : [])
      setAssessmentCourses(Array.isArray(c) ? c : Array.isArray(c?.data) ? c.data : [])
    }).finally(() => setAssessmentsLoading(false))
  }, [])

  // ── Course handlers ───────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-800"
      case "DRAFT": return "bg-yellow-100 text-yellow-800"
      case "ARCHIVED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const stats = {
    totalCourses: dbStats.total,
    publishedCourses: dbStats.published,
    totalStudents: dbStats.enrollments,
  }

  const handlePublishToggle = async (courseId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: newStatus } : c))
    }
  }

  const handleArchive = async (courseId: string) => {
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ARCHIVED" }),
    })
    if (res.ok) {
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: "ARCHIVED" } : c))
    }
  }

  // ── Assessment handlers ───────────────────────────────────
  const handleAssessmentTogglePublish = async (id: string, currentPublished: boolean) => {
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

  // Filter courses by selected program for the create dialog
  const programCourses = selectedProgram
    ? assessmentCourses.filter((c: any) => c.category === selectedProgram)
    : assessmentCourses

  // Automatically pre-populate courseId whenever program is selected or dialog is open
  useEffect(() => {
    if (selectedProgram && programCourses.length > 0) {
      const defaultCourse = programCourses.find((c: any) => c.status === "PUBLISHED") || programCourses[0]
      if (defaultCourse && (!assessmentForm.courseId || !programCourses.some((c: any) => c.id === assessmentForm.courseId))) {
        setAssessmentForm((prev: any) => ({ ...prev, courseId: defaultCourse.id }))
      }
    }
  }, [selectedProgram, programCourses, assessmentForm.courseId])

  const handleCreateAssessment = async () => {
    setAssessmentSaving(true)
    setAssessmentError("")
    const isUnlimited = assessmentForm.type === "PRACTICE_EXAM"
    const targetCourseId = assessmentForm.courseId || programCourses.find((c: any) => c.status === "PUBLISHED")?.id || programCourses[0]?.id

    if (!targetCourseId) {
      setAssessmentError(`No course found under ${selectedProgram || "this program"}. Please create or publish the course first.`)
      setAssessmentSaving(false)
      return
    }

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...assessmentForm,
          courseId: targetCourseId,
          timeLimit: assessmentForm.timeLimit ? parseInt(assessmentForm.timeLimit) : null,
          passingScore: assessmentForm.passingScore ? parseFloat(assessmentForm.passingScore) : 70,
          attempts: isUnlimited ? null : (assessmentForm.attempts ? parseInt(assessmentForm.attempts) : 1),
          releaseScores: assessmentForm.releaseScores,
          scoresReleasedAt: assessmentForm.releaseScores ? null : (assessmentForm.scoresReleasedAt ? new Date(assessmentForm.scoresReleasedAt).toISOString() : null),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAssessmentError(data.error || "Failed to create assessment")
        return
      }
      setAssessments(prev => [data, ...prev])
      setAssessmentDialogOpen(false)
      setAssessmentForm({
        title: "",
        description: "",
        type: "PRACTICE_EXAM",
        courseId: targetCourseId,
        timeLimit: "",
        passingScore: "70",
        attempts: "1",
        releaseScores: true,
        scoresReleasedAt: "",
      })
    } catch {
      setAssessmentError("Failed to save assessment. Please check your connection and try again.")
    } finally {
      setAssessmentSaving(false)
    }
  }

  const isUnlimitedType = assessmentForm.type === "PRACTICE_EXAM"

  // Assessments for the selected program
  const programAssessments = selectedProgram
    ? assessments.filter(a => a.course?.category === selectedProgram || assessmentCourses.find((c: any) => c.id === a.courseId)?.category === selectedProgram)
    : assessments

  const activeProgram = PROGRAMS.find(p => p.key === selectedProgram)

  const isLoading = activeTab === "courses" ? coursesLoading : assessmentsLoading

  // ── Auto-select single enrolled program for learners ─────
  useEffect(() => {
    if (role === "learner" && assessments.length > 0 && selectedProgram === null) {
      const progKeys = Array.from(
        new Set(
          assessments
            .map(a => a.course?.category || assessmentCourses.find((c: any) => c.id === a.courseId)?.category)
            .filter(Boolean)
        )
      )
      if (progKeys.length === 1) {
        setSelectedProgram(progKeys[0] as string)
      }
    }
  }, [role, assessments, assessmentCourses])

  // ── Loading ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  // ── LEARNER VIEW ──────────────────────────────────────────
  if (role === "learner") {
    return (
      <div className="space-y-6">
        {/* Header + Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Courses & Assessments</h1>
            <p className="text-sm text-gray-500 mt-1">
              Access your enrolled certification courses, interactive modules, reviewers, and examinations
            </p>
          </div>
          <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {activeTab === "courses" ? (
          <LearnerCoursesContent
            courses={courses}
            enrollments={learnerEnrollments}
            loading={coursesLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            onGoToAssessments={(cat) => {
              if (cat) setSelectedProgram(cat)
              handleTabChange("assessments")
            }}
          />
        ) : (
          <LearnerAssessmentsContent
            assessments={assessments}
            assessmentCourses={assessmentCourses}
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            role={role}
          />
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ADMIN / INSTRUCTOR VIEW
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Courses & Assessments</h1>
          <p className="text-gray-600">Manage your courses and assessments in one place</p>
        </div>
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* ════════════ COURSES TAB ════════════ */}
      {activeTab === "courses" && (
        <>
          {/* Create Course Button */}
          <div className="flex justify-end">
            <Link href="/dashboard/courses/create">
              <Button className="bg-cpace-600 hover:bg-cpace-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-8 w-8 text-cpace-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Courses</p>
                    <p className="text-2xl font-bold">{stats.totalCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-2xl font-bold">{stats.publishedCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    <SelectItem value="CFMS">CFMS</SelectItem>
                    <SelectItem value="CMMS">CMMS</SelectItem>
                    <SelectItem value="COMS">COMS</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Courses Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>
                Manage your course content and track performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || (filterCategory !== "ALL") || (filterStatus !== "ALL") 
                      ? "Try adjusting your search or filters" 
                      : "Get started by creating your first course"}
                  </p>
                  {!searchTerm && filterCategory === "ALL" && filterStatus === "ALL" && (
                    <Link href="/dashboard/courses/create">
                      <Button className="bg-cpace-600 hover:bg-cpace-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Course
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Modules</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id} className="hover:bg-gray-50/80 transition-colors">
                          <TableCell className="max-w-md py-4">
                            <div>
                              <div className="font-semibold text-gray-900">{course.title}</div>
                              <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                {course.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">{course.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1.5 text-sm font-medium text-emerald-700">
                              <BookOpen className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>{course._count.modules} modules</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1.5 text-sm text-gray-600">
                              <Users className="h-4 w-4 text-gray-400 shrink-0" />
                              <span>{course._count.enrollments}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(course.status)}>
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                            {new Date(course.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 shrink-0">
                                <Link href={`/dashboard/courses/${course.id}/edit`}>
                                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                                  Edit Modules
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/courses/${course.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Course
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/courses/${course.id}/edit`}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Full Course Editor
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/courses/${course.id}/participants`}>
                                      <Users className="mr-2 h-4 w-4" />
                                      Participants
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handlePublishToggle(course.id, course.status)}>
                                    {course.status === "PUBLISHED"
                                      ? <><EyeOff className="mr-2 h-4 w-4" />Unpublish</>
                                      : <><Globe className="mr-2 h-4 w-4 text-emerald-600" />Publish</>
                                    }
                                  </DropdownMenuItem>
                                  {course.status !== "ARCHIVED" && (
                                    <DropdownMenuItem onClick={() => handleArchive(course.id)} className="text-gray-500">
                                      <Archive className="mr-2 h-4 w-4" />
                                      Archive
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    total={total}
                    limit={limit}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ════════════ ASSESSMENTS TAB ════════════ */}
      {activeTab === "assessments" && (
        <AdminAssessmentsContent
          assessments={assessments}
          assessmentCourses={assessmentCourses}
          selectedProgram={selectedProgram}
          setSelectedProgram={setSelectedProgram}
          activeProgram={activeProgram}
          programAssessments={programAssessments}
          programCourses={programCourses}
          role={role}
          assessmentDialogOpen={assessmentDialogOpen}
          setAssessmentDialogOpen={setAssessmentDialogOpen}
          assessmentForm={assessmentForm}
          setAssessmentForm={setAssessmentForm}
          assessmentSaving={assessmentSaving}
          assessmentError={assessmentError}
          setAssessmentError={setAssessmentError}
          isUnlimitedType={isUnlimitedType}
          handleCreateAssessment={handleCreateAssessment}
          handleAssessmentTogglePublish={handleAssessmentTogglePublish}
          handleDeleteAssessment={handleDeleteAssessment}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LEARNER COURSES CONTENT
// ═══════════════════════════════════════════════════════════════

function LearnerCoursesContent({
  courses,
  enrollments,
  loading,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  onGoToAssessments,
}: {
  courses: Course[]
  enrollments: any[]
  loading: boolean
  searchTerm: string
  setSearchTerm: (s: string) => void
  filterCategory: string
  setFilterCategory: (c: string) => void
  onGoToAssessments: (category?: string | null) => void
}) {
  const totalEnrolled = courses.length
  const totalModules = courses.reduce((acc, c) => acc + (c._count?.modules || 0), 0)
  const totalCompleted = enrollments.reduce((acc, e) => acc + (Array.isArray(e.completedModules) ? e.completedModules.length : 0), 0)
  const overallProgress = totalEnrolled > 0
    ? Math.round(courses.reduce((acc, c) => {
        const e = enrollments.find((item: any) => item.courseId === c.id)
        return acc + (e?.progress || 0)
      }, 0) / totalEnrolled)
    : 0

  const programs = [
    { key: "ALL", label: "All Programs" },
    ...PROGRAMS.map(p => ({ key: p.key, label: p.label })),
  ]

  return (
    <div className="space-y-6">
      {/* Learner Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enrolled Courses</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalEnrolled}</p>
            <p className="text-xs text-gray-500 mt-0.5">Active certification tracks</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Modules Completed</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">
              {totalCompleted} <span className="text-sm font-semibold text-gray-400">/ {totalModules}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Across all enrolled curriculums</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Average Progress</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{overallProgress}%</p>
            <p className="text-xs text-gray-500 mt-0.5">Overall learning track completion</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl overflow-x-auto w-full sm:w-auto">
          {programs.map((prog) => {
            const isActive = filterCategory === prog.key
            return (
              <button
                key={prog.key}
                type="button"
                onClick={() => setFilterCategory(prog.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {prog.label}
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search enrolled courses..."
            className="pl-9 h-10 rounded-xl bg-white border-gray-200 text-sm"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm space-y-4 max-w-xl mx-auto">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <BookOpen className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">No Enrolled Courses Found</h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || filterCategory !== "ALL"
                ? "No courses matched your search or selected program filter."
                : "You have not been assigned any courses yet. Please check back later or contact your administrator."}
            </p>
          </div>
          {(searchTerm || filterCategory !== "ALL") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setFilterCategory("ALL")
              }}
              className="rounded-xl text-xs"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const enrollment = enrollments.find((e: any) => e.courseId === course.id)
            const progress = typeof enrollment?.progress === "number" ? Math.round(enrollment.progress) : 0
            const completedCount = Array.isArray(enrollment?.completedModules) ? enrollment.completedModules.length : 0
            const totalCourseModules = course._count?.modules || 0
            const progInfo = PROGRAMS.find(p => p.key === course.category) || {
              key: course.category,
              label: course.category,
              fullName: course.title,
              icon: BookOpen,
              gradient: "from-emerald-600 to-teal-700",
              lightBg: "bg-emerald-50",
              border: "border-emerald-100",
              accent: "text-emerald-700",
            }
            const Icon = progInfo.icon

            return (
              <div
                key={course.id}
                className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Top Gradient Banner */}
                  <div className={`bg-gradient-to-r ${progInfo.gradient} p-5 text-white relative overflow-hidden`}>
                    <div className="flex items-center justify-between gap-3 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-white/80 block">
                            {progInfo.label} Certification
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white inline-block mt-0.5">
                            {course.level || "Professional"}
                          </span>
                        </div>
                      </div>

                      {progress === 100 ? (
                        <span className="flex items-center gap-1 text-xs font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-full shadow-sm">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Completed
                        </span>
                      ) : progress > 0 ? (
                        <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">
                          {progress}% Complete
                        </span>
                      ) : (
                        <span className="text-xs font-medium bg-black/20 text-white/90 px-2.5 py-1 rounded-full">
                          Enrolled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {course.description || "Master professional standards and practical competencies through structured interactive modules."}
                      </p>
                    </div>

                    {/* Metadata Chips */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                        <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="font-semibold text-gray-800">{totalCourseModules}</span>
                        <span className="text-gray-500">Modules</span>
                      </div>
                      {course.duration && (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-gray-700">{course.duration}</span>
                        </div>
                      )}
                      {course._count?.assessments > 0 && (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          <ClipboardCheck className="h-3.5 w-3.5 text-purple-600" />
                          <span className="font-semibold text-gray-800">{course._count.assessments}</span>
                          <span className="text-gray-500">Assessments</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Curriculum Progress</span>
                        <span className="font-bold text-gray-900">
                          {completedCount} of {totalCourseModules} completed ({progress}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress === 100
                              ? "bg-emerald-600"
                              : progress > 0
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : "bg-gray-200"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-5 sm:p-6 pt-0 space-y-2">
                  <Button
                    asChild
                    className={`w-full rounded-xl font-semibold shadow-sm transition-all duration-200 ${
                      progress === 100
                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    <Link href={`/dashboard/courses/${course.id}`}>
                      {progress === 100 ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Review Course Modules
                        </>
                      ) : progress > 0 ? (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Continue Learning
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Course
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </>
                      )}
                    </Link>
                  </Button>

                  {course._count?.assessments > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onGoToAssessments(course.category)}
                      className="w-full rounded-xl text-xs font-semibold text-gray-500 hover:text-emerald-700 hover:bg-emerald-50/60"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                      View Practice & Final Exams
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LEARNER ASSESSMENTS CONTENT
// ═══════════════════════════════════════════════════════════════

function LearnerAssessmentsContent({
  assessments, assessmentCourses, selectedProgram, setSelectedProgram, role,
}: {
  assessments: Assessment[]
  assessmentCourses: any[]
  selectedProgram: string | null
  setSelectedProgram: (p: string | null) => void
  role?: string
}) {
  const getProgramAssessments = (progKey: string) => {
    return assessments.filter(a =>
      (a.course?.category || assessmentCourses.find((c: any) => c.id === a.courseId)?.category) === progKey
    )
  }

  const enrolledPrograms = PROGRAMS.filter(prog => getProgramAssessments(prog.key).length > 0)
  const displayedPrograms = enrolledPrograms.length > 0 ? enrolledPrograms : PROGRAMS

  if (assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100">
        <ClipboardCheck className="h-12 w-12 text-gray-200 mb-3" />
        <p className="text-sm font-semibold text-gray-700">No practice or final assessments assigned yet</p>
        <p className="text-xs text-gray-400 mt-1">Contact your administrator if you expect access to a certification program</p>
      </div>
    )
  }

  if (!selectedProgram) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
          {displayedPrograms.map((prog) => {
            const Icon = prog.icon
            const progAssessments = getProgramAssessments(prog.key)
            const finalCount = progAssessments.filter(a => a.type === "FINAL_EXAM").length
            const practiceCount = progAssessments.filter(a => a.type === "PRACTICE_EXAM").length

            return (
              <button
                key={prog.key}
                onClick={() => setSelectedProgram(prog.key)}
                className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className={`bg-gradient-to-r ${prog.gradient} px-5 sm:px-6 pt-7 pb-5`}>
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{prog.label}</h2>
                  <p className="text-xs sm:text-sm text-white/75 mt-1 leading-snug">{prog.fullName}</p>
                </div>
                <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 xl:gap-4">
                      <div className="text-center">
                        <p className="text-lg sm:text-xl font-black text-gray-900">{progAssessments.length}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Total</p>
                      </div>
                      <div className="h-7 w-px bg-gray-100" />
                      <div className="text-center">
                        <p className="text-lg sm:text-xl font-black text-gray-900">{practiceCount}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Practice</p>
                      </div>
                      <div className="h-7 w-px bg-gray-100" />
                      <div className="text-center">
                        <p className="text-lg sm:text-xl font-black text-gray-900">{finalCount}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Final</p>
                      </div>
                    </div>
                  </div>
                  <div className={`h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl bg-gradient-to-br ${prog.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <ChevronRight className="h-4 w-4 text-white" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Level 2: Program selected
  const activeProgram = PROGRAMS.find(p => p.key === selectedProgram)
  const programAssessments = getProgramAssessments(selectedProgram)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSelectedProgram(null)}
          className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">{activeProgram?.label}</h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${activeProgram?.lightBg} ${activeProgram?.accent}`}>
              {activeProgram?.fullName}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {programAssessments.length} assessment{programAssessments.length !== 1 ? "s" : ""} across Practice &amp; Final Exam tracks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {GROUPS.map((group) => {
          const Icon = group.icon
          const items = programAssessments.filter(a => a.type === group.type)
          return (
            <div key={group.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
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
              <div className="flex-1 divide-y divide-gray-50">
                {items.length > 0 ? items.map(a => (
                  <AssessmentCard key={a.id} a={a} role={role} groupBadge={group.badge} />
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${group.gradient} opacity-10 flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">
                      No {group.label.toLowerCase()} available yet
                    </p>
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

// ═══════════════════════════════════════════════════════════════
// ADMIN / INSTRUCTOR ASSESSMENTS CONTENT
// ═══════════════════════════════════════════════════════════════

function AdminAssessmentsContent({
  assessments, assessmentCourses, selectedProgram, setSelectedProgram,
  activeProgram, programAssessments, programCourses, role,
  assessmentDialogOpen, setAssessmentDialogOpen,
  assessmentForm, setAssessmentForm, assessmentSaving,
  assessmentError, setAssessmentError,
  isUnlimitedType, handleCreateAssessment,
  handleAssessmentTogglePublish, handleDeleteAssessment,
}: {
  assessments: Assessment[]
  assessmentCourses: any[]
  selectedProgram: string | null
  setSelectedProgram: (p: string | null) => void
  activeProgram: typeof PROGRAMS[0] | undefined
  programAssessments: Assessment[]
  programCourses: any[]
  role?: string
  assessmentDialogOpen: boolean
  setAssessmentDialogOpen: (o: boolean) => void
  assessmentForm: any
  setAssessmentForm: (fn: any) => void
  assessmentSaving: boolean
  assessmentError: string
  setAssessmentError: (msg: string) => void
  isUnlimitedType: boolean
  handleCreateAssessment: () => Promise<void>
  handleAssessmentTogglePublish: (id: string, current: boolean) => Promise<void>
  handleDeleteAssessment: (id: string) => Promise<void>
}) {
  // Level 1: Program selection
  if (!selectedProgram) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-gray-500">Select a program to view its assessments</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROGRAMS.map((prog) => {
            const Icon = prog.icon
            const progAssessments = assessments.filter(a =>
              assessmentCourses.find((c: any) => c.id === a.courseId)?.category === prog.key
            )
            const finalCount = progAssessments.filter(a => a.type === "FINAL_EXAM").length
            const practiceCount = progAssessments.filter(a => a.type === "PRACTICE_EXAM").length

            return (
              <button
                key={prog.key}
                onClick={() => setSelectedProgram(prog.key)}
                className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className={`bg-gradient-to-r ${prog.gradient} px-6 pt-8 pb-6`}>
                  <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{prog.label}</h2>
                  <p className="text-sm text-white/75 mt-1 leading-snug">{prog.fullName}</p>
                </div>
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
      </div>
    )
  }

  // Level 2: Program selected — show group cards + create dialog
  const activeCourse = programCourses.find((c: any) => c.id === assessmentForm.courseId) || programCourses.find((c: any) => c.status === "PUBLISHED") || programCourses[0]

  return (
    <div className="space-y-6">
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
              <h2 className="text-xl font-bold text-gray-900">{activeProgram?.label}</h2>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${activeProgram?.lightBg} ${activeProgram?.accent}`}>
                {activeProgram?.fullName}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {programAssessments.length} assessment{programAssessments.length !== 1 ? "s" : ""} across Practice &amp; Final Exam tracks
            </p>
          </div>
        </div>

        <Dialog open={assessmentDialogOpen} onOpenChange={open => {
          setAssessmentDialogOpen(open)
          if (open) {
            setAssessmentError("")
            if (activeCourse && !assessmentForm.courseId) {
              setAssessmentForm((p: any) => ({ ...p, courseId: activeCourse.id }))
            }
          }
        }}>
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
                <Input placeholder="e.g. Comprehensive Practice Exam" value={assessmentForm.title} onChange={e => setAssessmentForm((p: any) => ({ ...p, title: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={assessmentForm.type} onValueChange={v => setAssessmentForm((p: any) => ({ ...p, type: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRACTICE_EXAM">Practice Exam</SelectItem>
                    <SelectItem value="FINAL_EXAM">Final Examination</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Program Course Binding */}
              <div className="space-y-1.5">
                <Label>Program Course</Label>
                {programCourses.length <= 1 ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {programCourses[0]?.title || activeProgram?.fullName || activeProgram?.label}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 ml-2">
                      Auto-assigned ({activeProgram?.label})
                    </Badge>
                  </div>
                ) : (
                  <Select
                    value={assessmentForm.courseId || activeCourse?.id}
                    onValueChange={v => setAssessmentForm((p: any) => ({ ...p, courseId: v }))}
                  >
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {programCourses.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title} {c.status === "DRAFT" ? "(Draft)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Time Limit (min)</Label>
                  <Input type="number" placeholder="No limit" value={assessmentForm.timeLimit} onChange={e => setAssessmentForm((p: any) => ({ ...p, timeLimit: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Passing Score (%)</Label>
                  <Input type="number" value={assessmentForm.passingScore} onChange={e => setAssessmentForm((p: any) => ({ ...p, passingScore: e.target.value }))} className="rounded-xl" />
                </div>
              </div>
              {!isUnlimitedType && (
                <div className="space-y-1.5">
                  <Label>Max Attempts</Label>
                  <Input type="number" min="1" value={assessmentForm.attempts} onChange={e => setAssessmentForm((p: any) => ({ ...p, attempts: e.target.value }))} className="rounded-xl" />
                </div>
              )}
              {isUnlimitedType && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
                  <RotateCcw className="h-3.5 w-3.5" /> Unlimited retakes for this type
                </div>
              )}
              {/* Score Release Policy settings */}
              {assessmentForm.type !== "REVIEWER" && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score Release Policy</p>
                  
                  <div className="flex items-center justify-between gap-4">
                    <Label className="flex flex-col gap-0.5 cursor-pointer">
                      <span className="font-semibold text-xs text-gray-800">Release Scores Immediately</span>
                      <span className="text-[10px] text-gray-400 font-normal leading-tight">Show results to learners immediately upon completing the exam</span>
                    </Label>
                    <Checkbox
                      checked={assessmentForm.releaseScores}
                      onCheckedChange={(v) => setAssessmentForm((p: any) => ({ ...p, releaseScores: !!v }))}
                    />
                  </div>

                  {!assessmentForm.releaseScores && (
                    <div className="space-y-1.5 pt-2.5 border-t border-slate-200/50">
                      <Label className="text-xs text-gray-600">Scheduled Release Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={assessmentForm.scoresReleasedAt}
                        onChange={(e) => setAssessmentForm((p: any) => ({ ...p, scoresReleasedAt: e.target.value }))}
                        className="rounded-xl h-9 text-xs"
                      />
                      <p className="text-[9px] text-gray-400 leading-snug">
                        Leave blank to only release results manually. Learners will see a &quot;Pending Release&quot; screen.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Description</Label>
                <RichTextEditor
                  value={assessmentForm.description}
                  onChange={description => setAssessmentForm((previous: any) => ({ ...previous, description }))}
                  placeholder="Add instructions, preparation notes, or exam details..."
                  maxLength={5000}
                  minHeight="140px"
                />
              </div>

              {assessmentError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{assessmentError}</span>
                </div>
              )}

              <Button
                onClick={handleCreateAssessment}
                disabled={assessmentSaving || !assessmentForm.title?.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {assessmentSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create Assessment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 4 group cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {GROUPS.map((group) => {
          const Icon = group.icon
          const items = programAssessments.filter(a => a.type === group.type)
          return (
            <div key={group.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
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
              <div className="flex-1 divide-y divide-gray-50">
                {items.length > 0 ? items.map(a => (
                  <AssessmentCard key={a.id} a={a} role={role} groupBadge={group.badge} onTogglePublish={handleAssessmentTogglePublish} onDelete={handleDeleteAssessment} />
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${group.gradient} opacity-10 flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">
                      No {group.label.toLowerCase()} yet
                    </p>
                    <p className="text-xs text-gray-300 mt-1">Click &quot;New Assessment&quot; to create one</p>
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
