"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  Award,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  ImagePlus,
  Layers,
  ListChecks,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  certificationCourses,
  type CertificationCourse,
  type CertificationFaq,
  type QualificationCategory,
} from "@/data/certification-courses"
import { prepareArticleImage } from "@/lib/article-image-upload"

type EditableProgram = CertificationCourse & {
  id?: string
  isPublished?: boolean
  sortOrder?: number
}

const COLOR_THEMES = [
  {
    label: "Emerald & Teal (Default)",
    gradient: "from-emerald-600 to-teal-700",
    lightBg: "bg-emerald-50",
    lightText: "text-emerald-700",
    lightBorder: "border-emerald-200",
  },
  {
    label: "Teal & Emerald",
    gradient: "from-teal-600 to-emerald-700",
    lightBg: "bg-teal-50",
    lightText: "text-teal-700",
    lightBorder: "border-teal-200",
  },
  {
    label: "Blue & Indigo",
    gradient: "from-blue-600 to-indigo-700",
    lightBg: "bg-blue-50",
    lightText: "text-blue-700",
    lightBorder: "border-blue-200",
  },
  {
    label: "Amber & Orange",
    gradient: "from-amber-600 to-orange-700",
    lightBg: "bg-amber-50",
    lightText: "text-amber-700",
    lightBorder: "border-amber-200",
  },
  {
    label: "Purple & Violet",
    gradient: "from-purple-600 to-violet-700",
    lightBg: "bg-purple-50",
    lightText: "text-purple-700",
    lightBorder: "border-purple-200",
  },
]

const PRESET_CATEGORIES = [
  "Finance",
  "Marketing",
  "Operations",
  "Hospitality & Tourism",
  "HR & Labor Law",
  "Leadership & Management",
  "Information Technology",
]

const DEFAULT_QUALIFICATION_CATEGORIES: QualificationCategory[] = [
  {
    code: "Category A",
    title: "Graduates of Aligned Degree Programs",
    description:
      "Graduates of relevant bachelor's degree programs from a recognized Higher Education Institution (HEI).",
  },
  {
    code: "Category B",
    title: "Graduating College Students",
    description:
      "Graduating college students (4th Year / Graduating Status) currently completing their degree requirements in a relevant program.",
  },
  {
    code: "Category C",
    title: "Students Recommended by Partner Schools",
    description:
      "3rd-year or 4th-year students officially endorsed by their Dean, Program Chair, or Faculty Coordinator through an institutional partnership with CPACE Philippines.",
  },
  {
    code: "Category D",
    title: "Industry Practitioners & Career Shifters",
    description:
      "Graduates of any bachelor's degree with relevant work experience or a verifiable certificate of training in the field.",
  },
]

const DEFAULT_PROCESS_STEPS = [
  {
    step: "01",
    title: "Complete the Online Application",
    detail:
      "Fill out the official CPACE Certification Registration Form and select your preferred schedule.",
  },
  {
    step: "02",
    title: "Submit Qualifying Documents",
    detail:
      "Prepare and upload your valid ID, Transcript of Records (TOR) or Certificate of Candidacy for Graduation / Endorsement.",
  },
  {
    step: "03",
    title: "Settle the Certification Fee",
    detail:
      "Pay the learning investment and email your proof of payment to the program submission email.",
  },
  {
    step: "04",
    title: "Access Reviewer & Take the Exam",
    detail:
      "Receive your CPACE Learning Portal credentials, review the study guide, and complete the online assessment.",
  },
]

const DEFAULT_PILLARS = [
  {
    title: "Industry-Recognized Certification",
    description:
      "An industry-recognized credential from CPACE Philippines that validates your professional expertise and commitment to excellence.",
  },
  {
    title: "Online & In-Person Assessment",
    description:
      "Complete the assessment securely online through CPACE's Learning Management System (LMS) or via institutional schedules.",
  },
  {
    title: "Professional Development",
    description:
      "Earning this credential demonstrates continuous professional development and readiness for career advancement.",
  },
]

