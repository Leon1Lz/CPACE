"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
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
  ChevronLeft, Plus, Search, Trash2, Edit3, Loader2,
  FileSpreadsheet, Upload, Download, CheckCircle2, Circle, Sparkles,
  HelpCircle, AlertCircle, FileText, Check, ArrowDownUp, Filter, Copy
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type BankOption = {
  id?: string
  text: string
  isCorrect: boolean
  order?: number
}

type BankQuestion = {
  id: string
  question: string
  type: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  points: number
  topic: string | null
  tags: string[]
  explanation: string | null
  formula: string | null
  order: number
  options: BankOption[]
  timesUsed: number
  timesCorrect: number
  createdAt: string
}

type QuestionBank = {
  id: string
  title: string
  description: string | null
  code: string | null
  courseId: string
  course: { id: string; title: string; category: string }
  questions: BankQuestion[]
  _count: { questions: number; pools?: number }
}

const DEFAULT_OPTIONS: BankOption[] = [
  { text: "", isCorrect: true },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
]

export default function BankDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const bankId = params.id as string
  const { toast } = useToast()

  const [bank, setBank] = useState<QuestionBank | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("ALL")
  const [topicFilter, setTopicFilter] = useState("ALL")

  // Add / Edit Question Modal State
  const [questionModalOpen, setQuestionModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [questionForm, setQuestionForm] = useState({
    question: "",
    difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
    points: 1.0,
    topic: "",
    explanation: "",
    formula: "",
    options: DEFAULT_OPTIONS,
  })

  // Bulk Import Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkText, setBulkText] = useState("")
  const [bulkImporting, setBulkImporting] = useState(false)

  // Delete Question State
  const [questionToDelete, setQuestionToDelete] = useState<BankQuestion | null>(null)
  const [deletingQuestion, setDeletingQuestion] = useState(false)

  const role = session?.user?.role
  const canManage = role === "ADMIN" || role === "INSTRUCTOR"

  useEffect(() => {
    if (session && !canManage) {
      router.push("/dashboard")
    }
  }, [session, canManage, router])

  const fetchBank = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/banks/${bankId}`)
      if (!res.ok) throw new Error("Question bank not found")
      const data = await res.json()
      setBank(data)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to load question bank",
      })
      router.push("/dashboard/question-banks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManage && bankId) {
      void fetchBank()
    }
  }, [canManage, bankId])

  const openAddModal = () => {
    setEditingQuestion(null)
    setQuestionForm({
      question: "",
      difficulty: "MEDIUM",
      points: 1.0,
      topic: "",
      explanation: "",
      formula: "",
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    })
    setQuestionModalOpen(true)
  }

  const openEditModal = (q: BankQuestion) => {
    setEditingQuestion(q)
    setQuestionForm({
      question: q.question,
      difficulty: q.difficulty,
      points: q.points,
      topic: q.topic || "",
      explanation: q.explanation || "",
      formula: q.formula || "",
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
    })
    setQuestionModalOpen(true)
  }

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionForm.question.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Question text is required." })
      return
    }

    const validOptions = questionForm.options.filter((o) => o.text.trim())
    if (validOptions.length < 2) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please provide at least 2 options." })
      return
    }

    if (!validOptions.some((o) => o.isCorrect)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Mark at least one option as the correct answer." })
      return
    }

    try {
      setSavingQuestion(true)
      const payload = {
        question: questionForm.question.trim(),
        difficulty: questionForm.difficulty,
        points: Number(questionForm.points) || 1.0,
        topic: questionForm.topic.trim() || null,
        explanation: questionForm.explanation.trim() || null,
        formula: questionForm.formula.trim() || null,
        options: validOptions,
      }

      if (editingQuestion) {
        // PATCH
        const res = await fetch(`/api/banks/${bankId}/questions/${editingQuestion.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update question")
        const updated = await res.json()
        setBank((prev) =>
          prev
            ? {
                ...prev,
                questions: prev.questions.map((q) => (q.id === updated.id ? updated : q)),
              }
            : null
        )
        toast({ title: "Question Updated", description: "Changes saved to the bank." })
      } else {
        // POST
        const res = await fetch(`/api/banks/${bankId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to create question")
        const created = await res.json()
        setBank((prev) =>
          prev
            ? {
                ...prev,
                questions: [...prev.questions, created],
                _count: { ...prev._count, questions: (prev._count?.questions || 0) + 1 },
              }
            : null
        )
        toast({ title: "Question Added", description: "New question added to bank." })
      }

      setQuestionModalOpen(false)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to save question." })
    } finally {
      setSavingQuestion(false)
    }
  }

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return
    try {
      setDeletingQuestion(true)
      const res = await fetch(`/api/banks/${bankId}/questions/${questionToDelete.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete question")

      setBank((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.filter((q) => q.id !== questionToDelete.id),
              _count: { ...prev._count, questions: Math.max(0, (prev._count?.questions || 1) - 1) },
            }
          : null
      )
      toast({ title: "Question Deleted", description: "Question removed from this test bank." })
      setQuestionToDelete(null)
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete question." })
    } finally {
      setDeletingQuestion(false)
    }
  }

  // Parse Aiken or Structured format for bulk import
  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      toast({ variant: "destructive", title: "Empty input", description: "Paste your questions to import." })
      return
    }

    try {
      setBulkImporting(true)
      const blocks = bulkText.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
      const parsedQuestions: any[] = []

      for (const block of blocks) {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean)
        if (lines.length < 3) continue

        let qText = lines[0]
        let answerLetter = ""
        let explanation = ""
        let formula = ""
        let difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM"
        let topic = ""
        const options: { text: string; isCorrect: boolean }[] = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]
          const optMatch = line.match(/^([A-Da-d])[\)\.]\s*(.*)$/)
          const ansMatch = line.match(/^ANSWER:\s*([A-Da-d])/i)
          const expMatch = line.match(/^EXPLANATION:\s*(.*)$/i)
          const formMatch = line.match(/^FORMULA:\s*(.*)$/i)
          const diffMatch = line.match(/^DIFFICULTY:\s*(EASY|MEDIUM|HARD)/i)
          const topicMatch = line.match(/^TOPIC:\s*(.*)$/i)

          if (ansMatch) {
            answerLetter = ansMatch[1].toUpperCase()
          } else if (expMatch) {
            explanation = expMatch[1]
          } else if (formMatch) {
            formula = formMatch[1]
          } else if (diffMatch) {
            difficulty = diffMatch[1].toUpperCase() as any
          } else if (topicMatch) {
            topic = topicMatch[1]
          } else if (optMatch) {
            const letter = optMatch[1].toUpperCase()
            const text = optMatch[2]
            options.push({
              text,
              isCorrect: false, // will update once ANSWER line is processed
            })
          }
        }

        // Set isCorrect based on answerLetter (A=0, B=1, C=2, D=3)
        if (answerLetter && options.length > 0) {
          const targetIndex = answerLetter.charCodeAt(0) - 65
          if (targetIndex >= 0 && targetIndex < options.length) {
            options[targetIndex].isCorrect = true
          }
        }

        if (qText && options.length >= 2) {
          parsedQuestions.push({
            question: qText,
            type: "MULTIPLE_CHOICE",
            difficulty,
            points: 1.0,
            topic: topic || null,
            explanation: explanation || null,
            formula: formula || null,
            options,
          })
        }
      }

      if (parsedQuestions.length === 0) {
        throw new Error(
          "Could not detect valid questions. Make sure format is:\nQuestion text...\nA) Option 1\nB) Option 2\nANSWER: A"
        )
      }

      const res = await fetch(`/api/banks/${bankId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: parsedQuestions }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Bulk import failed")
      }

      const result = await res.json()
      toast({
        title: "Bulk Import Successful",
        description: result.message || `Imported ${parsedQuestions.length} questions.`,
      })
      setBulkText("")
      setBulkModalOpen(false)
      void fetchBank()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Import Error",
        description: err.message || "Failed to parse or import questions.",
      })
    } finally {
      setBulkImporting(false)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!bank || bank.questions.length === 0) return

    const rows = [
      ["Question", "Difficulty", "Points", "Topic", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Explanation", "Formula"],
      ...bank.questions.map((q) => {
        const opts = q.options || []
        const correctIndex = opts.findIndex((o) => o.isCorrect)
        const correctLetter = correctIndex !== -1 ? String.fromCharCode(65 + correctIndex) : ""

        return [
          `"${q.question.replace(/"/g, '""')}"`,
          q.difficulty,
          q.points,
          `"${(q.topic || "").replace(/"/g, '""')}"`,
          `"${(opts[0]?.text || "").replace(/"/g, '""')}"`,
          `"${(opts[1]?.text || "").replace(/"/g, '""')}"`,
          `"${(opts[2]?.text || "").replace(/"/g, '""')}"`,
          `"${(opts[3]?.text || "").replace(/"/g, '""')}"`,
          correctLetter,
          `"${(q.explanation || "").replace(/"/g, '""')}"`,
          `"${(q.formula || "").replace(/"/g, '""')}"`,
        ]
      }),
    ]

    const csvContent = rows.map((e) => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${bank.code || "bank"}-questions.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <Loader2 className="h-8 w-8 animate-spin text-[#105C2E]" />
      </div>
    )
  }

  if (!bank) return null

  const topics = Array.from(new Set(bank.questions.map((q) => q.topic).filter(Boolean))) as string[]

  const filteredQuestions = bank.questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(search.toLowerCase())) ||
      (q.topic && q.topic.toLowerCase().includes(search.toLowerCase()))
    const matchesDiff = difficultyFilter === "ALL" || q.difficulty === difficultyFilter
    const matchesTopic = topicFilter === "ALL" || q.topic === topicFilter
    return matchesSearch && matchesDiff && matchesTopic
  })

  const easyCount = bank.questions.filter((q) => q.difficulty === "EASY").length
  const medCount = bank.questions.filter((q) => q.difficulty === "MEDIUM").length
  const hardCount = bank.questions.filter((q) => q.difficulty === "HARD").length

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/question-banks"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#105C2E] transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Test Banks
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900">{bank.title}</h1>
            <Badge variant="outline" className="text-xs font-black text-emerald-800 bg-emerald-50 border-emerald-200">
              {bank.course.category}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {bank.description || `Associated Course: ${bank.course.title}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={bank.questions.length === 0}
            className="rounded-xl border-gray-200 gap-1.5 text-xs text-gray-700 hover:bg-gray-50"
            title="Download CSV backup of all questions in this bank"
          >
            <Download className="h-3.5 w-3.5 text-[#105C2E]" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkModalOpen(true)}
            className="rounded-xl border-gray-200 gap-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
            Bulk Import (Aiken/CSV)
          </Button>

          <Button
            size="sm"
            onClick={openAddModal}
            className="rounded-xl bg-[#105C2E] hover:bg-[#0B4523] text-white text-xs gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-xl border-0 shadow-sm bg-slate-50 border border-slate-200/60 p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Items</p>
            <p className="text-xl font-black text-gray-900">{bank.questions.length}</p>
          </div>
          <FileText className="h-7 w-7 text-gray-300" />
        </Card>

        <Card className="rounded-xl border-0 shadow-sm bg-emerald-50/60 border border-emerald-100 p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Easy Items</p>
            <p className="text-xl font-black text-emerald-700">{easyCount}</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
        </Card>

        <Card className="rounded-xl border-0 shadow-sm bg-amber-50/60 border border-amber-100 p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Medium Items</p>
            <p className="text-xl font-black text-amber-700">{medCount}</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-amber-500" />
        </Card>

        <Card className="rounded-xl border-0 shadow-sm bg-rose-50/60 border border-rose-100 p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Hard Items</p>
            <p className="text-xl font-black text-rose-700">{hardCount}</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-rose-500" />
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questions, rationales, or formulas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl border-gray-200 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full sm:w-36 rounded-xl border-gray-200 text-xs">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Difficulties</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>

              {topics.length > 0 && (
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-full sm:w-44 rounded-xl border-gray-200 text-xs">
                    <SelectValue placeholder="Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Topics</SelectItem>
                    {topics.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Feed */}
      {filteredQuestions.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 border-gray-200 shadow-none text-center py-16">
          <CardContent className="space-y-3">
            <HelpCircle className="h-10 w-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">No Questions Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              {search || difficultyFilter !== "ALL" || topicFilter !== "ALL"
                ? "No questions match your current filters. Clear the search or select different tags."
                : "This bank has no questions yet. Click 'Add Question' or 'Bulk Import' above to populate it."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const diffBadges: Record<string, { label: string; color: string }> = {
              EASY: { label: "Easy", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
              MEDIUM: { label: "Medium", color: "bg-amber-100 text-amber-800 border-amber-200" },
              HARD: { label: "Hard", color: "bg-rose-100 text-rose-800 border-rose-200" },
            }
            const diffInfo = diffBadges[q.difficulty] || diffBadges.MEDIUM

            return (
              <Card key={q.id} className="rounded-2xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-gray-400">#{idx + 1}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${diffInfo.color}`}>
                        {diffInfo.label}
                      </span>
                      {q.topic && (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {q.topic}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {q.points} pt{q.points === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(q)}
                        className="h-8 w-8 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl"
                        title="Edit Question"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuestionToDelete(q)}
                        className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                        title="Delete Question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <p className="text-sm font-semibold text-gray-900 leading-relaxed mb-4">
                    {q.question}
                  </p>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx)
                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition ${
                            opt.isCorrect
                              ? "bg-emerald-50/70 border-emerald-300 font-medium text-emerald-950"
                              : "bg-white border-gray-100 text-gray-700"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              opt.isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1 truncate">{opt.text}</span>
                          {opt.isCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 ml-auto" />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Concept & Formula Callout */}
                  {(q.explanation || q.formula) && (
                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50/60 to-teal-50/30 border border-emerald-100 text-xs text-emerald-950 space-y-1.5">
                      {q.explanation && (
                        <div className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-emerald-800">Concept &amp; Rationale: </strong>
                            {q.explanation}
                          </div>
                        </div>
                      )}
                      {q.formula && (
                        <div className="ml-6 p-2 rounded-lg bg-white/90 border border-emerald-200/80 font-mono text-[11px] text-emerald-900 font-bold">
                          📐 {q.formula}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add / Edit Question Dialog */}
      <Dialog open={questionModalOpen} onOpenChange={setQuestionModalOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveQuestion}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#105C2E]" />
                {editingQuestion ? "Edit Bank Question" : "Add New Question to Bank"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Author the question prompt, answer choices, explanation rationale, and optional formula.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Question Prompt *</Label>
                <Textarea
                  placeholder="e.g. Which of the following reflects cash receipts and disbursements over a reporting period?"
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, question: e.target.value }))}
                  rows={3}
                  className="rounded-xl text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Difficulty</Label>
                  <Select
                    value={questionForm.difficulty}
                    onValueChange={(val: any) => setQuestionForm((p) => ({ ...p, difficulty: val }))}
                  >
                    <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Points</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm((p) => ({ ...p, points: parseFloat(e.target.value) || 1.0 }))}
                    className="rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Topic / Domain</Label>
                  <Input
                    placeholder="e.g. Cash Flow Analysis"
                    value={questionForm.topic}
                    onChange={(e) => setQuestionForm((p) => ({ ...p, topic: e.target.value }))}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Answer Choices */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Answer Options (Mark Correct Answer)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setQuestionForm((p) => ({
                        ...p,
                        options: [...p.options, { text: "", isCorrect: false }],
                      }))
                    }
                    className="text-xs text-[#105C2E] hover:bg-emerald-50 h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  {questionForm.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx)
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setQuestionForm((p) => ({
                              ...p,
                              options: p.options.map((o, oIdx) => ({
                                ...o,
                                isCorrect: oIdx === idx,
                              })),
                            }))
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition shrink-0 ${
                            opt.isCorrect
                              ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                          title={opt.isCorrect ? "Correct Option" : "Click to mark as correct"}
                        >
                          {letter}
                        </button>

                        <Input
                          placeholder={`Option ${letter} text...`}
                          value={opt.text}
                          onChange={(e) => {
                            const val = e.target.value
                            setQuestionForm((p) => ({
                              ...p,
                              options: p.options.map((o, oIdx) => (oIdx === idx ? { ...o, text: val } : o)),
                            }))
                          }}
                          className="rounded-xl text-xs flex-1"
                        />

                        {questionForm.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setQuestionForm((p) => ({
                                ...p,
                                options: p.options.filter((_, oIdx) => oIdx !== idx),
                              }))
                            }}
                            className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Rationale and Formula */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Concept Explanation &amp; Rationale</Label>
                  <Textarea
                    placeholder="Provide a pedagogical explanation to be displayed in post-quiz reviews..."
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm((p) => ({ ...p, explanation: e.target.value }))}
                    rows={2}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Mathematical Formula (Optional)</Label>
                  <Input
                    placeholder="e.g. Operating Cash Flow = Net Income + Depreciation - ΔNWC"
                    value={questionForm.formula}
                    onChange={(e) => setQuestionForm((p) => ({ ...p, formula: e.target.value }))}
                    className="rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuestionModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingQuestion}
                className="rounded-xl bg-[#105C2E] hover:bg-[#0B4523] text-white"
              >
                {savingQuestion ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                {editingQuestion ? "Update Question" : "Add to Bank"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              Bulk Import Questions (Aiken Format)
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Paste multiple questions using standard Aiken format. Each question block is separated by a blank line.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 font-mono">
              <p className="font-bold text-slate-900">Supported Format Example:</p>
              <p>What financial statement shows cash receipts and disbursements?</p>
              <p>A) Balance Sheet</p>
              <p>B) Income Statement</p>
              <p>C) Statement of Cash Flows</p>
              <p>D) Statement of Changes in Equity</p>
              <p className="text-emerald-700 font-bold">ANSWER: C</p>
              <p className="text-blue-700 font-bold">EXPLANATION: Cash flows track operating, investing, and financing activities.</p>
              <p className="text-amber-700 font-bold">FORMULA: Net Cash = Operating + Investing + Financing</p>
              <p className="text-violet-700 font-bold">DIFFICULTY: EASY</p>
              <p className="text-slate-600 font-bold">TOPIC: Financial Statements</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Paste Question Blocks</Label>
              <Textarea
                placeholder="Paste Aiken format questions here..."
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={10}
                className="rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBulkModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBulkImport}
              disabled={bulkImporting || !bulkText.trim()}
              className="rounded-xl bg-[#105C2E] hover:bg-[#0B4523] text-white"
            >
              {bulkImporting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Import Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Question Alert */}
      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-600" /> Delete Question?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              Are you sure you want to remove this question from the bank? This will not affect active exams where this question has already been copied.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingQuestion} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteQuestion()
              }}
              disabled={deletingQuestion}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deletingQuestion ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Delete Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
