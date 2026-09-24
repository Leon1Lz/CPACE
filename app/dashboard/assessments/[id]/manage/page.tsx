"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  ChevronLeft, Plus, Trash2, CheckCircle, Circle, Loader2,
  ClipboardCheck, ListChecks, ToggleLeft, FileText, AlignLeft,
  GripVertical, AlertCircle, Upload, Download, FileSpreadsheet,
  Settings, Eye, FlaskConical, X as XIcon, CalendarClock, BarChart3, ShieldCheck
} from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { localDateTime } from "@/lib/assessment-schedule"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { MotionThresholdTest } from "@/components/proctoring/motion-threshold-test"

type Option = { id?: string; text: string; isCorrect: boolean }
type Question = {
  id: string
  question: string
  type: string
  points: number
  order: number
  options: { id: string; text: string; isCorrect: boolean; order: number }[]
}
type Assessment = {
  id: string
  title: string
  type: string
  courseId: string
  description?: string | null
  timeLimit?: number | null
  attempts?: number | null
  passingScore: number
  releaseScores?: boolean
  scoresReleasedAt?: string | Date | null
  startsAt?: string | null
  endsAt?: string | null
  bankLockedAt?: string | null
  _count?: { questions: number }
  materialUrl?: string | null
  materialName?: string | null
  motionDetectionEnabled?: boolean
  detectFaceAbsence?: boolean
  detectMultipleFaces?: boolean
  detectGaze?: boolean
  detectPosture?: boolean
  detectionHoldMs?: number
  detectionCooldownMs?: number
  evidenceCaptureEnabled?: boolean
  evidenceRetentionDays?: number
  requireProctoringConsent?: boolean
}

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
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [csvOpen, setCsvOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<{ question: string; type: string; options: string[]; correct: string }[]>([])
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvError, setCsvError] = useState("")
  const [csvSuccess, setCsvSuccess] = useState("")

  // Edit Assessment Info States
  const [editOpen, setEditOpen] = useState(false)
  const [motionTestOpen, setMotionTestOpen] = useState(false)
  const [motionSaving, setMotionSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    type: "REVIEWER",
    courseId: "",
    timeLimit: "",
    passingScore: "70",
    attempts: "1",
    description: "",
    releaseScores: true,
    scoresReleasedAt: "",
    startsAt: "",
    endsAt: "",
    motionDetectionEnabled: true,
    detectFaceAbsence: true,
    detectMultipleFaces: true,
    detectGaze: true,
    detectPosture: true,
    detectionHoldMs: "2500",
    detectionCooldownMs: "12000",
    evidenceCaptureEnabled: true,
    evidenceRetentionDays: "30",
    requireProctoringConsent: true,
  })
  const [editSaving, setEditSaving] = useState(false)
  const [uploadingMaterial, setUploadingMaterial] = useState(false)
  const [materialViewerOpen, setMaterialViewerOpen] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("motionTest") === "1") {
      setMotionTestOpen(true)
    }
  }, [])

  const handleUploadMaterial = async (file: File) => {
    setUploadingMaterial(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/upload`, {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        const updated = await res.json()
        setAssessment(prev => prev ? { ...prev, materialUrl: updated.materialUrl, materialName: updated.materialName } : updated)
      } else {
        alert("Failed to upload material. Please try again.")
      }
    } catch (err) {
      console.error(err)
      alert("Error uploading material.")
    } finally {
      setUploadingMaterial(false)
    }
  }

  const handleDeleteMaterial = async () => {
    if (!confirm("Are you sure you want to remove the study material?")) return
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialUrl: null, materialName: null }),
      })
      if (res.ok) {
        setAssessment(prev => prev ? { ...prev, materialUrl: null, materialName: null } : null)
      } else {
        alert("Failed to remove material.")
      }
    } catch (err) {
      console.error(err)
      alert("Error removing material.")
    }
  }

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
      fetch("/api/courses?limit=200").then(r => r.json()),
    ]).then(([a, q, c]) => {
      setAssessment(a)
      setQuestions(Array.isArray(q) ? q : [])
      setCourses(Array.isArray(c) ? c : Array.isArray(c?.data) ? c.data : [])
    }).finally(() => setLoading(false))
  }, [assessmentId, role, router])

  // Sync edit form fields when assessment is loaded
  useEffect(() => {
    if (assessment) {
      let formattedDate = ""
      if (assessment.scoresReleasedAt) {
        const d = new Date(assessment.scoresReleasedAt)
        formattedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      }
      setEditForm({
        title: assessment.title || "",
        type: assessment.type || "REVIEWER",
        courseId: assessment.courseId || "",
        timeLimit: assessment.timeLimit?.toString() || "",
        passingScore: assessment.passingScore?.toString() || "70",
        attempts: assessment.attempts?.toString() || "1",
        description: assessment.description || "",
        releaseScores: assessment.releaseScores !== false,
        scoresReleasedAt: formattedDate,
        startsAt: localDateTime(assessment.startsAt),
        endsAt: localDateTime(assessment.endsAt),
        motionDetectionEnabled: assessment.motionDetectionEnabled !== false,
        detectFaceAbsence: assessment.detectFaceAbsence !== false,
        detectMultipleFaces: assessment.detectMultipleFaces !== false,
        detectGaze: assessment.detectGaze !== false,
        detectPosture: assessment.detectPosture !== false,
        detectionHoldMs: String(assessment.detectionHoldMs ?? 2500),
        detectionCooldownMs: String(assessment.detectionCooldownMs ?? 12000),
        evidenceCaptureEnabled: assessment.evidenceCaptureEnabled !== false,
        evidenceRetentionDays: String(assessment.evidenceRetentionDays ?? 30),
        requireProctoringConsent: assessment.requireProctoringConsent !== false,
      })
    }
  }, [assessment])

  const handleUpdateAssessment = async () => {
    setEditSaving(true)
    const isUnlimited = editForm.type === "REVIEWER" || editForm.type === "PRACTICE_EXAM"
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(Object.entries(editForm).filter(([key]) => key !== "courseId")),
          startsAt: editForm.startsAt ? new Date(editForm.startsAt).toISOString() : null,
          endsAt: editForm.endsAt ? new Date(editForm.endsAt).toISOString() : null,
          timeLimit: editForm.timeLimit ? parseInt(editForm.timeLimit) : null,
          passingScore: parseFloat(editForm.passingScore),
          attempts: isUnlimited ? null : parseInt(editForm.attempts),
          releaseScores: editForm.releaseScores,
          scoresReleasedAt: editForm.releaseScores ? null : (editForm.scoresReleasedAt ? new Date(editForm.scoresReleasedAt) : null),
          detectionHoldMs: Math.max(1000, parseInt(editForm.detectionHoldMs) || 2500),
          detectionCooldownMs: Math.max(3000, parseInt(editForm.detectionCooldownMs) || 12000),
          evidenceRetentionDays: Math.max(1, parseInt(editForm.evidenceRetentionDays) || 30),
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAssessment(prev => prev ? { ...prev, ...updated } : updated)
        setEditOpen(false)
      } else {
        const failure = await res.json()
        alert(failure.error ?? "Unable to save assessment settings.")
      }
    } catch (err) {
      console.error("Failed to update assessment details:", err)
      alert("Unable to save assessment settings. Please try again.")
    } finally {
      setEditSaving(false)
    }
  }

  const handleSaveMotionSettings = async () => {
    setMotionSaving(true)
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motionDetectionEnabled: editForm.motionDetectionEnabled,
          detectFaceAbsence: editForm.detectFaceAbsence,
          detectMultipleFaces: editForm.detectMultipleFaces,
          detectGaze: editForm.detectGaze,
          detectPosture: editForm.detectPosture,
          detectionHoldMs: Math.max(1000, parseInt(editForm.detectionHoldMs) || 2500),
          detectionCooldownMs: Math.max(3000, parseInt(editForm.detectionCooldownMs) || 12000),
        }),
      })
      if (!res.ok) {
        const failure = await res.json()
        alert(failure.error ?? "Unable to save motion detection settings.")
        return
      }
      const updated = await res.json()
      setAssessment(previous => previous ? { ...previous, ...updated } : updated)
      setMotionTestOpen(false)
    } catch (err) {
      console.error("Failed to update motion detection settings:", err)
      alert("Unable to save motion detection settings. Please try again.")
    } finally {
      setMotionSaving(false)
    }
  }

  const handleMotionTestOpenChange = (open: boolean) => {
    setMotionTestOpen(open)
    if (!open) {
      const url = new URL(window.location.href)
      url.searchParams.delete("motionTest")
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`)
    }
  }

  const needsOptions = form.type === "MULTIPLE_CHOICE" || form.type === "TRUE_FALSE"

  const resetForm = () => {
    setEditingQuestionId(null)
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
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/questions${editingQuestionId ? `/${editingQuestionId}` : ""}`, {
        method: editingQuestionId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: form.question,
          type: form.type,
          points: Number(form.points),
          options: needsOptions ? form.options.map(({ text, isCorrect }) => ({ text, isCorrect })) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to save question"); return }
      setQuestions(prev => editingQuestionId ? prev.map(question => question.id === editingQuestionId ? data : question) : [...prev, data])
      setOpen(false)
      resetForm()
    } catch {
      setError("Question could not be saved. Your edits are still here; please retry.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (qId: string) => {
    if (!confirm("Delete this question? This is allowed only before attempts begin.")) return
    setDeletingId(qId)
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/questions/${qId}`, { method: "DELETE" })
      if (!response.ok) { const failure = await response.json(); alert(failure.error ?? "Unable to delete question."); return }
      setQuestions(prev => prev.filter(q => q.id !== qId))
    } catch { alert("Question was not deleted. Please retry.") }
    finally { setDeletingId(null) }
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
              {questions.length} question{questions.length !== 1 ? "s" : ""} · {totalPoints} total points{assessment?.type !== "REVIEWER" ? ` · ${assessment?.passingScore}% passing` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {assessment?.type === "FINAL_EXAM" && (
            <Dialog open={motionTestOpen} onOpenChange={handleMotionTestOpenChange}>
              <DialogTrigger asChild>
                <Button className="h-9 rounded-xl bg-blue-700 text-white hover:bg-blue-800">
                  <FlaskConical className="mr-2 h-4 w-4" /> Test Motion Detector
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Motion Detector Test</DialogTitle>
                  <DialogDescription>
                    Adjust the final-exam thresholds, test them with this computer&apos;s camera, then save the values learners should use.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="motion-test-enabled" className="text-sm font-semibold text-slate-800">Enable motion detection for this exam</Label>
                      <Checkbox id="motion-test-enabled" checked={editForm.motionDetectionEnabled} onCheckedChange={(value) => setEditForm(previous => ({ ...previous, motionDetectionEnabled: Boolean(value) }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="motion-test-hold">Hold threshold (ms)</Label>
                        <Input id="motion-test-hold" type="number" min="1000" value={editForm.detectionHoldMs} onChange={(event) => setEditForm(previous => ({ ...previous, detectionHoldMs: event.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="motion-test-cooldown">Repeat cooldown (ms)</Label>
                        <Input id="motion-test-cooldown" type="number" min="3000" value={editForm.detectionCooldownMs} onChange={(event) => setEditForm(previous => ({ ...previous, detectionCooldownMs: event.target.value }))} />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        ["detectFaceAbsence", "Missing face"],
                        ["detectMultipleFaces", "Multiple faces"],
                        ["detectGaze", "Looking away"],
                        ["detectPosture", "Posture changes"],
                      ].map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                          <Label htmlFor={`motion-test-${key}`} className="text-xs text-slate-700">{label}</Label>
                          <Checkbox id={`motion-test-${key}`} checked={Boolean(editForm[key as keyof typeof editForm])} onCheckedChange={(value) => setEditForm(previous => ({ ...previous, [key]: Boolean(value) }))} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {editForm.motionDetectionEnabled ? (
                    <MotionThresholdTest
                      config={{
                        holdMs: Math.max(1000, parseInt(editForm.detectionHoldMs) || 2500),
                        cooldownMs: Math.max(3000, parseInt(editForm.detectionCooldownMs) || 12000),
                        detectFaceAbsence: editForm.detectFaceAbsence,
                        detectMultipleFaces: editForm.detectMultipleFaces,
                        detectGaze: editForm.detectGaze,
                        detectPosture: editForm.detectPosture,
                      }}
                    />
                  ) : (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Enable motion detection above to run the test.</p>
                  )}

                  <Button onClick={() => void handleSaveMotionSettings()} disabled={motionSaving} className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                    {motionSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Motion Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Edit Assessment Details Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 h-9">
                <Settings className="h-4 w-4 mr-2" /> Edit Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle>Edit Assessment Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input placeholder="Assessment Title" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={editForm.type} disabled={Boolean(assessment?.bankLockedAt)} onValueChange={v => setEditForm(p => ({ ...p, type: v }))}>
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
                  <Select value={editForm.courseId} disabled>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {editForm.type !== "REVIEWER" && editForm.type !== "RULES_GUIDELINES" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Time Limit (min)</Label>
                      <Input type="number" disabled={Boolean(assessment?.bankLockedAt)} placeholder="No limit" value={editForm.timeLimit} onChange={e => setEditForm(p => ({ ...p, timeLimit: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Passing Score (%)</Label>
                      <Input type="number" disabled={Boolean(assessment?.bankLockedAt)} value={editForm.passingScore} onChange={e => setEditForm(p => ({ ...p, passingScore: e.target.value }))} className="rounded-xl" />
                    </div>
                  </div>
                )}
                {editForm.type !== "REVIEWER" && editForm.type !== "PRACTICE_EXAM" && (
                  <div className="space-y-1.5">
                    <Label>Max Attempts</Label>
                    <Input type="number" min="1" value={editForm.attempts} onChange={e => setEditForm(p => ({ ...p, attempts: e.target.value }))} className="rounded-xl" />
                  </div>
                )}
                <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Assessment availability</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="assessment-start">Start date and time</Label>
                    <Input id="assessment-start" type="datetime-local" value={editForm.startsAt} onChange={event => setEditForm(previous => ({ ...previous, startsAt: event.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="assessment-end">End date and time</Label>
                    <Input id="assessment-end" type="datetime-local" value={editForm.endsAt} onChange={event => setEditForm(previous => ({ ...previous, endsAt: event.target.value }))} />
                  </div>
                  <p className="text-xs text-emerald-800">Times use your device timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). Leave blank for no boundary. End time closes new attempts; existing attempts may resume and finish under their timer.</p>
                </div>
                {/* Score Release Policy settings */}
                {editForm.type !== "REVIEWER" && (
                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score Release Policy</p>
                    
                    <div className="flex items-center justify-between gap-4">
                      <Label className="flex flex-col gap-0.5 cursor-pointer">
                        <span className="font-semibold text-xs text-gray-800">Release Scores Immediately</span>
                        <span className="text-[10px] text-gray-400 font-normal leading-tight">Show results to learners immediately upon completing the exam</span>
                      </Label>
                      <Checkbox
                        checked={editForm.releaseScores}
                        onCheckedChange={(v) => setEditForm(p => ({ ...p, releaseScores: !!v }))}
                      />
                    </div>

                    {!editForm.releaseScores && (
                      <div className="space-y-1.5 pt-2.5 border-t border-slate-200/50">
                        <Label className="text-xs text-gray-600">Scheduled Release Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={editForm.scoresReleasedAt}
                          onChange={(e) => setEditForm(p => ({ ...p, scoresReleasedAt: e.target.value }))}
                          className="rounded-xl h-9 text-xs"
                        />
                        <p className="text-[9px] text-gray-400 leading-snug">
                          Leave blank to only release results manually. Learners will see a "Pending Release" screen.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {editForm.type === "FINAL_EXAM" && (
                  <div className="space-y-3 p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">AI Proctoring Controls</p>
                    {[
                      ["motionDetectionEnabled", "Enable motion detection"],
                      ["detectFaceAbsence", "Detect missing face"],
                      ["detectMultipleFaces", "Detect multiple faces"],
                      ["detectGaze", "Detect looking away"],
                      ["detectPosture", "Detect posture changes"],
                      ["evidenceCaptureEnabled", "Capture incident evidence"],
                      ["requireProctoringConsent", "Require learner consent"],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <Label htmlFor={`proctoring-${key}`} className="text-xs text-gray-700">{label}</Label>
                        <Checkbox id={`proctoring-${key}`} checked={Boolean(editForm[key as keyof typeof editForm])} onCheckedChange={(value) => setEditForm((previous) => ({ ...previous, [key]: Boolean(value) }))} />
                      </div>
                    ))}
                    <div className="grid grid-cols-3 gap-2 border-t border-emerald-100 pt-3">
                      <div className="space-y-1"><Label className="text-[10px]">Hold (ms)</Label><Input type="number" min="1000" value={editForm.detectionHoldMs} onChange={(event) => setEditForm((previous) => ({ ...previous, detectionHoldMs: event.target.value }))} className="h-8 rounded-lg text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Cooldown (ms)</Label><Input type="number" min="3000" value={editForm.detectionCooldownMs} onChange={(event) => setEditForm((previous) => ({ ...previous, detectionCooldownMs: event.target.value }))} className="h-8 rounded-lg text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Retention (days)</Label><Input type="number" min="1" value={editForm.evidenceRetentionDays} onChange={(event) => setEditForm((previous) => ({ ...previous, evidenceRetentionDays: event.target.value }))} className="h-8 rounded-lg text-xs" /></div>
                    </div>
                    <p className="text-[9px] leading-relaxed text-emerald-700/70">Detector alerts require human review. Evidence is retained only for the configured period.</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <RichTextEditor
                    value={editForm.description}
                    onChange={description => setEditForm(previous => ({ ...previous, description }))}
                    placeholder="Add instructions, preparation notes, or exam details..."
                    maxLength={5000}
                    minHeight="140px"
                  />
                </div>
                <Button onClick={handleUpdateAssessment} disabled={editSaving || !editForm.title || !editForm.courseId} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                  {editSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Details
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* CSV Import Dialog */}
          <Dialog open={csvOpen} onOpenChange={(v) => { setCsvOpen(v); if (!v) { setCsvFile(null); setCsvPreview([]); setCsvError(""); setCsvSuccess("") } }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50">
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-[calc(100%-2rem)] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <DialogContent className="rounded-2xl max-w-[calc(100%-2rem)] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuestionId ? "Edit Question" : "Add Question"}</DialogTitle>
            </DialogHeader>
            {editingQuestionId && <p className="text-xs text-gray-600">Edit text, type, points, options, and the correct answer. Editing is locked once attempts exist to protect saved answers and historical scores.</p>}
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

      <nav aria-label="Assessment management sections" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <span aria-current="page" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white"><ListChecks className="h-4 w-4" />Questions</span>
        <button type="button" onClick={() => setEditOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"><Settings className="h-4 w-4" />Details</button>
        <button type="button" onClick={() => setEditOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"><CalendarClock className="h-4 w-4" />Schedule &amp; scoring</button>
        {assessment?.type === "FINAL_EXAM" && <button type="button" onClick={() => setMotionTestOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"><ShieldCheck className="h-4 w-4" />Proctoring</button>}
        <Link href="/dashboard/reports" className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"><BarChart3 className="h-4 w-4" />Results</Link>
      </nav>

      {/* Study Material Upload Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Assessment Study Material (PPT / PDF / Handout)</h2>
              <p className="text-xs text-gray-400">Attach a slide deck, reading guide, or rules document for learners to view.</p>
            </div>
          </div>
          {assessment?.materialUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteMaterial}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs gap-1.5 h-8 animate-fade-in"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove Material
            </Button>
          )}
        </div>

        {assessment?.materialUrl ? (
          <>
            <div className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-100/50 rounded-xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 text-blue-700 flex items-center justify-center rounded-lg font-bold text-xs uppercase shrink-0">
                  {assessment.materialName?.split(".").pop() ?? "FILE"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{assessment.materialName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => setMaterialViewerOpen(true)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium bg-transparent border-0 p-0 cursor-pointer"
                    >
                      <Eye className="h-3 w-3" /> View material
                    </button>
                    <a
                      href={assessment.materialUrl}
                      download
                      className="text-xs text-gray-500 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Download className="h-3 w-3" /> Download material
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Inline Material Viewer Dialog */}
            <Dialog open={materialViewerOpen} onOpenChange={setMaterialViewerOpen}>
              <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 rounded-2xl overflow-hidden [&>button]:hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 bg-blue-100 text-blue-700 flex items-center justify-center rounded-lg font-bold text-[10px] uppercase shrink-0">
                      {assessment.materialName?.split(".").pop() ?? "FILE"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{assessment.materialName}</p>
                      <p className="text-[10px] text-gray-400">Study Material Preview</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 h-8">
                      <a href={assessment.materialUrl} download>
                        <Download className="h-3 w-3" /> Download
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setMaterialViewerOpen(false)} className="rounded-xl h-8 w-8 p-0">
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 bg-gray-900 relative" style={{ height: 'calc(90vh - 56px)' }}>
                  {assessment.materialName?.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={assessment.materialUrl}
                      className="w-full h-full border-0"
                      title="Material Viewer"
                    />
                  ) : (
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(window.location.origin + assessment.materialUrl)}&embedded=true`}
                      className="w-full h-full border-0"
                      title="Material Viewer"
                      onError={() => {}}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-100 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-colors">
            <input
              type="file"
              accept=".ppt,.pptx,.pdf,.doc,.docx,.txt"
              className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadMaterial(f) }}
              disabled={uploadingMaterial}
            />
            {uploadingMaterial ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-blue-700">Uploading material...</p>
              </>
            ) : (
              <>
                <Upload className="h-7 w-7 text-gray-400" />
                <p className="text-sm text-gray-500 font-medium">Click to upload material (PPT, PDF, Doc)</p>
                <p className="text-xs text-gray-400">Supported formats: .ppt, .pptx, .pdf, .doc, .docx, up to 10MB</p>
              </>
            )}
          </label>
        )}
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
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingQuestionId(q.id)
                    setForm({ question: q.question, type: q.type, points: String(q.points), options: q.options.map(option => ({ text: option.text, isCorrect: option.isCorrect })) })
                    setError("")
                    setOpen(true)
                  }}>Edit</Button>
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
