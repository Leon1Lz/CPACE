"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Database, Plus, Search, BookOpen, Layers, Sparkles,
  ArrowRight, Trash2, Edit3, Loader2, Filter, FolderCheck, CheckCircle2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type QuestionBank = {
  id: string
  title: string
  description: string | null
  code: string | null
  courseId: string
  course: { id: string; title: string; category: string }
  _count: { questions: number; pools?: number }
  createdAt: string
  updatedAt: string
}

type Course = {
  id: string
  title: string
  category: string
}

export default function QuestionBanksPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [banks, setBanks] = useState<QuestionBank[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [courseFilter, setCourseFilter] = useState("ALL")

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: "",
    code: "",
    courseId: "",
    description: "",
  })

  // Delete State
  const [bankToDelete, setBankToDelete] = useState<QuestionBank | null>(null)
  const [deleting, setDeleting] = useState(false)

  const role = session?.user?.role
  const canManage = role === "ADMIN" || role === "INSTRUCTOR"

  useEffect(() => {
    if (session && !canManage) {
      router.push("/dashboard")
    }
  }, [session, canManage, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [banksRes, coursesRes] = await Promise.all([
        fetch("/api/banks"),
        fetch("/api/courses?published=all"),
      ])

      if (banksRes.ok) {
        const banksData = await banksRes.json()
        setBanks(Array.isArray(banksData) ? banksData : [])
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        const rawCourses = Array.isArray(coursesData) ? coursesData : coursesData.courses || []
        setCourses(rawCourses)
      }
    } catch (err) {
      console.error("Error fetching question banks:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load question banks.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManage) {
      void fetchData()
    }
  }, [canManage])

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.courseId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and Course are required.",
      })
      return
    }

    try {
      setCreating(true)
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create bank")
      }

      const created = await res.json()
      setBanks((prev) => [created, ...prev])
      setCreateOpen(false)
      setForm({ title: "", code: "", courseId: "", description: "" })
      toast({
        title: "Test Bank Created",
        description: `"${created.title}" is ready for questions.`,
      })
      router.push(`/dashboard/question-banks/${created.id}`)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create question bank",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteBank = async () => {
    if (!bankToDelete) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/banks/${bankToDelete.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete bank")

      setBanks((prev) => prev.filter((b) => b.id !== bankToDelete.id))
      toast({
        title: "Test Bank Deleted",
        description: `"${bankToDelete.title}" and its questions were removed.`,
      })
      setBankToDelete(null)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete question bank.",
      })
    } finally {
      setDeleting(false)
    }
  }

  const filtered = banks.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.code && b.code.toLowerCase().includes(search.toLowerCase())) ||
      (b.description && b.description.toLowerCase().includes(search.toLowerCase()))
    const matchesCourse = courseFilter === "ALL" || b.course.category === courseFilter || b.courseId === courseFilter
    return matchesSearch && matchesCourse
  })

  const totalQuestions = banks.reduce((sum, b) => sum + (b._count?.questions || 0), 0)
  const cfmsQuestions = banks
    .filter((b) => b.course.category === "CFMS")
    .reduce((sum, b) => sum + (b._count?.questions || 0), 0)
  const cmmsQuestions = banks
    .filter((b) => b.course.category === "CMMS")
    .reduce((sum, b) => sum + (b._count?.questions || 0), 0)
  const comsQuestions = banks
    .filter((b) => b.course.category === "COMS")
    .reduce((sum, b) => sum + (b._count?.questions || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#105C2E] border border-emerald-100">
              <Database className="h-6 w-6" />
            </div>
            Test &amp; Question Banks
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Central repository of reusable exam questions, formulas, and rationales across courses.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-[#105C2E] hover:bg-[#0B4523] text-white gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              New Test Bank
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-lg">
            <form onSubmit={handleCreateBank}>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Database className="h-5 w-5 text-[#105C2E]" /> Create New Test Bank
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Organize questions by course and domain. You can add questions manually or import them via CSV/Aiken.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bank-title" className="text-xs font-semibold text-gray-700">
                    Bank Title *
                  </Label>
                  <Input
                    id="bank-title"
                    placeholder="e.g. CFMS Financial Analysis Item Bank"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bank-course" className="text-xs font-semibold text-gray-700">
                      Associated Course *
                    </Label>
                    <Select
                      value={form.courseId}
                      onValueChange={(val) => setForm((p) => ({ ...p, courseId: val }))}
                    >
                      <SelectTrigger id="bank-course" className="rounded-xl text-xs">
                        <SelectValue placeholder="Select course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="font-semibold">{c.category || "COURSE"}</span> - {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bank-code" className="text-xs font-semibold text-gray-700">
                      Bank Code (Optional)
                    </Label>
                    <Input
                      id="bank-code"
                      placeholder="e.g. QB-CFMS-01"
                      value={form.code}
                      onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                      className="rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bank-desc" className="text-xs font-semibold text-gray-700">
                    Description &amp; Syllabus Coverage
                  </Label>
                  <Textarea
                    id="bank-desc"
                    placeholder="Topics covered, learning objectives, and intended certification tracks..."
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-[#105C2E] hover:bg-[#0B4523] text-white"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Create Bank
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-100/60">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Questions</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-gray-900">{totalQuestions}</span>
              <span className="text-xs text-gray-500">across {banks.length} banks</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-slate-50 border border-slate-200/60">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">CFMS Bank Items</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-700">{cfmsQuestions}</span>
              <span className="text-xs text-gray-500">questions</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-slate-50 border border-slate-200/60">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">CMMS Bank Items</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-blue-700">{cmmsQuestions}</span>
              <span className="text-xs text-gray-500">questions</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-slate-50 border border-slate-200/60">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">COMS Bank Items</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-orange-700">{comsQuestions}</span>
              <span className="text-xs text-gray-500">questions</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search test banks by title, code, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl border-gray-200 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full sm:w-48 rounded-xl border-gray-200 text-xs">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Course Tracks</SelectItem>
                  <SelectItem value="CFMS">CFMS Track</SelectItem>
                  <SelectItem value="CMMS">CMMS Track</SelectItem>
                  <SelectItem value="COMS">COMS Track</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banks Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#105C2E]" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 border-gray-200 shadow-none text-center py-16">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#105C2E] flex items-center justify-center mx-auto">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No Question Banks Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              {search || courseFilter !== "ALL"
                ? "No test banks match your current filters. Try adjusting your search query."
                : "Get started by creating your first Question Bank to store and organize exam items."}
            </p>
            {(!search && courseFilter === "ALL") && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="rounded-xl bg-[#105C2E] hover:bg-[#0B4523] text-white text-xs mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create First Test Bank
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((bank) => {
            const cat = bank.course.category || "GENERAL"
            const catColors: Record<string, { bg: string; text: string; border: string }> = {
              CFMS: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
              CMMS: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
              COMS: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
              GENERAL: { bg: "bg-gray-50", text: "text-gray-800", border: "border-gray-200" },
            }
            const colors = catColors[cat] || catColors.GENERAL

            return (
              <Card
                key={bank.id}
                className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}
                    >
                      {cat} • {bank.code || "ITEM BANK"}
                    </span>
                    <Badge variant="outline" className="text-[11px] font-semibold text-gray-500 rounded-lg">
                      {bank._count?.questions || 0} Questions
                    </Badge>
                  </div>

                  <Link href={`/dashboard/question-banks/${bank.id}`}>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#105C2E] transition-colors line-clamp-1">
                      {bank.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                    {bank.description || `Associated with course: ${bank.course.title}`}
                  </p>
                </CardHeader>

                <CardContent className="p-5 pt-0">
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      Updated {new Date(bank.updatedAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {role === "ADMIN" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setBankToDelete(bank)}
                          className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                          title="Delete Bank"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      <Button
                        asChild
                        size="sm"
                        className="rounded-xl bg-[#105C2E] hover:bg-[#0B4523] text-white text-xs h-8 px-3 gap-1 shadow-sm"
                      >
                        <Link href={`/dashboard/question-banks/${bank.id}`}>
                          Manage Bank <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!bankToDelete} onOpenChange={(open) => !open && setBankToDelete(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              Delete Test Bank?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-gray-800 font-semibold">{bankToDelete?.title}</strong>? This will permanently
              remove all {bankToDelete?._count?.questions || 0} questions within this bank. Questions already imported
              into active exams will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteBank()
              }}
              disabled={deleting}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
