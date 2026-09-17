"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { isWrittenQuestion } from "@/lib/manual-grading"

type Submission = {
  id: string; score: number; passed: boolean; completedAt: string; gradedAt: string | null; attempt: number
  user: { firstName: string; lastName: string }
  assessment: { title: string; passingScore: number; course: { title: string } }
  answers: { id: string; content: string; points: number; feedback: string | null; question: { question: string; type: string; points: number } }[]
}
type Queue = { data: Submission[]; total: number; page: number; totalPages: number }
async function fetchQueue(url: string): Promise<Queue> {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? "Unable to load grading queue")
  return data
}

function GradeForm({ submission, onSaved, onClose }: { submission: Submission; onSaved: () => void; onClose: () => void }) {
  const written = submission.answers.filter(answer => isWrittenQuestion(answer.question.type))
  const [marks, setMarks] = useState<Record<string, { points: string; feedback: string }>>(() => Object.fromEntries(written.map(answer => [answer.id, { points: submission.gradedAt ? String(answer.points) : "", feedback: answer.feedback ?? "" }])))
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  async function save() {
    setError("")
    for (const answer of written) {
      const mark = marks[answer.id]
      if (!mark.points.trim() || !Number.isFinite(Number(mark.points)) || Number(mark.points) < 0 || Number(mark.points) > answer.question.points) {
        setError("Enter valid points for every written answer, including zero for no credit.")
        return
      }
    }
    if (!window.confirm("Finalize these grades? Finalized marks cannot be changed in this workflow.")) return
    setSaving(true)
    try {
      const response = await fetch(`/api/grading/${submission.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: written.map(answer => ({ answerId: answer.id, points: Number(marks[answer.id].points), feedback: marks[answer.id].feedback })) }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Grades were not saved")
      onSaved()
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Grades were not saved; please retry.") }
    finally { setSaving(false) }
  }
  return <section className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{submission.assessment.title}</h2><p className="text-sm text-slate-600">{submission.user.firstName} {submission.user.lastName} · Attempt {submission.attempt}</p></div><Button variant="outline" onClick={onClose} disabled={saving}>Close review</Button></div>
    <p className="text-xs text-slate-600">Choice-question points are preserved. Final score includes all question points; passing score is {submission.assessment.passingScore}%. Learners see scores and feedback only after grading and score release.</p>
    {submission.gradedAt && <p role="status" className="text-sm font-semibold text-emerald-800">Finalized: {submission.score.toFixed(1)}% · {submission.passed ? "Passed" : "Not passed"}</p>}
    {written.map((answer, index) => <div key={answer.id} className="space-y-3 rounded-xl bg-slate-50 p-4">
      <h3 className="text-sm font-semibold">{index + 1}. {answer.question.question}</h3><p className="whitespace-pre-wrap break-words text-sm text-slate-700">{answer.content || "No answer submitted"}</p>
      <div className="space-y-1"><Label htmlFor={`points-${answer.id}`}>Points (maximum {answer.question.points})</Label><Input id={`points-${answer.id}`} type="number" min={0} max={answer.question.points} step="any" value={marks[answer.id].points} disabled={saving || Boolean(submission.gradedAt)} onChange={event => setMarks(previous => ({ ...previous, [answer.id]: { ...previous[answer.id], points: event.target.value } }))} /></div>
      <div className="space-y-1"><Label htmlFor={`feedback-${answer.id}`}>Instructor feedback</Label><Textarea id={`feedback-${answer.id}`} maxLength={2000} value={marks[answer.id].feedback} disabled={saving || Boolean(submission.gradedAt)} onChange={event => setMarks(previous => ({ ...previous, [answer.id]: { ...previous[answer.id], feedback: event.target.value } }))} /></div>
    </div>)}
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {!submission.gradedAt && <Button onClick={() => void save()} disabled={saving || !written.length} className="bg-emerald-600 text-white hover:bg-emerald-700">{saving ? "Saving grades…" : "Finalize grades"}</Button>}
  </section>
}

export default function GradingPage() {
  const { data: session } = useSession()
  const allowed = ["ADMIN", "INSTRUCTOR"].includes(session?.user?.role ?? "")
  const [status, setStatus] = useState("pending")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Submission | null>(null)
  const { data, error, isLoading, mutate } = useSWR<Queue>(allowed ? `/api/grading?status=${status}&page=${page}` : null, fetchQueue)
  if (!allowed) return <p className="text-sm text-slate-600">Grading is available only to admins and course instructors.</p>
  return <div className="mx-auto max-w-5xl space-y-5">
    <div><h1 className="text-2xl font-bold text-slate-900">Grading Queue</h1><p className="mt-1 text-sm text-slate-600">Review submitted short answers and essays. Instructors see only their own courses.</p></div>
    <div className="flex flex-wrap items-center gap-3"><Label htmlFor="grading-status">Status</Label><select id="grading-status" className="rounded-xl border bg-white p-2 text-sm" value={status} onChange={event => { setStatus(event.target.value); setPage(1); setSelected(null) }}><option value="pending">Awaiting grading</option><option value="graded">Finalized grades</option></select><Button variant="outline" onClick={() => void mutate()}>Refresh queue</Button></div>
    {error ? <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Unable to load grading queue. <Button variant="outline" onClick={() => void mutate()}>Retry</Button></div> : isLoading || !data ? <p role="status">Loading submissions…</p> : <>
      <p className="text-sm text-slate-600">{data.total} matching submissions</p>
      {data.data.length ? <div className="space-y-2">{data.data.map(submission => <div key={submission.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"><div><p className="font-semibold">{submission.user.firstName} {submission.user.lastName}</p><p className="text-sm text-slate-600">{submission.assessment.title} · {submission.assessment.course.title}</p><p className="text-xs text-slate-500">Submitted {new Date(submission.completedAt).toLocaleString()}</p></div><Button variant="outline" onClick={() => setSelected(submission)}>{submission.gradedAt ? "View grades" : "Review answers"}</Button></div>)}</div> : <section className="space-y-3 rounded-2xl border bg-white p-6">
        <h2 className="font-semibold text-slate-900">{page > 1 ? "No submissions on this page" : status === "pending" ? "No answers waiting for review" : "No finalized grades yet"}</h2>
        <p className="max-w-2xl text-sm text-slate-600">{status === "pending" ? "Short answers and essays appear here after learners submit their assessments. Automatically graded choice questions do not need manual review." : "Completed manual reviews appear here once you finalize their marks. Switch to Awaiting grading to review submitted written answers."}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/dashboard/courses">Browse courses & assessments</Link></Button>
          <Button variant="outline" onClick={() => { setStatus(status === "pending" ? "graded" : "pending"); setPage(1); setSelected(null) }}>{status === "pending" ? "View finalized grades" : "View awaiting grading"}</Button>
          {page > 1 && <Button variant="outline" onClick={() => { setPage(1); setSelected(null) }}>Return to first page</Button>}
        </div>
      </section>}
      {(data.totalPages > 1 || page > 1) && <div className="flex items-center justify-between gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => { setPage(previous => previous - 1); setSelected(null) }}>Previous</Button><p className="text-xs text-slate-600">Page {page} of {Math.max(1, data.totalPages)}</p><Button variant="outline" disabled={page >= data.totalPages} onClick={() => { setPage(previous => previous + 1); setSelected(null) }}>Next</Button></div>}
    </>}
    {selected && <GradeForm key={selected.id} submission={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); void mutate() }} />}
  </div>
}
