"use client"

import { useState, useEffect } from "react"
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

// ═══════════════════════════════════════════════════════════════
// ASSESSMENT CARD SUB-COMPONENT
// ═══════════════════════════════════════════════════════════════

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

  // ── Courses state ─────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("ALL")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
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
    type: "REVIEWER",
    courseId: "",
    timeLimit: "",
    passingScore: "70",
    attempts: "1",
    releaseScores: true,
    scoresReleasedAt: "",
  })
  const [assessmentSaving, setAssessmentSaving] = useState(false)

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

  useEffect(() => {
    fetchCourses()
    if (role === "learner") {
      fetch("/api/enrollments").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setEnrolledIds(new Set(data.map((e: any) => e.courseId)))
      })
    }
  }, [filterCategory, filterStatus, role, page, limit, debouncedSearch, session])

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
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
  }

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

  const handleCreateAssessment = async () => {
    setAssessmentSaving(true)
    const isUnlimited = assessmentForm.type === "REVIEWER" || assessmentForm.type === "PRACTICE_EXAM"
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...assessmentForm,
        timeLimit: assessmentForm.timeLimit ? parseInt(assessmentForm.timeLimit) : null,
        passingScore: parseFloat(assessmentForm.passingScore),
        attempts: isUnlimited ? null : parseInt(assessmentForm.attempts),
        releaseScores: assessmentForm.releaseScores,
        scoresReleasedAt: assessmentForm.releaseScores ? null : (assessmentForm.scoresReleasedAt ? new Date(assessmentForm.scoresReleasedAt) : null),
      }),
    })
    if (res.ok) {
      const newA = await res.json()
      setAssessments(prev => [newA, ...prev])
      setAssessmentDialogOpen(false)
      setAssessmentForm({
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
    setAssessmentSaving(false)
  }

  const isUnlimitedType = assessmentForm.type === "REVIEWER" || assessmentForm.type === "PRACTICE_EXAM"

  // Filter courses by selected program for the create dialog
  const programCourses = selectedProgram
    ? assessmentCourses.filter((c: any) => c.category === selectedProgram)
    : assessmentCourses

  // Assessments for the selected program
  const programAssessments = selectedProgram
    ? assessments.filter(a => a.course?.category === selectedProgram || assessmentCourses.find((c: any) => c.id === a.courseId)?.category === selectedProgram)
    : assessments

  const activeProgram = PROGRAMS.find(p => p.key === selectedProgram)

  const isLoading = activeTab === "courses" ? coursesLoading : assessmentsLoading

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
    const enrolledCourses = courses.filter(c => enrolledIds.has(c.id))
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Learning</h1>
            <p className="text-sm text-gray-500 mt-1">Your courses and assessments</p>
          </div>
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* ── Courses Tab (Learner) ── */}
        {activeTab === "courses" && (
          <>
            {enrolledCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <BookOpen className="h-12 w-12 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-400">No courses assigned yet</p>
                <p className="text-xs text-gray-400 mt-1">Contact your administrator if you expect to have course access</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {enrolledCourses.map(course => {
                  const CATEGORY_COLORS: Record<string, string> = {
                    CFMS: "from-emerald-600 to-teal-700",
                    CMMS: "from-blue-600 to-indigo-700",
                    COMS: "from-orange-500 to-amber-600",
                  }
                  const gradient = CATEGORY_COLORS[course.category] ?? "from-gray-500 to-gray-600"
                  return (
                    <Link key={course.id} href={`/dashboard/courses/${course.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
                      <div className={`bg-gradient-to-r ${gradient} px-5 py-6`}>
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-bold text-white text-base leading-snug">{course.title}</h3>
                        <span className="text-xs text-white/70 mt-1 inline-block">{course.category}</span>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <p className="text-sm text-gray-500 line-clamp-2 flex-1">{course.description}</p>
                        <div className="flex items-center gap-3 mt-3 mb-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course._count.enrollments} learners</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2.5">
                          <CheckCircle className="h-4 w-4" /> Continue Learning
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Assessments Tab (Learner) ── */}
        {activeTab === "assessments" && (
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
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
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
                        <TableHead>Students</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{course.title}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {course.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{course.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>{course._count.enrollments}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(course.status)}>
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {new Date(course.updatedAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/courses/${course.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/courses/${course.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
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
  if (!selectedProgram) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROGRAMS.map((prog) => {
            const Icon = prog.icon
            const progAssessments = assessments.filter(a =>
              assessmentCourses.find((c: any) => c.id === a.courseId)?.category === prog.key
            )
            const finalCount = progAssessments.filter(a => a.type === "FINAL_EXAM").length
            const practiceCount = progAssessments.filter(a => a.type === "PRACTICE_EXAM" || a.type === "REVIEWER").length

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

  // Level 2: Program selected
  const activeProgram = PROGRAMS.find(p => p.key === selectedProgram)
  const programAssessments = assessments.filter(a =>
    a.course?.category === selectedProgram || assessmentCourses.find((c: any) => c.id === a.courseId)?.category === selectedProgram
  )

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
            {programAssessments.length} assessment{programAssessments.length !== 1 ? "s" : ""} across 4 categories
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
            const practiceCount = progAssessments.filter(a => a.type === "PRACTICE_EXAM" || a.type === "REVIEWER").length

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

  // Level 2: Program selected — show 4 group cards + create dialog
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
              {programAssessments.length} assessment{programAssessments.length !== 1 ? "s" : ""} across 4 categories
            </p>
          </div>
        </div>

        <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Assessment — {activeProgram?.label}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input placeholder="e.g. Module 1 Reviewer" value={assessmentForm.title} onChange={e => setAssessmentForm((p: any) => ({ ...p, title: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={assessmentForm.type} onValueChange={v => setAssessmentForm((p: any) => ({ ...p, type: v }))}>
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
                <Select value={assessmentForm.courseId} onValueChange={v => setAssessmentForm((p: any) => ({ ...p, courseId: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {programCourses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {assessmentForm.type !== "REVIEWER" && assessmentForm.type !== "RULES_GUIDELINES" && (
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
              )}
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
                <Input placeholder="Optional description" value={assessmentForm.description} onChange={e => setAssessmentForm((p: any) => ({ ...p, description: e.target.value }))} className="rounded-xl" />
              </div>
              <Button onClick={handleCreateAssessment} disabled={assessmentSaving || !assessmentForm.title || !assessmentForm.courseId} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
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
