"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, RefreshCw } from "lucide-react"
import { parseReportRange, type ReportSummary } from "@/lib/reporting"

async function fetchReport(url: string): Promise<ReportSummary> {
  const response = await fetch(url, { cache: "no-store" })
  const data = await response.json()
  if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Please sign in again." : data.error || "Unable to load reports")
  if (!data.summary || !Array.isArray(data.activity)) throw new Error("Incomplete report response. Please retry.")
  return data
}
const rate = (value: number | null) => value === null ? "—" : `${value.toFixed(1)}%`
export default function ReportsPage() {
  const { data: session, status } = useSession()
  const role = session?.user?.role?.toUpperCase()
  const allowed = ["ADMIN", "INSTRUCTOR", "LEARNER"].includes(role ?? "")
  const [filters, setFilters] = useState(() => {
    const range = parseReportRange(new URLSearchParams())
    return { start: range.start, end: range.end }
  })
  const [draft, setDraft] = useState(filters)
  const [exporting, setExporting] = useState<string | null>(null)
  const [exportError, setExportError] = useState("")
  const query = new URLSearchParams(filters).toString()
  const { data, error, isLoading, isValidating, mutate } = useSWR<ReportSummary>(allowed ? `/api/reports?${query}` : null, fetchReport)
  const download = async (type: string) => {
    setExporting(type); setExportError("")
    try {
      const response = await fetch(`/api/reports?${query}&export=${type}`, { cache: "no-store" })
      if (!response.ok) { const result = await response.json(); throw new Error(result.error || "Export failed") }
      if (!response.headers.get("content-type")?.includes("text/csv")) throw new Error("The export was not a CSV file")
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement("a")
      link.href = url; link.download = `cpace-${type}-${filters.start}-${filters.end}.csv`
      document.body.appendChild(link); link.click(); link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (failure) { setExportError(failure instanceof Error ? failure.message : "Export failed. Please retry.") }
    finally { setExporting(null) }
  }
  if (status === "loading") return <p role="status" className="py-20 text-center text-sm">Checking your session…</p>
  if (!allowed) return <div className="space-y-3 py-20 text-center"><h1 className="text-xl font-bold">Reports unavailable</h1><p className="text-sm text-slate-500">{role === "PROCTOR" ? "Your assigned monitoring information is in Exam Monitor." : "Please sign in to view your reports."}</p><Button asChild><Link href={role === "PROCTOR" ? "/dashboard/proctor" : "/login"}>{role === "PROCTOR" ? "Open Exam Monitor" : "Sign in"}</Link></Button></div>
  const metrics = data ? [
    { title: "Enrollments", value: data.summary.enrollments, caption: `${data.summary.completed} currently completed` },
    { title: "Completion rate", value: rate(data.summary.completionRate), caption: "Current status of the enrollment cohort" },
    { title: "Pass rate", value: rate(data.summary.passRate), caption: `${data.summary.passed} / ${data.summary.gradedAttempts} eligible attempts` },
    { title: "Average score", value: rate(data.summary.averageScore), caption: `${data.summary.attempts} total submitted attempts` },
  ] : []
  const max = Math.max(1, ...(data?.activity.map(point => point.value) ?? []))
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">CPACE / Analytics</p><h1 className="mt-1 text-2xl font-bold">{role === "LEARNER" ? "My learning report" : "Reports & Analytics"}</h1><p className="mt-2 text-sm text-slate-500">{role === "ADMIN" ? "Platform-wide" : role === "INSTRUCTOR" ? "Your assigned courses only" : "Your own learning only"} · Philippine time (UTC+8).</p></div><Button variant="outline" disabled={isValidating} onClick={() => void mutate()} className="gap-2"><RefreshCw className="h-4 w-4" />Refresh report</Button></div>
    <form className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4" onSubmit={event => { event.preventDefault(); setFilters(draft); setExportError("") }}>
      <label className="text-xs font-semibold text-slate-600">Start date<input type="date" required value={draft.start} onChange={event => setDraft(previous => ({ ...previous, start: event.target.value }))} className="mt-1 block rounded-lg border p-2" /></label>
      <label className="text-xs font-semibold text-slate-600">End date<input type="date" required value={draft.end} onChange={event => setDraft(previous => ({ ...previous, end: event.target.value }))} className="mt-1 block rounded-lg border p-2" /></label>
      <Button type="submit" className="bg-[#105C2E] text-white">Apply dates</Button><p className="text-xs text-slate-500">Up to 366 days. Default: last 30 days.</p>
    </form>
    {error ? <div role="alert" className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-5"><p className="text-sm text-amber-900">{error.message}</p><Button variant="outline" onClick={() => void mutate()}>Retry reports</Button><Link href="/login" className="ml-3 text-sm underline">Sign in again</Link></div>
      : isLoading || !data ? <p role="status" className="flex items-center justify-center gap-2 py-16 text-sm"><Loader2 className="h-5 w-5 animate-spin" />Loading real report data…</p>
      : <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric => <Card key={metric.title} className="gap-0 rounded-2xl py-0"><CardContent className="p-5"><p className="text-xs font-semibold uppercase text-slate-500">{metric.title}</p><p className="my-3 text-3xl font-bold">{metric.value}</p><p className="text-xs text-slate-500">{metric.caption}</p></CardContent></Card>)}</div>
        <p className="text-xs leading-relaxed text-slate-500">{data.range.start} to {data.range.end} · Completion: completed / all enrollments started in the range, including dropped/suspended. Pass rate counts finalized attempts, not unique learners. {data.summary.manualReviewSubmissions} submissions await manual grading and are excluded from score metrics. {role === "LEARNER" && "Unreleased scores and feedback are hidden and excluded from your score metrics."}</p>
        <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Daily enrollment activity</CardTitle></CardHeader><CardContent>
          <div className="flex h-40 items-end gap-1 overflow-x-auto border-b border-slate-200" aria-label="Daily enrollment bar chart">{data.activity.map(point => <div key={point.date} className="flex h-full min-w-2 flex-1 items-end" title={`${point.date}: ${point.value} enrollments`}><div className="w-full rounded-t bg-emerald-600" style={{ height: `${point.value / max * 100}%` }} /></div>)}</div>
          <p className="mt-2 text-xs text-slate-500">{data.summary.enrollments ? `${data.summary.enrollments} enrollments in this date range` : "No enrollments in this date range."}</p>
          <details className="mt-3 text-xs text-slate-600"><summary className="cursor-pointer font-semibold">View exact daily counts</summary><div className="mt-2 max-h-48 overflow-y-auto"><table className="w-full text-left"><caption className="sr-only">Daily enrollment counts in Philippine time</caption><thead><tr><th scope="col">Date</th><th scope="col">Enrollments</th></tr></thead><tbody>{data.activity.map(point => <tr key={point.date}><td className="py-1">{point.date}</td><td>{point.value}</td></tr>)}</tbody></table></div></details>
        </CardContent></Card>
        <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Course performance</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[38rem] text-left text-xs"><caption className="sr-only">Course completion and attempt pass rates</caption><thead className="border-b text-slate-500"><tr>{["Course", "Enrollments", "Completed", "Completion rate", "Attempts", "Pass rate"].map(title => <th scope="col" key={title} className="p-3">{title}</th>)}</tr></thead><tbody>{data.courses.map(course => <tr key={course.id} className="border-b border-slate-100"><th scope="row" className="p-3 font-semibold">{course.title}</th><td className="p-3">{course.enrollments}</td><td className="p-3">{course.completed}</td><td className="p-3">{rate(course.completionRate)}</td><td className="p-3">{course.attempts}</td><td className="p-3">{rate(course.passRate)}</td></tr>)}</tbody></table></div>{!data.courses.length && <p className="py-6 text-center text-sm text-slate-500">No courses in your report scope.</p>}</CardContent></Card>
        <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Recent submissions</CardTitle></CardHeader><CardContent className="space-y-2">{data.results.length ? data.results.map(result => <div key={result.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-semibold">{result.title}</p><p className="text-xs text-slate-500">{result.courseTitle} · {new Date(result.completedAt).toLocaleString("en-PH", { timeZone: data.range.timeZone })}</p></div><p className="text-xs font-semibold text-slate-600">{result.manualReview ? "Awaiting manual grading" : role === "LEARNER" && !result.scoresReleased ? "Awaiting score release" : `${rate(result.score)} · ${result.passed ? "Passed" : "Not passed"}`}</p>{Boolean(result.feedback?.length) && <details className="w-full text-sm"><summary className="cursor-pointer font-semibold text-emerald-800">View instructor feedback</summary>{result.feedback?.map((answer, index) => <div key={index} className="mt-2 whitespace-pre-wrap break-words rounded-lg border p-3"><p className="font-medium">{answer.question} · {answer.points}/{answer.maximum} points</p><p className="text-slate-600">{answer.feedback || "No written feedback"}</p></div>)}</details>}</div>) : <p className="py-6 text-center text-sm text-slate-500">No submitted assessments in this date range.</p>}<p className="text-xs text-slate-500">Latest 20 submissions; metrics include all matching submissions.</p></CardContent></Card>
        {role !== "LEARNER" && <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Scoped CSV exports</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-3">{(role === "ADMIN" ? ["users", "enrollments", "results"] : ["enrollments", "results"]).map(type => <Button key={type} variant="outline" disabled={Boolean(exporting)} onClick={() => void download(type)} className="gap-2"><Download className="h-4 w-4" />{exporting === type ? "Preparing…" : `Export ${type}`}</Button>)}</div><p className="mt-3 text-xs text-slate-500">Same dates and role scope. Directory: account creation dates; results: submission dates. Maximum 10,000 rows per file.</p>{exportError && <p role="alert" className="mt-3 text-sm text-rose-700">{exportError}</p>}</CardContent></Card>}
      </>}
  </div>
}
