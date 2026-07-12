"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Award, AlertTriangle, Loader2, Flag, ClipboardList,
} from "lucide-react"
import { FloatingCalculator } from "@/components/ui/floating-calculator"
import { ExamChat } from "@/components/ui/exam-chat"

type Option = { id: string; text: string; isCorrect: boolean; order: number }
type Question = { id: string; question: string; type: string; points: number; order: number; options: Option[] }
type Assessment = {
  id: string; title: string; description: string; type: string
  timeLimit: number | null; attempts: number | null; passingScore: number
  course: { id: string; title: string }
  questions: Question[]
  _count: { results: number }
}

type AnswerMap = Record<string, { selectedOptionId?: string; content?: string }>

export default function TakeAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const currentUserId = (session?.user as any)?.id ?? ""
  const currentUserRole = (session?.user as any)?.role ?? "LEARNER"

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<"intro" | "taking" | "submitting" | "result">("intro")
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [startedAt, setStartedAt] = useState<string>("")
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/assessments/${id}`).then(r => r.json()).then(data => {
      setAssessment(data)
      setAttemptCount(data._count?.results ?? 0)
    }).finally(() => setLoading(false))
  }, [id])

  const handleSubmit = useCallback(async () => {
    if (!assessment) return
    setPhase("submitting")
    const payload = assessment.questions.map(q => ({
      questionId: q.id,
      ...answers[q.id],
    }))
    const res = await fetch(`/api/assessments/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: payload, startedAt, sessionId }),
    })
    const data = await res.json()
    setResult(data)
    setPhase("result")
  }, [assessment, answers, id, startedAt, sessionId])

  // Countdown timer
  useEffect(() => {
    if (phase !== "taking" || timeLeft === null) return
    if (timeLeft <= 0) { handleSubmit(); return }
    const t = setTimeout(() => setTimeLeft(s => (s ?? 0) - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft, handleSubmit])

  const startExam = async () => {
    const now = new Date().toISOString()
    setStartedAt(now)
    if (assessment?.timeLimit) setTimeLeft(assessment.timeLimit * 60)
    setPhase("taking")
    // Create ExamSession so proctor can monitor
    try {
      const res = await fetch(`/api/assessments/${id}/session`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setSessionId(data.sessionId)
      }
    } catch (_) {
      // Non-blocking — exam continues even if session tracking fails
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const answered = Object.keys(answers).length
  const total = assessment?.questions.length ?? 0
  const progress = total > 0 ? (answered / total) * 100 : 0

  const isPractice = assessment?.type === "PRACTICE_EXAM"
  const isFinal = assessment?.type === "FINAL_EXAM"
  const attemptsLeft = assessment?.attempts != null ? assessment.attempts - attemptCount : null
  const canRetake = isPractice || (isFinal && (attemptsLeft === null || attemptsLeft > 0))

  const typeColors: Record<string, string> = {
    PRACTICE_EXAM: "bg-blue-100 text-blue-700",
    FINAL_EXAM: "bg-rose-100 text-rose-700",
    QUIZ: "bg-amber-100 text-amber-700",
  }
  const typeLabels: Record<string, string> = {
    PRACTICE_EXAM: "Practice Exam",
    FINAL_EXAM: "Final Exam",
    QUIZ: "Quiz",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!assessment) {
    return <div className="text-center py-20 text-gray-400">Assessment not found.</div>
  }

  // ── INTRO ──────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${typeColors[assessment.type] ?? "bg-gray-100 text-gray-600"}`}>
            {typeLabels[assessment.type] ?? assessment.type}
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-3">{assessment.title}</h1>
          <p className="text-gray-500 mt-1">{assessment.course.title}</p>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Exam Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Questions", value: assessment.questions.length },
                { label: "Passing Score", value: `${assessment.passingScore}%` },
                { label: "Time Limit", value: assessment.timeLimit ? `${assessment.timeLimit} min` : "No limit" },
                { label: "Attempts", value: isPractice ? "Unlimited" : (assessment.attempts ?? 1) },
              ].map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>

            {assessment.description && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{assessment.description}</p>
            )}

            {isFinal && (
              <div className="flex gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-sm text-rose-700">
                  <strong>Final Exam:</strong> Passing this exam will automatically issue your certificate.
                  {attemptsLeft !== null && <span> You have <strong>{attemptsLeft}</strong> attempt{attemptsLeft !== 1 ? "s" : ""} remaining.</span>}
                </div>
              </div>
            )}

            {isPractice && (
              <div className="flex gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700"><strong>Practice Exam:</strong> Retake as many times as you need. Results don&apos;t affect your certificate.</p>
              </div>
            )}

            {assessment.questions.length === 0 ? (
              <div className="text-center py-4 text-amber-600 text-sm font-medium">
                <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                No questions have been added yet.
              </div>
            ) : (
              <Button
                onClick={startExam}
                disabled={!canRetake}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-semibold"
              >
                {canRetake ? "Start Exam" : "No attempts remaining"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── TAKING ─────────────────────────────────────────────
  if (phase === "taking" && assessment.questions.length > 0) {
    const q = assessment.questions[current]
    const isFlagged = flagged.has(q.id)
    const answeredCount = Object.keys(answers).length
    const flaggedCount = flagged.size
    const unansweredCount = total - answeredCount

    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColors[assessment.type]}`}>
              {typeLabels[assessment.type] ?? assessment.type}
            </span>
            <span className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">{assessment.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1 rounded-xl ${timeLeft < 60 ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-700"}`}>
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeLeft)}
              </div>
            )}
            <Button
              size="sm" variant="outline"
              onClick={() => setConfirmSubmit(true)}
              className="rounded-xl text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Submit
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Question {current + 1} of {total}</span>
            <span>{answeredCount} of {total} answered</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Two-column layout: Question + Palette */}
        <div className="flex gap-4 items-start">

          {/* ── Left: Question Card ────────────────────────────────────── */}
          <div className="flex-1 space-y-4 min-w-0">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      {current + 1}
                    </span>
                    <p className="text-gray-900 font-medium leading-relaxed">{q.question}</p>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setFlagged(prev => { const n = new Set(prev); isFlagged ? n.delete(q.id) : n.add(q.id); return n })}
                    className={`h-8 w-8 rounded-xl shrink-0 ${isFlagged ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-400"}`}
                    title={isFlagged ? "Unflag question" : "Flag for review"}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>

                {(q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") && (
                  <div className="space-y-2.5 ml-10">
                    {q.options.map((opt) => {
                      const selected = answers[q.id]?.selectedOptionId === opt.id
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: { selectedOptionId: opt.id } }))}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all duration-150 font-medium ${
                            selected
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                              : "border-gray-100 bg-gray-50 text-gray-700 hover:border-emerald-200 hover:bg-emerald-50/40"
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 mr-3 text-xs font-bold transition-all ${selected ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 text-gray-400"}`}>
                            {selected ? "✓" : String.fromCharCode(65 + q.options.indexOf(opt))}
                          </span>
                          {opt.text}
                        </button>
                      )
                    })}
                  </div>
                )}

                {q.type === "SHORT_ANSWER" && (
                  <textarea
                    className="w-full ml-10 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    rows={4}
                    placeholder="Type your answer here..."
                    value={answers[q.id]?.content ?? ""}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: { content: e.target.value } }))}
                  />
                )}
              </CardContent>
            </Card>

            {/* Prev / Next nav */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrent(c => c - 1)} disabled={current === 0} className="rounded-xl gap-1.5">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              {current < total - 1 ? (
                <Button onClick={() => setCurrent(c => c + 1)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => setConfirmSubmit(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                  Finish
                </Button>
              )}
            </div>
          </div>

          {/* ── Right: Question Palette ────────────────────────────────── */}
          <div className="w-56 shrink-0 sticky top-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question Palette</p>

                {/* Grid of question numbers */}
                <div className="grid grid-cols-5 gap-1.5">
                  {assessment.questions.map((sq, i) => {
                    const isAnswered = !!answers[sq.id]
                    const isFlaggedQ = flagged.has(sq.id)
                    const isCurrent  = i === current
                    return (
                      <button
                        key={sq.id}
                        onClick={() => setCurrent(i)}
                        title={`Question ${i + 1}${ isAnswered ? " · Answered" : "" }${ isFlaggedQ ? " · Flagged" : "" }`}
                        className={`w-full aspect-square rounded-lg text-xs font-bold transition-all duration-150 ${
                          isCurrent   ? "ring-2 ring-emerald-500 bg-emerald-500 text-white scale-110 shadow" :
                          isAnswered && isFlaggedQ ? "bg-amber-400 text-white" :
                          isAnswered  ? "bg-emerald-500 text-white" :
                          isFlaggedQ  ? "bg-amber-100 text-amber-700 border border-amber-300" :
                                        "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  {[
                    { color: "bg-emerald-500", label: `Answered (${answeredCount})` },
                    { color: "bg-amber-100 border border-amber-300", label: `Flagged (${flaggedCount})` },
                    { color: "bg-gray-100",    label: `Unanswered (${unansweredCount})` },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-sm shrink-0 ${color}`} />
                      <span className="text-[11px] text-gray-500">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <Button
                  onClick={() => setConfirmSubmit(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
                  size="sm"
                >
                  Submit Exam
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit confirmation */}
        <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
              <AlertDialogDescription>
                You have answered <strong>{answeredCount}</strong> of <strong>{total}</strong> questions.
                {answeredCount < total && <span className="text-amber-600"> {total - answeredCount} question{total - answeredCount > 1 ? "s" : ""} still unanswered.</span>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Review</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                Submit Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <FloatingCalculator show={isPractice || isFinal} />
        <ExamChat
          sessionId={sessionId}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          show={isFinal}
        />
      </div>
    )
  }

  // ── SUBMITTING ─────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <p className="text-gray-500 font-medium">Submitting your answers…</p>
      </div>
    )
  }

  // ── RESULT ─────────────────────────────────────────────
  if (phase === "result" && result) {
    const passed = result.passed
    const pendingReview = result.hasOpenEnded
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Card className={`border-0 shadow-xl overflow-hidden`}>
          <div className={`h-2 w-full ${pendingReview ? "bg-gradient-to-r from-amber-400 to-orange-500" : passed ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-red-400 to-rose-500"}`} />
          <CardContent className="p-8 text-center space-y-4">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg ${pendingReview ? "bg-gradient-to-br from-amber-400 to-orange-500" : passed ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-red-500 to-rose-600"}`}>
              {pendingReview ? <ClipboardList className="h-10 w-10 text-white" /> : passed ? <CheckCircle className="h-10 w-10 text-white" /> : <XCircle className="h-10 w-10 text-white" />}
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">{result.score.toFixed(1)}%</h2>
              <p className={`text-lg font-bold mt-1 ${pendingReview ? "text-amber-600" : passed ? "text-emerald-600" : "text-red-500"}`}>
                {pendingReview ? "Pending Review" : passed ? "Passed!" : "Not Passed"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {result.earnedPoints} / {result.totalPoints} points · Attempt #{result.attempt}
              </p>
            </div>

            {pendingReview && (
              <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-left">
                <ClipboardList className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  <strong>Manual Review Required:</strong> This assessment contains open-ended questions that need to be reviewed by your instructor before a final score is given.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-400">Passing Score</p>
                <p className="font-bold text-gray-900">{assessment.passingScore}%</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-400">Your Score</p>
                <p className={`font-bold ${passed ? "text-emerald-600" : "text-red-500"}`}>{result.score.toFixed(1)}%</p>
              </div>
            </div>

            {result.certificate && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
                <Award className="h-8 w-8 text-violet-600 shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-violet-900 text-sm">Certificate Issued!</p>
                  <p className="text-xs text-violet-600">{result.certificate.certificateNumber}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push("/dashboard/assessments")} className="flex-1 rounded-xl">
                Back to Assessments
              </Button>
              {isPractice && (
                <Button
                  onClick={() => { setPhase("intro"); setAnswers({}); setCurrent(0); setFlagged(new Set()); setResult(null); setSessionId(null); setAttemptCount(c => c + 1) }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  Retake
                </Button>
              )}
              {result.certificate && (
                <Button onClick={() => router.push("/dashboard/certificates")} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
                  View Certificate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── #9 Question Review ──────────────────────────────────────────── */}
        {isPractice && assessment.questions.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
                Answer Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessment.questions.map((q, i) => {
                const userAnswer = answers[q.id]
                const selectedOpt = q.options.find(o => o.id === userAnswer?.selectedOptionId)
                const correctOpt  = q.options.find(o => o.isCorrect)
                const isCorrect   = selectedOpt?.isCorrect === true
                const hasMultiChoice = q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE"

                return (
                  <div key={q.id} className={`p-4 rounded-2xl border-2 ${
                    !userAnswer ? "border-gray-100 bg-gray-50" :
                    isCorrect   ? "border-emerald-200 bg-emerald-50" :
                                  "border-red-200 bg-red-50"
                  }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                        !userAnswer ? "bg-gray-200 text-gray-500" :
                        isCorrect   ? "bg-emerald-500 text-white" :
                                      "bg-red-500 text-white"
                      }`}>{i + 1}</span>
                      <p className="text-sm font-medium text-gray-800 leading-relaxed">{q.question}</p>
                      <span className="ml-auto shrink-0">
                        {!userAnswer ? <span className="text-xs text-gray-400 font-medium">Not answered</span>
                          : isCorrect ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                                      : <XCircle className="h-5 w-5 text-red-500" />}
                      </span>
                    </div>

                    {hasMultiChoice && (
                      <div className="ml-9 space-y-1.5">
                        {q.options.map(opt => {
                          const isSelected = opt.id === userAnswer?.selectedOptionId
                          const isRight    = opt.isCorrect
                          return (
                            <div key={opt.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                              isRight && isSelected ? "bg-emerald-200 text-emerald-800" :
                              isRight              ? "bg-emerald-100 text-emerald-700" :
                              isSelected && !isRight ? "bg-red-100 text-red-700 line-through" :
                                                       "text-gray-500"
                            }`}>
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isRight ? "border-emerald-500 bg-emerald-500 text-white" :
                                isSelected ? "border-red-400 bg-red-400 text-white" :
                                             "border-gray-300"
                              }`}>
                                {isRight ? "✓" : isSelected ? "✗" : ""}
                              </span>
                              {opt.text}
                              {isRight && <span className="ml-auto text-emerald-600 font-semibold">Correct</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {q.type === "SHORT_ANSWER" && userAnswer?.content && (
                      <div className="ml-9 mt-2">
                        <p className="text-xs text-gray-500 font-medium mb-1">Your answer:</p>
                        <p className="text-sm text-gray-700 bg-white rounded-xl px-3 py-2 border border-gray-200">{userAnswer.content}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return null
}
