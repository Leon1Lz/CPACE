"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical, BookOpen,
  Video, FileText, ChevronDown, ChevronUp, Loader2,
  CheckCircle, Eye, EyeOff, Globe, Clock, Edit3, ClipboardCheck, Settings,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { SafeHtml } from "@/components/ui/safe-html"

type Module = {
  id: string
  title: string
  description: string | null
  content: string | null
  videoUrl: string | null
  duration: number | null
  order: number
  isPublished: boolean
}

type CourseData = {
  id: string
  title: string
  description: string | null
  content: string | null
  category: string | null
  level: string | null
  duration: string | null
  status: string
  learningObjectives: string[]
}

const CATEGORIES = ["Marketing", "Finance", "Operations", "Management", "Technology", "Leadership", "Communication", "CFMS", "CMMS", "COMS"]
const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"]

export default function CourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()

  // ── Course state ──
  const [course, setCourse] = useState<CourseData | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [savingCourse, setSavingCourse] = useState(false)

  // ── Module state ──
  const [modules, setModules] = useState<Module[]>([])
  const [loadingModules, setLoadingModules] = useState(true)
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [savingModule, setSavingModule] = useState(false)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  // ── Assessment state ──
  const [assessments, setAssessments] = useState<any[]>([])
  const [loadingAssessments, setLoadingAssessments] = useState(true)
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<any | null>(null)
  const [savingAssessment, setSavingAssessment] = useState(false)

  // ── Assessment form ──
  const [assessmentForm, setAssessmentForm] = useState({
    title: "",
    description: "",
    type: "REVIEWER",
    timeLimit: "",
    passingScore: "70",
    attempts: "1",
    releaseScores: true,
    scoresReleasedAt: "",
  })

  // ── Module form ──
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    content: "",
    videoUrl: "",
    duration: "",
  })

  // ── Objectives ──
  const [objectives, setObjectives] = useState<string[]>([])
  const [newObjective, setNewObjective] = useState("")

  const role = session?.user?.role?.toLowerCase()

  useEffect(() => {
    if (role === "learner" || role === "proctor") { router.push("/dashboard"); return }

    Promise.all([
      fetch(`/api/courses/${id}`).then(r => r.json()),
      fetch(`/api/courses/${id}/modules`).then(r => r.json()),
      fetch(`/api/assessments?courseId=${id}&limit=100`).then(r => r.json()),
    ]).then(([courseData, moduleData, assessmentData]) => {
      if (courseData?.id) {
        setCourse(courseData)
        setObjectives(courseData.learningObjectives ?? [])
      }
      if (Array.isArray(moduleData)) setModules(moduleData)
      if (assessmentData?.data && Array.isArray(assessmentData.data)) setAssessments(assessmentData.data)
    }).finally(() => {
      setLoadingCourse(false)
      setLoadingModules(false)
      setLoadingAssessments(false)
    })
  }, [id, role, router])

  // ── Open assessment dialog ──
  const openAssessmentDialog = (ass?: any) => {
    if (ass) {
      setEditingAssessment(ass)
      setAssessmentForm({
        title: ass.title,
        description: ass.description ?? "",
        type: ass.type,
        timeLimit: ass.timeLimit?.toString() ?? "",
        passingScore: ass.passingScore?.toString() ?? "70",
        attempts: ass.attempts?.toString() ?? "1",
        releaseScores: ass.releaseScores !== false,
        scoresReleasedAt: ass.scoresReleasedAt ? new Date(ass.scoresReleasedAt).toISOString().slice(0, 16) : "",
      })
    } else {
      setEditingAssessment(null)
      setAssessmentForm({
        title: "",
        description: "",
        type: "REVIEWER",
        timeLimit: "",
        passingScore: "70",
        attempts: "1",
        releaseScores: true,
        scoresReleasedAt: "",
      })
    }
    setAssessmentDialogOpen(true)
  }

  // ── Save assessment ──
  const handleSaveAssessment = async () => {
    if (!assessmentForm.title.trim()) { toast.error("Title is required"); return }
    setSavingAssessment(true)
    try {
      const payload = {
        title: assessmentForm.title,
        description: assessmentForm.description,
        type: assessmentForm.type,
        timeLimit: assessmentForm.timeLimit ? parseInt(assessmentForm.timeLimit) : null,
        passingScore: parseFloat(assessmentForm.passingScore),
        attempts: (assessmentForm.type === "REVIEWER" || assessmentForm.type === "PRACTICE_EXAM" || assessmentForm.type === "RULES_GUIDELINES") ? null : parseInt(assessmentForm.attempts),
        releaseScores: assessmentForm.releaseScores,
        scoresReleasedAt: assessmentForm.releaseScores ? null : (assessmentForm.scoresReleasedAt ? new Date(assessmentForm.scoresReleasedAt) : null),
        courseId: id,
      }

      if (editingAssessment) {
        const res = await fetch(`/api/assessments/${editingAssessment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setAssessments(prev => prev.map(a => a.id === updated.id ? { ...updated, _count: editingAssessment._count } : a))
          toast.success("Assessment updated!")
          setAssessmentDialogOpen(false)
        } else { toast.error("Failed to update assessment") }
      } else {
        const res = await fetch(`/api/assessments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = await res.json()
          setAssessments(prev => [{ ...created, _count: { questions: 0, results: 0 } }, ...prev])
          toast.success("Assessment added!")
          setAssessmentDialogOpen(false)
        } else { toast.error("Failed to create assessment") }
      }
    } finally {
      setSavingAssessment(false)
    }
  }

  // ── Toggle assessment publish ──
  const handleToggleAssessmentPublish = async (ass: any) => {
    const res = await fetch(`/api/assessments/${ass.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !ass.isPublished }),
    })
    if (res.ok) {
      const updated = await res.json()
      setAssessments(prev => prev.map(a => a.id === updated.id ? { ...updated, _count: ass._count } : a))
      toast.success(updated.isPublished ? "Assessment published!" : "Assessment set to draft")
    } else {
      toast.error("Failed to update status")
    }
  }

  // ── Delete assessment ──
  const handleDeleteAssessment = async (assessmentId: string) => {
    const res = await fetch(`/api/assessments/${assessmentId}`, { method: "DELETE" })
    if (res.ok) {
      setAssessments(prev => prev.filter(a => a.id !== assessmentId))
      toast.success("Assessment deleted")
    } else {
      toast.error("Failed to delete assessment")
    }
  }

  // ── Save course details ──
  const handleSaveCourse = async () => {
    if (!course) return
    setSavingCourse(true)
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: course.title,
          description: course.description,
          content: course.content,
          category: course.category,
          level: course.level,
          duration: course.duration,
          learningObjectives: objectives,
        }),
      })
      if (res.ok) {
        toast.success("Course details saved!")
      } else {
        toast.error("Failed to save course")
      }
    } finally {
      setSavingCourse(false)
    }
  }

  // ── Publish toggle ──
  const handlePublish = async () => {
    if (!course) return
    const newStatus = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    const res = await fetch(`/api/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setCourse(prev => prev ? { ...prev, status: newStatus } : prev)
      toast.success(newStatus === "PUBLISHED" ? "Course published!" : "Course set to draft")
    }
  }

  // ── Open module dialog ──
  const openModuleDialog = (mod?: Module) => {
    if (mod) {
      setEditingModule(mod)
      setModuleForm({
        title: mod.title,
        description: mod.description ?? "",
        content: mod.content ?? "",
        videoUrl: mod.videoUrl ?? "",
        duration: mod.duration?.toString() ?? "",
      })
    } else {
      setEditingModule(null)
      setModuleForm({ title: "", description: "", content: "", videoUrl: "", duration: "" })
    }
    setModuleDialogOpen(true)
  }

  // ── Save module ──
  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) { toast.error("Title is required"); return }
    setSavingModule(true)
    try {
      if (editingModule) {
        // Update existing
        const res = await fetch(`/api/courses/${id}/modules`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleId: editingModule.id, ...moduleForm }),
        })
        if (res.ok) {
          const updated = await res.json()
          setModules(prev => prev.map(m => m.id === updated.id ? updated : m))
          toast.success("Module updated!")
          setModuleDialogOpen(false)
        } else { toast.error("Failed to update module") }
      } else {
        // Create new
        const res = await fetch(`/api/courses/${id}/modules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(moduleForm),
        })
        if (res.ok) {
          const created = await res.json()
          setModules(prev => [...prev, created])
          toast.success("Module added!")
          setModuleDialogOpen(false)
        } else { toast.error("Failed to create module") }
      }
    } finally {
      setSavingModule(false)
    }
  }

  // ── Delete module ──
  const handleDeleteModule = async (moduleId: string) => {
    const res = await fetch(`/api/courses/${id}/modules/${moduleId}`, { method: "DELETE" })
    if (res.ok) {
      setModules(prev => prev.filter(m => m.id !== moduleId))
      toast.success("Module deleted")
    } else {
      toast.error("Failed to delete module")
    }
  }

  // ── Toggle module publish ──
  const handleToggleModulePublish = async (mod: Module) => {
    const res = await fetch(`/api/courses/${id}/modules`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: mod.id, isPublished: !mod.isPublished }),
    })
    if (res.ok) {
      const updated = await res.json()
      setModules(prev => prev.map(m => m.id === updated.id ? updated : m))
    }
  }

  if (loadingCourse) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Course not found.</p>
        <Button asChild variant="outline" className="mt-4 rounded-xl" size="sm">
          <Link href="/dashboard/courses">← Back to Courses</Link>
        </Button>
      </div>
    )
  }

  const statusColor = course.status === "PUBLISHED"
    ? "bg-emerald-100 text-emerald-700"
    : course.status === "DRAFT"
    ? "bg-amber-100 text-amber-700"
    : "bg-gray-100 text-gray-600"

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-xl text-gray-500 hover:text-gray-700">
            <Link href="/dashboard/courses"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 line-clamp-1">{course.title}</h1>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColor}`}>{course.status}</span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">Edit course details and modules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href={`/dashboard/courses/${id}`}><Eye className="h-4 w-4 mr-1.5" />Preview</Link>
          </Button>
          <Button
            onClick={handlePublish}
            size="sm"
            variant={course.status === "PUBLISHED" ? "outline" : "default"}
            className={course.status === "PUBLISHED"
              ? "rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
              : "rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"}
          >
            {course.status === "PUBLISHED"
              ? <><EyeOff className="h-4 w-4 mr-1.5" />Unpublish</>
              : <><Globe className="h-4 w-4 mr-1.5" />Publish</>
            }
          </Button>
        </div>
      </div>

      {/* ── Course Details ── */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-600" /> Course Details
          </CardTitle>
          <CardDescription>Basic information about this course</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Course Title</Label>
              <Input
                value={course.title}
                onChange={e => setCourse(prev => prev ? { ...prev, title: e.target.value } : prev)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={course.description ?? ""}
                onChange={e => setCourse(prev => prev ? { ...prev, description: e.target.value } : prev)}
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={course.category ?? ""} onValueChange={v => setCourse(prev => prev ? { ...prev, category: v } : prev)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select value={course.level ?? ""} onValueChange={v => setCourse(prev => prev ? { ...prev, level: v } : prev)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Duration <span className="text-gray-400 font-normal">(e.g. "8 weeks", "40 hours")</span></Label>
              <Input
                value={course.duration ?? ""}
                onChange={e => setCourse(prev => prev ? { ...prev, duration: e.target.value } : prev)}
                placeholder="e.g. 8 weeks"
                className="rounded-xl"
              />
            </div>
          </div>

          <Separator className="bg-gray-100" />

          {/* Learning Objectives */}
          <div className="space-y-3">
            <Label>Learning Objectives</Label>
            <div className="flex gap-2">
              <Input
                value={newObjective}
                onChange={e => setNewObjective(e.target.value)}
                placeholder="Add a learning objective..."
                className="rounded-xl"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    if (newObjective.trim()) { setObjectives(prev => [...prev, newObjective.trim()]); setNewObjective("") }
                  }
                }}
              />
              <Button type="button" variant="outline" className="rounded-xl shrink-0" onClick={() => {
                if (newObjective.trim()) { setObjectives(prev => [...prev, newObjective.trim()]); setNewObjective("") }
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-gray-700 flex-1">{obj}</span>
                  <button onClick={() => setObjectives(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {objectives.length === 0 && <p className="text-sm text-gray-400 italic">No objectives added yet.</p>}
            </div>
          </div>

          <Separator className="bg-gray-100" />

          {/* Course Overview Rich Text */}
          <div className="space-y-2">
            <Label>Course Overview Content</Label>
            <p className="text-xs text-gray-400">This appears on the course listing page and introduction section.</p>
            <RichTextEditor
              value={course.content ?? ""}
              onChange={val => setCourse(prev => prev ? { ...prev, content: val } : prev)}
              placeholder="Write your course overview, prerequisites, and introductory content here..."
              minHeight="240px"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveCourse} disabled={savingCourse} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
              {savingCourse ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Course Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Modules ── */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" /> Course Modules
                <Badge variant="secondary" className="ml-1">{modules.length}</Badge>
              </CardTitle>
              <CardDescription className="mt-0.5">Build your lesson content with rich text, videos, and structured material</CardDescription>
            </div>
            <Button onClick={() => openModuleDialog()} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5">
              <Plus className="h-4 w-4" /> Add Module
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingModules ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
              <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-400">No modules yet</p>
              <p className="text-xs text-gray-300 mt-1">Add your first lesson module to get started</p>
              <Button onClick={() => openModuleDialog()} size="sm" variant="outline" className="mt-4 rounded-xl">
                <Plus className="h-4 w-4 mr-1.5" />Add First Module
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((mod, idx) => (
                <div key={mod.id} className="border border-gray-100 rounded-2xl overflow-hidden bg-white hover:border-gray-200 transition-colors">
                  {/* Module header row */}
                  <div className="flex items-center gap-3 p-4">
                    <GripVertical className="h-4 w-4 text-gray-300 shrink-0 cursor-grab" />
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-black shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900 truncate">{mod.title}</p>
                        {mod.videoUrl && <Video className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                        {mod.content && <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                      </div>
                      {mod.description && <p className="text-xs text-gray-400 truncate mt-0.5">{mod.description}</p>}
                    </div>
                    {mod.duration && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                        <Clock className="h-3 w-3" />{mod.duration} min
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${mod.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {mod.isPublished ? "Published" : "Draft"}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => openModuleDialog(mod)} title="Edit module">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleToggleModulePublish(mod)} title={mod.isPublished ? "Unpublish" : "Publish"}>
                        {mod.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Delete module">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Module?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{mod.title}&quot; and all its content. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteModule(mod.id)} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-gray-300 hover:text-gray-600" onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}>
                        {expandedModule === mod.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded preview */}
                  {expandedModule === mod.id && mod.content && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                      <SafeHtml
                        html={mod.content}
                        className="prose prose-sm max-w-none text-gray-600"
                        externalLinks
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Assessments ── */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-amber-500" /> Course Assessments
                <Badge variant="secondary" className="ml-1 bg-amber-50 text-amber-700">{assessments.length}</Badge>
              </CardTitle>
              <CardDescription className="mt-0.5">Manage tests, practice drills, and informational quizzes</CardDescription>
            </div>
            <Button onClick={() => openAssessmentDialog()} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5">
              <Plus className="h-4 w-4" /> Add Assessment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAssessments ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
              <ClipboardCheck className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-400">No assessments yet</p>
              <p className="text-xs text-gray-300 mt-1">Add your first assessment for this course</p>
              <Button onClick={() => openAssessmentDialog()} size="sm" variant="outline" className="mt-4 rounded-xl">
                <Plus className="h-4 w-4 mr-1.5" />Add First Assessment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.map((ass) => (
                <div key={ass.id} className="border border-gray-100 rounded-2xl overflow-hidden bg-white hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-black shrink-0">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900 truncate">{ass.title}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 shrink-0 uppercase tracking-wider">
                          {ass.type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          ({ass._count?.questions ?? 0} questions)
                        </span>
                      </div>
                      {ass.description && <p className="text-xs text-gray-400 truncate mt-0.5">{ass.description}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ass.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {ass.isPublished ? "Published" : "Draft"}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => openAssessmentDialog(ass)} title="Edit details">
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                      <Button asChild size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Manage questions">
                        <Link href={`/dashboard/assessments/${ass.id}/manage`}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleToggleAssessmentPublish(ass)} title={ass.isPublished ? "Unpublish" : "Publish"}>
                        {ass.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Delete assessment">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Assessment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{ass.title}&quot; and all its questions/results. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAssessment(ass.id)} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Module Edit Dialog ── */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingModule ? "Edit Module" : "Add New Module"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Module Title *</Label>
                <Input
                  value={moduleForm.title}
                  onChange={e => setModuleForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Introduction to Financial Statements"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Short Description <span className="text-gray-400 font-normal">(shown in module list)</span></Label>
                <Input
                  value={moduleForm.description}
                  onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief summary of this module..."
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Video URL <span className="text-gray-400 font-normal">(YouTube or direct link)</span></Label>
                <Input
                  value={moduleForm.videoUrl}
                  onChange={e => setModuleForm(p => ({ ...p, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estimated Duration <span className="text-gray-400 font-normal">(minutes)</span></Label>
                <Input
                  type="number"
                  value={moduleForm.duration}
                  onChange={e => setModuleForm(p => ({ ...p, duration: e.target.value }))}
                  placeholder="e.g. 15"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Module Content</Label>
              <p className="text-xs text-gray-400">Write the lesson content — use headings, lists, code blocks, and links.</p>
              <RichTextEditor
                value={moduleForm.content}
                onChange={val => setModuleForm(p => ({ ...p, content: val }))}
                placeholder="Write your lesson content here..."
                minHeight="300px"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveModule} disabled={savingModule} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2">
              {savingModule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingModule ? "Save Changes" : "Add Module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assessment Edit Dialog ── */}
      <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingAssessment ? "Edit Assessment" : "Add New Assessment"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Title *</Label>
                <Input
                  value={assessmentForm.title}
                  onChange={e => setAssessmentForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Midterm Drill / Final Certification"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Short Description</Label>
                <Textarea
                  value={assessmentForm.description}
                  onChange={e => setAssessmentForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief summary of what this assessment evaluates..."
                  rows={2}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Type</Label>
                <Select
                  value={assessmentForm.type}
                  onValueChange={v => setAssessmentForm(p => ({ ...p, type: v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REVIEWER">Reviewer (No limit/score rules)</SelectItem>
                    <SelectItem value="PRACTICE_EXAM">Practice Exam</SelectItem>
                    <SelectItem value="RULES_GUIDELINES">Rules & Guidelines (No limit/score rules)</SelectItem>
                    <SelectItem value="FINAL_EXAM">Final Examination</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {assessmentForm.type !== "REVIEWER" && assessmentForm.type !== "RULES_GUIDELINES" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Time Limit (minutes)</Label>
                    <Input
                      type="number"
                      value={assessmentForm.timeLimit}
                      onChange={e => setAssessmentForm(p => ({ ...p, timeLimit: e.target.value }))}
                      placeholder="e.g. 60 (blank for no limit)"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Passing Score (%)</Label>
                    <Input
                      type="number"
                      value={assessmentForm.passingScore}
                      onChange={e => setAssessmentForm(p => ({ ...p, passingScore: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                </>
              )}

              {assessmentForm.type !== "REVIEWER" && assessmentForm.type !== "PRACTICE_EXAM" && assessmentForm.type !== "RULES_GUIDELINES" && (
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Max Attempts</Label>
                  <Input
                    type="number"
                    min="1"
                    value={assessmentForm.attempts}
                    onChange={e => setAssessmentForm(p => ({ ...p, attempts: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Score release policy - hidden for Reviewers */}
            {assessmentForm.type !== "REVIEWER" && (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score Release Policy</p>
                <div className="flex items-center justify-between gap-4">
                  <Label className="flex flex-col gap-0.5 cursor-pointer">
                    <span className="font-semibold text-xs text-gray-800">Release Scores Immediately</span>
                    <span className="text-[10px] text-gray-400 font-normal leading-tight">Show results to learners immediately upon completing the exam</span>
                  </Label>
                  <input
                    type="checkbox"
                    checked={assessmentForm.releaseScores}
                    onChange={e => setAssessmentForm(p => ({ ...p, releaseScores: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                </div>

                {!assessmentForm.releaseScores && (
                  <div className="space-y-1.5 pt-2.5 border-t border-slate-200/50">
                    <Label className="text-xs text-gray-600">Scheduled Release Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={assessmentForm.scoresReleasedAt}
                      onChange={e => setAssessmentForm(p => ({ ...p, scoresReleasedAt: e.target.value }))}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssessmentDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveAssessment} disabled={savingAssessment} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-2">
              {savingAssessment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingAssessment ? "Save Changes" : "Add Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
