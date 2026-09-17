"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"

type Incident = { id: string; sessionId: string; type: string; severity: string; description: string; createdAt: string; reviewStatus: string; reviewNotes: string | null; reviewedByName: string | null; session: { user: { firstName: string; lastName: string }; assessment: { title: string } } }
async function load(url: string): Promise<{ incidents: Incident[]; total: number }> {
  const response = await fetch(url, { cache: "no-store" })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Unable to load incidents")
  return data
}
function IncidentReview({ incident, onSaved }: { incident: Incident; onSaved: () => void }) {
  const [status, setStatus] = useState(incident.reviewStatus)
  const [notes, setNotes] = useState(incident.reviewNotes ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const save = async () => {
    setBusy(true); setError("")
    try {
      const response = await fetch(`/api/proctor/events/${incident.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewStatus: status, reviewNotes: notes }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Review was not saved")
      onSaved()
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Review was not saved") }
    finally { setBusy(false) }
  }
  return <article className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-900">{incident.session.user.firstName} {incident.session.user.lastName}</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${incident.severity === "HIGH" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>{incident.severity} · {incident.reviewStatus.replaceAll("_", " ")}</span></div>
    <p className="mt-1 text-xs text-slate-500">{incident.session.assessment.title} · {new Date(incident.createdAt).toLocaleString()}</p>
    <p className="mt-2 text-xs text-slate-700"><span className="font-semibold">{incident.type.replaceAll("_", " ")}:</span> {incident.description}</p>
    <Link href={`/dashboard/proctor/${incident.sessionId}`} className="mt-2 inline-block text-xs font-semibold text-[#105C2E] underline">View evidence and chat</Link>
    <div className="mt-3 grid items-end gap-2 sm:grid-cols-[10rem_1fr_auto]">
      <label className="text-xs text-slate-600">Review status<select value={status} disabled={busy} onChange={event => setStatus(event.target.value)} className="mt-1 w-full rounded-lg border p-2">{["PENDING", "REVIEWED", "FALSE_POSITIVE", "CONFIRMED", "ESCALATED"].map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <label className="text-xs text-slate-600">Review notes<textarea value={notes} disabled={busy} maxLength={1000} onChange={event => setNotes(event.target.value)} rows={2} className="mt-1 block w-full rounded-lg border p-2" placeholder="Record the evidence and reason for your decision" /></label>
      <Button disabled={busy} onClick={() => void save()} className="bg-[#105C2E] text-white">{busy ? "Saving…" : "Save review"}</Button>
    </div>
    {incident.reviewedByName && <p className="mt-2 text-xs text-slate-500">Last reviewed by {incident.reviewedByName}</p>}
    {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
  </article>
}

export function IncidentQueue() {
  const [filter, setFilter] = useState("OPEN")
  const { data, error, mutate, isLoading } = useSWR(`/api/proctor/incidents?filter=${filter}`, load, { refreshInterval: 10000 })
  return <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">Incident review queue</h2><p className="mt-1 text-xs text-slate-500">High-severity alerts first, oldest first. Alerts require human review; they are not automatic cheating decisions.</p></div><label className="text-xs text-slate-600">Show<select value={filter} onChange={event => setFilter(event.target.value)} className="ml-2 rounded-lg border bg-white p-2">{["OPEN", "PENDING", "ESCALATED", "RESOLVED"].map(value => <option key={value} value={value}>{value}</option>)}</select></label></div>
    {isLoading && <p role="status" className="mt-4 text-xs">Loading incidents…</p>}
    {error && <p role="alert" className="mt-4 text-xs text-rose-700">{error.message} <button onClick={() => void mutate()} className="underline">Retry</button></p>}
    {data && <><p role="status" className="my-3 text-xs text-slate-500">Showing {data.incidents.length} of {data.total} incidents. Reviewing an item makes room for the next queued item.</p><div className="max-h-[38rem] space-y-3 overflow-y-auto">{data.incidents.length ? data.incidents.map(incident => <IncidentReview key={`${incident.id}-${incident.reviewStatus}-${incident.reviewNotes}`} incident={incident} onSaved={() => void mutate()} />) : <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">No incidents in this view.</p>}</div></>}
  </section>
}
