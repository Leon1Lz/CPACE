"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Download, Trash2, GraduationCap, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export type Incident = {
  id: string
  sessionId: string
  type: string
  severity: string
  description: string
  createdAt: string
  reviewStatus: string
  reviewNotes: string | null
  reviewedByName: string | null
  session: {
    user: { firstName: string; lastName: string; email?: string }
    assessment: {
      title: string
      course?: { id: string; title: string }
    }
  }
}

async function load(url: string): Promise<{ incidents: Incident[]; total: number }> {
  const response = await fetch(url, { cache: "no-store" })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Unable to load incidents")
  return data
}

function getIncidentCourseGroup(incident: Incident): string {
  const title = incident.session?.assessment?.course?.title || incident.session?.assessment?.title || ""
  const code = title.trim().toUpperCase()
  for (const prefix of ["CFMS", "CMMS", "COMS"]) {
    if (code.startsWith(prefix) || code.includes(prefix)) return prefix
  }
  return "Other"
}

function IncidentReview({
  incident,
  onSaved,
  onDeleted,
}: {
  incident: Incident
  onSaved: () => void
  onDeleted: () => void
}) {
  const [status, setStatus] = useState(incident.reviewStatus)
  const [notes, setNotes] = useState(incident.reviewNotes ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)

  const save = async () => {
    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/proctor/events/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus: status, reviewNotes: notes }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Review was not saved")
      onSaved()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Review was not saved")
    } finally {
      setBusy(false)
    }
  }

  const removeSingle = async () => {
    setDeleting(true)
    try {
      const response = await fetch("/api/proctor/incidents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [incident.id] }),
      })
      if (!response.ok) throw new Error("Failed to delete incident")
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete incident")
    } finally {
      setDeleting(false)
    }
  }

  const courseTag = getIncidentCourseGroup(incident)

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900">
            {incident.session.user.firstName} {incident.session.user.lastName}
          </p>
          {incident.session.user.email && (
            <span className="text-xs text-slate-400">({incident.session.user.email})</span>
          )}
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#105C2E] border border-emerald-100">
            {courseTag}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              incident.severity === "HIGH"
                ? "bg-rose-100 text-rose-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {incident.severity} · {incident.reviewStatus.replaceAll("_", " ")}
          </span>
          <Button
            size="icon"
            variant="ghost"
            disabled={deleting}
            onClick={() => void removeSingle()}
            className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
            title="Delete this incident alert"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {incident.session.assessment.title} · {new Date(incident.createdAt).toLocaleString()}
      </p>
      <p className="mt-2 text-xs text-slate-700 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
        <span className="font-semibold text-slate-900">{incident.type.replaceAll("_", " ")}:</span>{" "}
        {incident.description}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <Link
          href={`/dashboard/proctor/${incident.sessionId}`}
          className="inline-block text-xs font-semibold text-[#105C2E] hover:underline"
        >
          View live evidence and session chat →
        </Link>
        {incident.reviewedByName && (
          <p className="text-[11px] text-slate-400">Last reviewed by {incident.reviewedByName}</p>
        )}
      </div>

      <div className="mt-3 grid items-end gap-2 sm:grid-cols-[11rem_1fr_auto] border-t border-slate-100 pt-3">
        <label className="text-xs font-medium text-slate-600">
          Review status
          <select
            value={status}
            disabled={busy || deleting}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold"
          >
            {["PENDING", "REVIEWED", "FALSE_POSITIVE", "CONFIRMED", "ESCALATED"].map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Review notes
          <textarea
            value={notes}
            disabled={busy || deleting}
            maxLength={1000}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-xs"
            placeholder="Record the evidence and reason for your decision"
          />
        </label>
        <Button
          disabled={busy || deleting}
          onClick={() => void save()}
          className="bg-[#105C2E] hover:bg-[#0B4523] text-white text-xs h-9 px-4 rounded-xl"
        >
          {busy ? "Saving…" : "Save review"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-700 font-medium">
          {error}
        </p>
      )}
    </article>
  )
}

