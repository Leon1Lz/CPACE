"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  ChevronLeft, Plus, Trash2, CheckCircle, Circle, Loader2,
  ClipboardCheck, ListChecks, ToggleLeft, FileText, AlignLeft,
  GripVertical, AlertCircle, Upload, Download, FileSpreadsheet,
} from "lucide-react"
import Link from "next/link"

type Option = { id?: string; text: string; isCorrect: boolean }
type Question = {
  id: string
  question: string
  type: string
  points: number
  order: number
  options: { id: string; text: string; isCorrect: boolean; order: number }[]
}
type Assessment = { id: string; title: string; type: string; passingScore: number; _count?: { questions: number } }

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  MULTIPLE_CHOICE: { label: "Multiple Choice", icon: ListChecks, color: "text-blue-600 bg-blue-50" },
  TRUE_FALSE:      { label: "True / False",    icon: ToggleLeft,  color: "text-violet-600 bg-violet-50" },
  SHORT_ANSWER:    { label: "Short Answer",    icon: FileText,    color: "text-amber-600 bg-amber-50" },
  ESSAY:           { label: "Essay",           icon: AlignLeft,   color: "text-gray-600 bg-gray-50" },
}

const EMPTY_OPTION = (): Option => ({ text: "", isCorrect: false })

export default function ManageQuestionsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [csvOpen, setCsvOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<{ question: string; type: string; options: string[]; correct: string }[]>([])
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvError, setCsvError] = useState("")
  const [csvSuccess, setCsvSuccess] = useState("")

  const [form, setForm] = useState({
    question: "",
    type: "MULTIPLE_CHOICE",
    points: "1",
    options: [EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION()],
  })

  const role = session?.user?.role?.toLowerCase()

  useEffect(() => {
    if (role === "learner") { router.push("/dashboard/assessments"); return }
    Promise.all([
      fetch(`/api/assessments/${assessmentId}`).then(r => r.json()),
      fetch(`/api/assessments/${assessmentId}/questions`).then(r => r.json()),
    ]).then(([a, q]) => {
      setAssessment(a)
      setQuestions(Array.isArray(q) ? q : [])
    }).finally(() => setLoading(false))
  }, [assessmentId, role, router])

  const needsOptions = form.type === "MULTIPLE_CHOICE" || form.type === "TRUE_FALSE"

  const resetForm = () => {
    setForm({ question: "", type: "MULTIPLE_CHOICE", points: "1", options: [EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION()] })
    setError("")
  }

  const handleTypeChange = (type: string) => {
    if (type === "TRUE_FALSE") {
      setForm(p => ({ ...p, type, options: [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }] }))
    } else {
      setForm(p => ({ ...p, type, options: [EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION()] }))
    }
  }

  const setOptionText = (i: number, text: string) =>
    setForm(p => { const opts = [...p.options]; opts[i] = { ...opts[i], text }; return { ...p, options: opts } })

  const setOptionCorrect = (i: number) =>
    setForm(p => ({ ...p, options: p.options.map((o, idx) => ({ ...o, isCorrect: idx === i })) }))

  const addOption = () => setForm(p => ({ ...p, options: [...p.options, EMPTY_OPTION()] }))
  const removeOption = (i: number) => setForm(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))

  const handleSave = async () => {
    setError("")
    if (!form.question.trim()) { setError("Question text is required"); return }
    if (needsOptions && !form.options.some(o => o.isCorrect)) { setError("Mark at least one correct answer"); return }
    if (needsOptions && form.options.some(o => !o.text.trim())) { setError("All option fields must have text"); return }

    setSaving(true)
    const res = await fetch(`/api/assessments/${assessmentId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: form.question,
        type: form.type,
        points: parseFloat(form.points) || 1,
        options: needsOptions ? form.options : undefined,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? "Failed to save question"); return }
    setQuestions(prev => [...prev, data])
    setOpen(false)
    resetForm()
  }

  const handleDelete = async (qId: string) => {
    setDeletingId(qId)
    await fetch(`/api/assessments/${assessmentId}/questions/${qId}`, { method: "DELETE" })
    setQuestions(prev => prev.filter(q => q.id !== qId))
    setDeletingId(null)
  }

  const totalPoints = questions.reduce((s, q) => s + q.points, 0)

  const CSV_TEMPLATE = [
    "question,type,points,option_a,option_b,option_c,option_d,correct_answer",
    "What is 2 + 2?,MULTIPLE_CHOICE,1,3,4,5,6,B",
    "The earth is flat.,TRUE_FALSE,1,,,,, False",
    "Explain supply and demand.,SHORT_ANSWER,2,,,,,",
  ].join("\n")

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "cpace_questions_template.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const handleCsvFile = (file: File) => {
    setCsvFile(file)
    setCsvError("")
    setCsvSuccess("")
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim())
      if (lines.length < 2) { setCsvError("CSV has no data rows"); return }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"))
      const preview = lines.slice(1, 6).map(line => {
        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""))
        const row: Record<string, string> = {}
        headers.forEach((h, i) => { row[h] = cols[i] ?? "" })
        return {
          question: row["question"] ?? "",
          type: (row["type"] ?? "MULTIPLE_CHOICE").toUpperCase().replace(/ /g, "_"),
          options: [row["option_a"], row["option_b"], row["option_c"], row["option_d"]].filter(Boolean),
          correct: row["correct_answer"] ?? "",
        }
      }).filter(r => r.question)
      setCsvPreview(preview)
    }
    reader.readAsText(file)
  }

  const handleCsvImport = async () => {
    if (!csvFile) return
    setCsvImporting(true)
    setCsvError("")
    const fd = new FormData()
    fd.append("file", csvFile)
    const res = await fetch(`/api/assessments/${assessmentId}/import-csv`, { method: "POST", body: fd })
    const data = await res.json()
    setCsvImporting(false)
    if (!res.ok) {
      setCsvError(data.error + (data.details ? ": " + data.details.join(", ") : ""))
      return
    }
    setQuestions(prev => [...prev, ...data.questions])
    setCsvSuccess(`✅ Successfully imported ${data.imported} question${data.imported !== 1 ? "s" : ""}`)
    setCsvFile(null)
    setCsvPreview([])
    setTimeout(() => { setCsvOpen(false); setCsvSuccess("") }, 1800)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-xl">
            <Link href="/dashboard/assessments"><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{assessment?.title ?? "Manage Questions"}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {questions.length} question{questions.length !== 1 ? "s" : ""} · {totalPoints} total points · {assessment?.passingScore}% passing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Import Dialog */}
          <Dialog open={csvOpen} onOpenChange={(v) => { setCsvOpen(v); if (!v) { setCsvFile(null); setCsvPreview([]); setCsvError(""); setCsvSuccess("") } }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50">
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" /> Import Questions from CSV
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {/* Format guide */}
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 space-y-1">
                  <p className="font-bold text-blue-900">Required CSV columns:</p>
                  <p><code className="bg-blue-100 px-1 rounded">question</code>, <code className="bg-blue-100 px-1 rounded">type</code>, <code className="bg-blue-100 px-1 rounded">points</code>, <code className="bg-blue-100 px-1 rounded">option_a</code>, <code className="bg-blue-100 px-1 rounded">option_b</code>, <code className="bg-blue-100 px-1 rounded">option_c</code>, <code className="bg-blue-100 px-1 rounded">option_d</code>, <code className="bg-blue-100 px-1 rounded">correct_answer</code></p>
                  <p><span className="font-semibold">type values:</span> MULTIPLE_CHOICE · TRUE_FALSE · SHORT_ANSWER · ESSAY</p>
                  <p><span className="font-semibold">correct_answer:</span> A / B / C / D for MC · True / False for T/F · leave empty for open-ended</p>
                </div>

                {/* Template download */}
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="rounded-xl text-xs border-gray-200">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download Template CSV
                </Button>

                {/* File drop zone */}
                <label className={`flex flex-col items-center justify-center gap-2 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${csvFile ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/40"}`}>
                  <input
                    type="file" accept=".csv,text/csv" className="sr-only"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(f) }}
                  />
                  {csvFile ? (
                    <>
                      <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
                      <p className="text-sm font-semibold text-emerald-700">{csvFile.name}</p>
                      <p className="text-xs text-emerald-600">{csvPreview.length} question{csvPreview.length !== 1 ? "s" : ""} detected (showing first 5)</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500 font-medium">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400">.csv files only</p>
                    </>
                  )}
                </label>

                {/* Preview table */}
                {csvPreview.length > 0 && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</div>
                    <div className="divide-y divide-gray-50">
                      {csvPreview.map((row, i) => (
                        <div key={i} className="px-4 py-3 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                            <span className="text-sm font-medium text-gray-900 flex-1">{row.question}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              row.type === "MULTIPLE_CHOICE" ? "bg-blue-100 text-blue-700" :
                              row.type === "TRUE_FALSE" ? "bg-violet-100 text-violet-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>{row.type.replace("_", " ")}</span>
                          </div>
                          {row.options.length > 0 && (
                            <div className="ml-6 flex flex-wrap gap-1.5">
                              {row.options.map((opt, j) => (
                                <span key={j} className={`text-xs px-2 py-0.5 rounded-lg ${["A","B","C","D"][j] === row.correct.toUpperCase() ? "bg-emerald-100 text-emerald-700 font-semibold" : "bg-gray-100 text-gray-500"}`}>
                                  {["A","B","C","D"][j]}: {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {csvError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />{csvError}
                  </div>
                )}
                {csvSuccess && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />{csvSuccess}
                  </div>
                )}

                <Button
                  onClick={handleCsvImport}
                  disabled={!csvFile || csvImporting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  {csvImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  {csvImporting ? "Importing…" : `Import ${csvPreview.length > 0 ? `${csvPreview.length}+ ` : ""}Questions`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Type selector */}
              <div className="space-y-1.5">
                <Label>Question Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TYPE_META).map(([key, meta]) => {
                    const Icon = meta.icon
                    return (
                      <button
                        key={key}
                        onClick={() => handleTypeChange(key)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${form.type === key ? "border-emerald-500 bg-emerald-50" : "border-gray-100 hover:border-gray-200"}`}
                      >
                        <Icon className={`h-4 w-4 ${form.type === key ? "text-emerald-600" : "text-gray-400"}`} />
                        <span className={`text-xs font-semibold ${form.type === key ? "text-emerald-700" : "text-gray-600"}`}>{meta.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Question text */}
              <div className="space-y-1.5">
                <Label>Question</Label>
                <textarea
                  rows={3}
                  placeholder="Enter your question here..."
                  value={form.question}
                  onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
              </div>

              {/* Points */}
              <div className="space-y-1.5">
                <Label>Points</Label>
                <Input type="number" min="0" step="0.5" value={form.points} onChange={e => setForm(p => ({ ...p, points: e.target.value }))} className="rounded-xl w-28" />
              </div>

              {/* Options */}
              {needsOptions && (
                <div className="space-y-2">
                  <Label>Answer Options <span className="text-gray-400 font-normal text-xs ml-1">(click circle to mark correct)</span></Label>
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button onClick={() => setOptionCorrect(i)} className="shrink-0">
                        {opt.isCorrect
                          ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                          : <Circle className="h-5 w-5 text-gray-300" />}
                      </button>
                      <Input
                        placeholder={`Option ${i + 1}`}
                        value={opt.text}
                        onChange={e => setOptionText(i, e.target.value)}
                        disabled={form.type === "TRUE_FALSE"}
                        className="rounded-xl flex-1"
                      />
                      {form.type !== "TRUE_FALSE" && form.options.length > 2 && (
                        <button onClick={() => removeOption(i)} className="shrink-0 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {form.type !== "TRUE_FALSE" && (
                    <Button type="button" variant="outline" size="sm" onClick={addOption} className="rounded-xl text-xs mt-1">
                      <Plus className="h-3 w-3 mr-1" /> Add Option
                    </Button>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Save Question
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Question list */}
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-gray-100 text-center">
          <ClipboardCheck className="h-12 w-12 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-400">No questions yet</p>
          <p className="text-xs text-gray-300 mt-1">Click &quot;Add Question&quot; to start building this assessment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const meta = TYPE_META[q.type] ?? TYPE_META.MULTIPLE_CHOICE
            const Icon = meta.icon
            return (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 group">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <GripVertical className="h-4 w-4 text-gray-200" />
                    <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                        <Icon className="h-3 w-3" />{meta.label}
                      </span>
                      <span className="text-xs text-gray-400">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
                      {q.options.length > 0 && (
                        <span className="text-xs text-gray-400">{q.options.length} options</span>
                      )}
                    </div>
                    {q.options.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {q.options.map(o => (
                          <div key={o.id} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${o.isCorrect ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-gray-50 text-gray-600"}`}>
                            {o.isCorrect ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 text-gray-300 shrink-0" />}
                            {o.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                  >
                    {deletingId === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary bar */}
      {questions.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-500"><span className="font-bold text-gray-900">{questions.length}</span> questions</span>
            <span className="text-gray-500"><span className="font-bold text-gray-900">{totalPoints}</span> total points</span>
            <span className="text-gray-500">Passing: <span className="font-bold text-gray-900">{((assessment?.passingScore ?? 70) / 100 * totalPoints).toFixed(0)}</span> pts needed</span>
          </div>
        </div>
      )}
    </div>
  )
}