function createEmptyProgram(nextOrder: number): EditableProgram {
  return {
    slug: "",
    aliases: [],
    acronym: "",
    parenthesizedAcronym: "",
    fullName: "",
    category: "Finance",
    shortDescription: "",
    heroSubtitle: "",
    badgeImage: "/assets/badges/cfms-badge.png",
    gradient: "from-emerald-600 to-teal-700",
    lightBg: "bg-emerald-50",
    lightText: "text-emerald-700",
    lightBorder: "border-emerald-200",
    formats: "Online, In-person, Hybrid",
    highlights: [
      "Core Competency Assessment",
      "Digital Badge & Official Certificate",
      "CPACE Learning Portal Access",
    ],
    pillars: DEFAULT_PILLARS.map(p => ({ ...p })),
    examFormat: {
      overview:
        "An assessment exam of core professional knowledge conducted by the Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines).",
      duration: "2 Hours (120 Minutes)",
      questions: "120 Multiple-Choice Questions",
      passingMark: "75% Rating (A minimum score of 60 points is required to pass.)",
      validity: "Lifetime Validity (No renewal required)",
      authorization:
        "Examinees who pass and earn formal certification are authorized to use the official CPACE post-nominal credential.",
    },
    coverageTopics: [
      "Topic 1: Foundations & Core Principles",
      "Topic 2: Strategic Planning & Execution",
      "Topic 3: Operations & Performance Analysis",
      "Topic 4: Ethics, Compliance & Governance",
    ],
    processSteps: DEFAULT_PROCESS_STEPS.map(s => ({ ...s })),
    investment: "Php 1,680.00",
    submissionEmail: "info@cpaceph.com",
    registerUrl: "https://bit.ly/cpaceprograms",
    brochureUrl: "",
    qualificationCategories: DEFAULT_QUALIFICATION_CATEGORIES.map(q => ({ ...q })),
    faqs: [
      {
        question: "How is the assessment conducted?",
        answer:
          "The assessment is conducted online via the CPACE Learning Management System (LMS) or on-site for partner academic institutions.",
      },
    ],
    isPublished: true,
    sortOrder: nextOrder,
  }
}

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function ManageProgramsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editSlugParam = searchParams.get("edit")

  const [programs, setPrograms] = useState<EditableProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // Dialog & form state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<
    "general" | "enrollment" | "assessment" | "eligibility"
  >("general")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EditableProgram>(() => createEmptyProgram(1))
  const [customCategory, setCustomCategory] = useState("")
  const [badgeUploading, setBadgeUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [handledEditParam, setHandledEditParam] = useState<string | null>(null)

  const loadPrograms = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/certification-programs?includeDrafts=true")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setPrograms(data)
          return
        }
      }
      setPrograms(
        certificationCourses.map((course, idx) => ({
          ...course,
          id: course.slug,
          isPublished: true,
          sortOrder: idx + 1,
        }))
      )
    } catch {
      setPrograms(
        certificationCourses.map((course, idx) => ({
          ...course,
          id: course.slug,
          isPublished: true,
          sortOrder: idx + 1,
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== "loading" && session?.user.role !== "ADMIN") {
      router.replace("/dashboard")
    }
    if (session?.user.role === "ADMIN") {
      void loadPrograms()
    }
  }, [router, session, status])

  // Auto-open editor when navigated with ?edit=<slug>
  useEffect(() => {
    if (
      !loading &&
      editSlugParam &&
      programs.length > 0 &&
      handledEditParam !== editSlugParam
    ) {
      const target = programs.find(
        p =>
          p.slug.toLowerCase() === editSlugParam.toLowerCase() ||
          p.aliases?.includes(editSlugParam.toLowerCase())
      )
      if (target) {
        setHandledEditParam(editSlugParam)
        openEdit(target)
      }
    }
  }, [loading, editSlugParam, programs, handledEditParam])

  const handleSyncDefaults = async () => {
    try {
      setSyncing(true)
      setSyncMessage(null)
      const res = await fetch("/api/admin/sync-landing-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "programs" }),
      })
      if (res.ok) {
        const data = await res.json()
        setSyncMessage(
          `Synchronized ${data.programsSynced ?? 0} official certification programs with the database.`
        )
        await loadPrograms()
      }
    } catch (err) {
      console.error("Error syncing programs:", err)
    } finally {
      setSyncing(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setActiveTab("general")
    setCustomCategory("")
    setForm(createEmptyProgram(programs.length + 1))
    setError("")
    setDialogOpen(true)
  }

  const openEdit = (program: EditableProgram) => {
    setEditingId(program.id || program.slug)
    setActiveTab("general")
    const isPresetCat = PRESET_CATEGORIES.includes(program.category)
    setCustomCategory(isPresetCat ? "" : program.category)
    setForm({
      ...program,
      brochureUrl: program.brochureUrl || "",
      highlights:
        Array.isArray(program.highlights) && program.highlights.length > 0
          ? [...program.highlights]
          : [""],
      pillars:
        Array.isArray(program.pillars) && program.pillars.length > 0
          ? program.pillars.map(p => ({ ...p }))
          : DEFAULT_PILLARS.map(p => ({ ...p })),
      examFormat: {
        overview: program.examFormat?.overview || "",
        duration: program.examFormat?.duration || "",
        questions: program.examFormat?.questions || "",
        passingMark: program.examFormat?.passingMark || "",
        validity: program.examFormat?.validity || "",
        authorization: program.examFormat?.authorization || "",
      },
      coverageTopics:
        Array.isArray(program.coverageTopics) && program.coverageTopics.length > 0
          ? [...program.coverageTopics]
          : [""],
      processSteps:
        Array.isArray(program.processSteps) && program.processSteps.length > 0
          ? program.processSteps.map(s => ({ ...s }))
          : DEFAULT_PROCESS_STEPS.map(s => ({ ...s })),
      qualificationCategories:
        Array.isArray(program.qualificationCategories) &&
        program.qualificationCategories.length > 0
          ? program.qualificationCategories.map(q => ({ ...q }))
          : DEFAULT_QUALIFICATION_CATEGORIES.map(q => ({ ...q })),
      faqs:
        Array.isArray(program.faqs) && program.faqs.length > 0
          ? program.faqs.map(f => ({ ...f }))
          : [],
      isPublished: program.isPublished ?? true,
      sortOrder: program.sortOrder ?? 1,
    })
    setError("")
    setDialogOpen(true)
  }

  const handleBadgeUpload = async (file: File | undefined) => {
    if (!file) return
    setBadgeUploading(true)
    setError("")
    try {
      const dataUrl = await prepareArticleImage(file)
      setForm(prev => ({ ...prev, badgeImage: dataUrl }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process badge image")
    } finally {
      setBadgeUploading(false)
    }
  }

  const handleThemeSelect = (gradient: string) => {
    const matched = COLOR_THEMES.find(t => t.gradient === gradient)
    if (matched) {
      setForm(prev => ({
        ...prev,
        gradient: matched.gradient,
        lightBg: matched.lightBg,
        lightText: matched.lightText,
        lightBorder: matched.lightBorder,
      }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    const finalCategory = customCategory.trim() || form.category.trim()
    const cleanSlug = generateSlug(form.slug || form.acronym || form.fullName)

    if (!form.fullName.trim() || !cleanSlug || !form.acronym.trim() || !finalCategory) {
      setError("Program Full Name, URL Slug, Acronym, and Category are required.")
      setSaving(false)
      setActiveTab("general")
      return
    }

    const payload: EditableProgram = {
      ...form,
      slug: cleanSlug,
      category: finalCategory,
      parenthesizedAcronym:
        form.parenthesizedAcronym.trim() || `(${form.acronym.trim()})`,
      brochureUrl: form.brochureUrl?.trim() ? form.brochureUrl.trim() : undefined,
      highlights: form.highlights.map(h => h.trim()).filter(Boolean),
      coverageTopics: form.coverageTopics.map(t => t.trim()).filter(Boolean),
      pillars: form.pillars
        .map(p => ({ title: p.title.trim(), description: p.description.trim() }))
        .filter(p => p.title || p.description),
      processSteps: form.processSteps
        .map((s, idx) => ({
          step: s.step.trim() || String(idx + 1).padStart(2, "0"),
          title: s.title.trim(),
          detail: s.detail.trim(),
        }))
        .filter(s => s.title || s.detail),
      qualificationCategories: form.qualificationCategories.filter(
        q => q.title.trim() || q.description.trim()
      ),
      faqs: form.faqs
        .map(f => ({ question: f.question.trim(), answer: f.answer.trim() }))
        .filter(f => f.question && f.answer),
    }

    try {
      const url = editingId
        ? `/api/certification-programs/${editingId}`
        : "/api/certification-programs"
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Failed to save certification program")
        return
      }
      setDialogOpen(false)
      await loadPrograms()
    } catch {
      setError("Network error while saving certification program")
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (program: EditableProgram) => {
    const targetId = program.id || program.slug
    await fetch(`/api/certification-programs/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !(program.isPublished ?? true) }),
    })
    await loadPrograms()
  }

  const moveProgramOrder = async (program: EditableProgram, newOrder: number) => {
    const targetId = program.id || program.slug
    await fetch(`/api/certification-programs/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: newOrder }),
    })
    await loadPrograms()
  }

  const handleDelete = async (program: EditableProgram) => {
    if (
      !window.confirm(
        `Delete certification program "${program.fullName} (${program.acronym})"?`
      )
    )
      return
    const targetId = program.id || program.slug
    await fetch(`/api/certification-programs/${targetId}`, { method: "DELETE" })
    await loadPrograms()
  }

  const filteredPrograms = programs.filter(p => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.acronym.toLowerCase().includes(q) ||
      p.parenthesizedAcronym?.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    )
  })

  if (status === "loading") {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (session?.user.role !== "ADMIN") return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Award className="h-4 w-4" /> Website content
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">
            Certification Programs Editor
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Add new certification programs or edit pricing, exam details, coverage topics, eligibility categories, and FAQs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleSyncDefaults}
            disabled={syncing}
            className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 text-emerald-700 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync Default Programs"}
          </Button>
          <Button
            onClick={openCreate}
            className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Program
          </Button>
        </div>
      </div>

      {syncMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-xs font-bold text-emerald-700 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by program name, acronym, slug, or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Showing {filteredPrograms.length} of {programs.length} programs</span>
            <span>•</span>
            <Link
              href="/services#certifications"
              target="_blank"
              className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
            >
              View Public Page <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Programs Table */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-60 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Category & Formats</TableHead>
                  <TableHead>Fee & Email</TableHead>
                  <TableHead>Topics & FAQs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.map((program, idx) => {
                  const currentOrder = program.sortOrder ?? idx + 1
                  return (
                  <TableRow key={program.id || program.slug}>
                    <TableCell className="font-bold text-slate-600">
                      <div className="inline-flex items-center gap-1">
                        <span className="w-6 text-center">#{currentOrder}</span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveProgramOrder(program, Math.max(1, currentOrder - 1))}
                            title="Move up"
                            className="p-0.5 rounded hover:bg-slate-100 text-slate-500 hover:text-emerald-700 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === filteredPrograms.length - 1}
                            onClick={() => moveProgramOrder(program, currentOrder + 1)}
                            title="Move down"
                            className="p-0.5 rounded hover:bg-slate-100 text-slate-500 hover:text-emerald-700 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                          {program.badgeImage ? (
                            <Image
                              src={program.badgeImage}
                              alt={program.acronym}
                              width={36}
                              height={36}
                              className="object-contain w-full h-full"
                            />
                          ) : (
                            <Award className="w-5 h-5 text-emerald-700" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 truncate">
                              {program.fullName}
                            </p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {program.parenthesizedAcronym || program.acronym}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <code>/services/professional-certification/{program.slug}</code>
                            <Link
                              href={`/services/professional-certification/${program.slug}`}
                              target="_blank"
                              className="text-emerald-700 hover:underline inline-flex items-center gap-0.5 font-medium"
                            >
                              Preview <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {program.category}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">{program.formats}</p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <p className="font-bold text-slate-900">{program.investment}</p>
                      <p className="text-slate-500">{program.submissionEmail}</p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <p>{program.coverageTopics?.length || 0} coverage topics</p>
                      <p className="text-slate-400">{program.faqs?.length || 0} FAQs</p>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => togglePublish(program)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                          program.isPublished !== false
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {program.isPublished !== false ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                        {program.isPublished !== false ? "Published" : "Hidden"}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(program)}
                          title="Edit program"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(program)}
                          title="Delete program"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })}
                {filteredPrograms.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-sm text-slate-500"
                    >
                      No certification programs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 bg-slate-50/70">
            <DialogTitle className="text-xl font-black text-slate-900">
              {editingId
                ? `Edit Program — ${form.fullName || form.acronym}`
                : "Add New Certification Program"}
            </DialogTitle>
            <DialogDescription>
              Customize the program details, pricing, assessment format, exam coverage topics, eligibility categories, and FAQs.
            </DialogDescription>

            {/* Section Tabs */}
            <div className="flex flex-wrap gap-1.5 pt-3">
              {[
                { id: "general", label: "1. Identity & Badge", icon: Award },
                { id: "enrollment", label: "2. Pricing, Links & Highlights", icon: Mail },
                { id: "assessment", label: "3. Exam Format & Topics", icon: ListChecks },
                { id: "eligibility", label: "4. Eligibility, Steps & FAQs", icon: HelpCircle },
              ].map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            {/* TAB 1: IDENTITY & BADGE */}
            {activeTab === "general" && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">
                      Program Full Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Certified Financial Management Specialist"
                      value={form.fullName}
                      onChange={e => {
                        const nextName = e.target.value
                        setForm(prev => ({
                          ...prev,
                          fullName: nextName,
                          slug:
                            !editingId && (!prev.slug || prev.slug === generateSlug(prev.fullName))
                              ? generateSlug(nextName)
                              : prev.slug,
                        }))
                      }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Credential Acronym * (used on switcher tabs & badges)
                    </label>
                    <Input
                      required
                      placeholder="e.g. CFMS® or CHMS™"
                      value={form.acronym}
                      onChange={e => {
                        const val = e.target.value
                        setForm(prev => ({
                          ...prev,
                          acronym: val,
                          parenthesizedAcronym:
                            !prev.parenthesizedAcronym ||
                            prev.parenthesizedAcronym === `(${prev.acronym})`
                              ? val.endsWith("®")
                                ? `(${val.slice(0, -1)})®`
                                : val.endsWith("™")
                                  ? `(${val.slice(0, -1)})™`
                                  : `(${val})`
                              : prev.parenthesizedAcronym,
                        }))
                      }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Display Acronym with Parentheses * (shown after program title)
                    </label>
                    <Input
                      required
                      placeholder="e.g. (CFMS)® or (CHMS)™"
                      value={form.parenthesizedAcronym}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          parenthesizedAcronym: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      URL Slug * (e.g. <code>cfms</code>, <code>chms</code>)
                    </label>
                    <Input
                      required
                      placeholder="e.g. cfms"
                      value={form.slug}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          slug: generateSlug(e.target.value),
                        }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Delivery Formats *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Online, In-person, Hybrid"
                      value={form.formats}
                      onChange={e =>
                        setForm(prev => ({ ...prev, formats: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Category *
                    </label>
                    <Select
                      value={
                        PRESET_CATEGORIES.includes(form.category) && !customCategory
                          ? form.category
                          : "__custom__"
                      }
                      onValueChange={val => {
                        if (val === "__custom__") {
                          setCustomCategory(form.category)
                        } else {
                          setCustomCategory("")
                          setForm(prev => ({ ...prev, category: val }))
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRESET_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">Custom Category...</SelectItem>
                      </SelectContent>
                    </Select>
                    {(customCategory !== "" ||
                      !PRESET_CATEGORIES.includes(form.category)) && (
                      <Input
                        placeholder="Enter custom category name..."
                        value={customCategory || form.category}
                        onChange={e => {
                          setCustomCategory(e.target.value)
                          setForm(prev => ({ ...prev, category: e.target.value }))
                        }}
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Card Color Theme
                    </label>
                    <Select
                      value={form.gradient}
                      onValueChange={handleThemeSelect}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose color theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_THEMES.map(theme => (
                          <SelectItem key={theme.gradient} value={theme.gradient}>
                            {theme.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Badge Image Upload */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Official Program Badge / Seal Image
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-xs">
                      {form.badgeImage ? (
                        <Image
                          src={form.badgeImage}
                          alt="Badge preview"
                          width={64}
                          height={64}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <Award className="w-8 h-8 text-emerald-700" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          placeholder="/assets/badges/cfms-badge.png or https://..."
                          value={form.badgeImage}
                          onChange={e =>
                            setForm(prev => ({ ...prev, badgeImage: e.target.value }))
                          }
                          className="flex-1 bg-white"
                        />
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold cursor-pointer hover:bg-emerald-800 transition-colors shrink-0">
                          {badgeUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ImagePlus className="w-3.5 h-3.5" />
                          )}
                          {badgeUploading ? "Uploading..." : "Upload Badge"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleBadgeUpload(e.target.files?.[0])}
                          />
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Upload a transparent PNG/WebP badge or paste an existing badge path (e.g. <code>/assets/badges/cfms-badge.png</code>).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Descriptions */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Card Summary Description * (shown on the /services program card)
                    </label>
                    <Textarea
                      required
                      rows={3}
                      placeholder="Brief 1-2 sentence overview of the credential..."
                      value={form.shortDescription}
                      onChange={e =>
                        setForm(prev => ({ ...prev, shortDescription: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Detail Page Hero Subtitle * (shown at the top of the dedicated program page)
                    </label>
                    <Textarea
                      required
                      rows={3}
                      placeholder="Hero banner subtitle introducing the certification program..."
                      value={form.heroSubtitle}
                      onChange={e =>
                        setForm(prev => ({ ...prev, heroSubtitle: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Display Order
                    </label>
                    <Input
                      type="number"
                      value={form.sortOrder ?? 1}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          sortOrder: Number(e.target.value),
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id="program-published"
                      checked={form.isPublished !== false}
                      onCheckedChange={v =>
                        setForm(prev => ({ ...prev, isPublished: v === true }))
                      }
                    />
                    <label
                      htmlFor="program-published"
                      className="text-sm font-medium text-slate-700 cursor-pointer"
                    >
                      Published on public website
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRICING, LINKS & HIGHLIGHTS */}
            {activeTab === "enrollment" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Learning Investment / Fee *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Php 1,680.00 or Php 1,980.00"
                      value={form.investment}
                      onChange={e =>
                        setForm(prev => ({ ...prev, investment: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Document & Payment Submission Email *
                    </label>
                    <Input
                      required
                      placeholder="e.g. cfms@cpaceph.com"
                      value={form.submissionEmail}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          submissionEmail: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Registration Link (Register Here button) *
                    </label>
                    <Input
                      required
                      placeholder="e.g. https://bit.ly/cfmsbycpace"
                      value={form.registerUrl}
                      onChange={e =>
                        setForm(prev => ({ ...prev, registerUrl: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Brochure / Info Sheet Link (Optional)
                    </label>
                    <Input
                      placeholder="Leave blank to hide Download Brochure button"
                      value={form.brochureUrl || ""}
                      onChange={e =>
                        setForm(prev => ({ ...prev, brochureUrl: e.target.value }))
                      }
                      className="mt-1"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      If left empty, the &ldquo;Download Brochure / Info Sheet&rdquo; buttons are automatically hidden.
                    </p>
                  </div>
                </div>

                {/* Card Key Highlights */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Program Card Highlights (Key Areas)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Bullet points displayed on the program overview card on <code>/services</code>.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm(prev => ({
                          ...prev,
                          highlights: [...prev.highlights, ""],
                        }))
                      }
                      className="rounded-xl text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Highlight
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {form.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder={`Highlight #${idx + 1}`}
                          value={item}
                          onChange={e => {
                            const next = [...form.highlights]
                            next[idx] = e.target.value
                            setForm(prev => ({ ...prev, highlights: next }))
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 shrink-0"
                          onClick={() =>
                            setForm(prev => ({
                              ...prev,
                              highlights: prev.highlights.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3 Core Pillars */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      3 Feature Cards (Below Hero Banner)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      The three highlight cards displayed directly below the hero banner on the program detail page.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {form.pillars.map((pillar, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2"
                      >
                        <Input
                          placeholder={`Card #${idx + 1} Title`}
                          value={pillar.title}
                          onChange={e => {
                            const next = [...form.pillars]
                            next[idx] = { ...next[idx], title: e.target.value }
                            setForm(prev => ({ ...prev, pillars: next }))
                          }}
                          className="bg-white font-semibold"
                        />
                        <Textarea
                          rows={2}
                          placeholder={`Card #${idx + 1} Description`}
                          value={pillar.description}
                          onChange={e => {
                            const next = [...form.pillars]
                            next[idx] = { ...next[idx], description: e.target.value }
                            setForm(prev => ({ ...prev, pillars: next }))
                          }}
                          className="bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EXAM FORMAT & COVERAGE TOPICS */}
            {activeTab === "assessment" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
                  <p className="text-xs font-bold text-slate-800">
                    Assessment Structure & Format
                  </p>
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Overview Paragraph
                    </label>
                    <Textarea
                      rows={3}
                      value={form.examFormat.overview}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          examFormat: { ...prev.examFormat, overview: e.target.value },
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        Duration & Volume (supports multiple lines)
                      </label>
                      <Textarea
                        rows={2}
                        placeholder="e.g. 2 Hours (120 Minutes)"
                        value={form.examFormat.duration}
                        onChange={e =>
                          setForm(prev => ({
                            ...prev,
                            examFormat: { ...prev.examFormat, duration: e.target.value },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        Questions / Format Subtitle (Optional)
                      </label>
                      <Input
                        placeholder="e.g. 120 Multiple-Choice Questions"
                        value={form.examFormat.questions || ""}
                        onChange={e =>
                          setForm(prev => ({
                            ...prev,
                            examFormat: { ...prev.examFormat, questions: e.target.value },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        Passing Standard
                      </label>
                      <Input
                        placeholder="e.g. 75% Rating (A minimum score of 60 points is required to pass.)"
                        value={form.examFormat.passingMark}
                        onChange={e =>
                          setForm(prev => ({
                            ...prev,
                            examFormat: {
                              ...prev.examFormat,
                              passingMark: e.target.value,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        Credential Validity
                      </label>
                      <Input
                        placeholder="e.g. Lifetime Validity (No renewal required)"
                        value={form.examFormat.validity}
                        onChange={e =>
                          setForm(prev => ({
                            ...prev,
                            examFormat: { ...prev.examFormat, validity: e.target.value },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Post-Nominal Title Authorization Note
                    </label>
                    <Textarea
                      rows={2}
                      value={form.examFormat.authorization}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          examFormat: {
                            ...prev.examFormat,
                            authorization: e.target.value,
                          },
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Coverage Topics List */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Exam Coverage and Topics ({form.coverageTopics.length})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Add, edit, or remove subject areas covered by this program.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm(prev => ({
                          ...prev,
                          coverageTopics: [...prev.coverageTopics, ""],
                        }))
                      }
                      className="rounded-xl text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Topic
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {form.coverageTopics.map((topic, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400 w-6 text-right shrink-0">
                          {idx + 1}.
                        </span>
                        <Input
                          placeholder={`Topic #${idx + 1}`}
                          value={topic}
                          onChange={e => {
                            const next = [...form.coverageTopics]
                            next[idx] = e.target.value
                            setForm(prev => ({ ...prev, coverageTopics: next }))
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 shrink-0 px-2"
                          onClick={() =>
                            setForm(prev => ({
                              ...prev,
                              coverageTopics: prev.coverageTopics.filter(
                                (_, i) => i !== idx
                              ),
                            }))
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ELIGIBILITY, STEPS & FAQS */}
            {activeTab === "eligibility" && (
              <div className="space-y-6">
                {/* 4 Process Steps */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-800">
                    Process & Requirements (4-Step Enrollment Guide)
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {form.processSteps.map((stepItem, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-xs font-bold">
                            Step {stepItem.step || `0${idx + 1}`}
                          </span>
                          <Input
                            placeholder="Step Title"
                            value={stepItem.title}
                            onChange={e => {
                              const next = [...form.processSteps]
                              next[idx] = { ...next[idx], title: e.target.value }
                              setForm(prev => ({ ...prev, processSteps: next }))
                            }}
                            className="bg-white font-semibold"
                          />
                        </div>
                        <Textarea
                          rows={2}
                          placeholder="Step instructions..."
                          value={stepItem.detail}
                          onChange={e => {
                            const next = [...form.processSteps]
                            next[idx] = { ...next[idx], detail: e.target.value }
                            setForm(prev => ({ ...prev, processSteps: next }))
                          }}
                          className="bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Qualification Categories A-D */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-800">
                    Applicant Eligibility (Categories A, B, C & D)
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {form.qualificationCategories.map((cat, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-extrabold shrink-0">
                            {cat.code}
                          </span>
                          <Input
                            placeholder="Category Title"
                            value={cat.title}
                            onChange={e => {
                              const next = [...form.qualificationCategories]
                              next[idx] = { ...next[idx], title: e.target.value }
                              setForm(prev => ({
                                ...prev,
                                qualificationCategories: next,
                              }))
                            }}
                            className="bg-white font-semibold"
                          />
                        </div>
                        <Textarea
                          rows={2}
                          placeholder="Category eligibility description..."
                          value={cat.description}
                          onChange={e => {
                            const next = [...form.qualificationCategories]
                            next[idx] = {
                              ...next[idx],
                              description: e.target.value,
                            }
                            setForm(prev => ({
                              ...prev,
                              qualificationCategories: next,
                            }))
                          }}
                          className="bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Program FAQs */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Program-Specific FAQs ({form.faqs.length})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Questions and answers displayed at the bottom of this program&apos;s page.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm(prev => ({
                          ...prev,
                          faqs: [...prev.faqs, { question: "", answer: "" }],
                        }))
                      }
                      className="rounded-xl text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add FAQ
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {form.faqs.map((faq, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Question"
                            value={faq.question}
                            onChange={e => {
                              const next = [...form.faqs]
                              next[idx] = { ...next[idx], question: e.target.value }
                              setForm(prev => ({ ...prev, faqs: next }))
                            }}
                            className="bg-white font-semibold"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 shrink-0"
                            onClick={() =>
                              setForm(prev => ({
                                ...prev,
                                faqs: prev.faqs.filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea
                          rows={2}
                          placeholder="Answer"
                          value={faq.answer}
                          onChange={e => {
                            const next = [...form.faqs]
                            next[idx] = { ...next[idx], answer: e.target.value }
                            setForm(prev => ({ ...prev, faqs: next }))
                          }}
                          className="bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create Program"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ManageProgramsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ManageProgramsContent />
    </Suspense>
  )
}