export function IncidentQueue() {
  const { toast } = useToast()
  const [filter, setFilter] = useState("OPEN")
  const [courseFilter, setCourseFilter] = useState("ALL")
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  const { data, error, mutate, isLoading } = useSWR(
    `/api/proctor/incidents?filter=${filter}&limit=150`,
    load,
    { refreshInterval: 10000 }
  )

  const rawIncidents = data?.incidents ?? []

  // Dynamic course groups calculation
  const courseGroups = useMemo(() => {
    const counts = new Map<string, number>()
    for (const inc of rawIncidents) {
      const group = getIncidentCourseGroup(inc)
      counts.set(group, (counts.get(group) ?? 0) + 1)
    }
    const preferredOrder = ["CFMS", "CMMS", "COMS"]
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.name)
      const bIndex = preferredOrder.indexOf(b.name)
      if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
      return a.name.localeCompare(b.name)
    })
  }, [rawIncidents])

  // Filtered incidents by course group
  const displayIncidents = useMemo(() => {
    if (courseFilter === "ALL") return rawIncidents
    return rawIncidents.filter((inc) => getIncidentCourseGroup(inc) === courseFilter)
  }, [rawIncidents, courseFilter])

  // Count resolved or reviewed incidents that can be cleared
  const resolvedCount = useMemo(() => {
    return rawIncidents.filter((inc) =>
      ["REVIEWED", "FALSE_POSITIVE", "CONFIRMED"].includes(inc.reviewStatus)
    ).length
  }, [rawIncidents])

  // Extract Report handler
  const extractIncidentReport = () => {
    if (!displayIncidents.length) {
      toast({
        title: "No incidents to export",
        description: "There are no incident records matching your current filter.",
        variant: "destructive",
      })
      return
    }

    const headers = [
      "Incident ID",
      "Timestamp",
      "Learner Name",
      "Learner Email",
      "Course Program",
      "Assessment Title",
      "Alert Type",
      "Severity",
      "Description",
      "Review Status",
      "Review Notes",
      "Reviewed By Staff",
      "Session ID",
    ]

    const rows = displayIncidents.map((inc) => [
      `"${inc.id}"`,
      `"${new Date(inc.createdAt).toLocaleString()}"`,
      `"${inc.session.user.firstName} ${inc.session.user.lastName}"`,
      `"${inc.session.user.email || "N/A"}"`,
      `"${getIncidentCourseGroup(inc)}"`,
      `"${inc.session.assessment.title.replace(/"/g, '""')}"`,
      `"${inc.type}"`,
      `"${inc.severity}"`,
      `"${inc.description.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${inc.reviewStatus}"`,
      `"${(inc.reviewNotes || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${inc.reviewedByName || "Unassigned"}"`,
      `"${inc.sessionId}"`,
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `cpace-incident-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)

    toast({
      title: "Incident report extracted",
      description: `Downloaded report for ${displayIncidents.length} incident record${displayIncidents.length === 1 ? "" : "s"}.`,
    })
  }

  // Clear History handler
  const handleClearHistory = async () => {
    setClearing(true)
    try {
      const response = await fetch("/api/proctor/incidents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter: filter === "RESOLVED" ? "RESOLVED" : "ALL" }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to clear incident history")

      await mutate()
      setClearDialogOpen(false)
      toast({
        title: "Incident history cleared",
        description: `Permanently removed ${result.deleted} incident records.`,
      })
    } catch (err) {
      toast({
        title: "Clear history failed",
        description: err instanceof Error ? err.message : "Could not clear incidents",
        variant: "destructive",
      })
    } finally {
      setClearing(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            Incident Review Queue
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            High-severity alerts first, oldest first. Alerts require human review; they are not automatic cheating decisions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            Status:
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold"
            >
              {[
                { value: "OPEN", label: "Open (Pending & Escalated)" },
                { value: "PENDING", label: "Pending" },
                { value: "ESCALATED", label: "Escalated" },
                { value: "RESOLVED", label: "Resolved" },
                { value: "ALL", label: "All Incidents" },
              ].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={extractIncidentReport}
            className="h-9 rounded-xl border-slate-200 text-xs font-semibold gap-1.5 bg-white hover:bg-slate-50"
            title="Export incident report to CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            Extract Report
          </Button>

          {rawIncidents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
              className="h-9 rounded-xl border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 gap-1.5"
              title="Clear incident records"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              Clear History {resolvedCount > 0 ? `(${resolvedCount})` : ""}
            </Button>
          )}
        </div>
      </div>

      {/* Course Groups Filter */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <GraduationCap className="h-4 w-4 text-[#105C2E]" /> Course groups
          </div>
          <span className="text-[11px] text-slate-400">Filter alerts by program</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCourseFilter("ALL")}
            className={`shrink-0 rounded-xl border px-3.5 py-2 text-left transition ${
              courseFilter === "ALL"
                ? "border-[#105C2E] bg-[#105C2E] text-white shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300"
            }`}
          >
            <span className="block text-xs font-black">All Courses</span>
            <span
              className={`text-[10px] ${
                courseFilter === "ALL" ? "text-green-100" : "text-slate-400"
              }`}
            >
              {rawIncidents.length} alert{rawIncidents.length === 1 ? "" : "s"}
            </span>
          </button>
          {courseGroups.map((group) => (
            <button
              type="button"
              key={group.name}
              onClick={() => setCourseFilter(group.name)}
              className={`min-w-24 shrink-0 rounded-xl border px-3.5 py-2 text-left transition ${
                courseFilter === group.name
                  ? "border-[#105C2E] bg-emerald-50 text-[#105C2E] ring-1 ring-emerald-100"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40"
              }`}
            >
              <span className="block max-w-36 truncate text-xs font-black" title={group.name}>
                {group.name}
              </span>
              <span className="text-[10px] text-slate-400">
                {group.count} alert{group.count === 1 ? "" : "s"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p role="status" className="mt-4 text-xs text-slate-500">Loading incidents…</p>}
      {error && (
        <p role="alert" className="mt-4 text-xs text-rose-700">
          {error.message}{" "}
          <button onClick={() => void mutate()} className="underline font-semibold">
            Retry
          </button>
        </p>
      )}

      {data && (
        <>
          <p role="status" className="my-3 text-xs text-slate-500">
            Showing {displayIncidents.length} of {data.total} incidents
            {courseFilter !== "ALL" ? ` (filtered by ${courseFilter})` : ""}. Reviewing an item makes room for the next queued item.
          </p>
          <div className="max-h-[38rem] space-y-3 overflow-y-auto">
            {displayIncidents.length ? (
              displayIncidents.map((incident) => (
                <IncidentReview
                  key={`${incident.id}-${incident.reviewStatus}-${incident.reviewNotes}`}
                  incident={incident}
                  onSaved={() => void mutate()}
                  onDeleted={() => void mutate()}
                />
              ))
            ) : (
              <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
                No incidents match the selected filters.
              </p>
            )}
          </div>
        </>
      )}

      {/* Clear Incident History Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-600" />
              Clear Incident History
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-sm">
              {filter === "RESOLVED"
                ? `Are you sure you want to permanently delete all resolved incident records?`
                : `Are you sure you want to clear incident records for the "${filter}" queue? Active exam sessions and scores will not be affected.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleClearHistory()
              }}
              disabled={clearing}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              {clearing ? "Clearing…" : "Confirm Clear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
