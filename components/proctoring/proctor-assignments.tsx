"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"

type Assignment = { id: string; proctor: { firstName: string; lastName: string }; course: { title: string }; group: { name: string } | null }
type Options = {
  assignments: Assignment[]
  proctors: { id: string; firstName: string; lastName: string }[]
  courses: { id: string; title: string; groups: { group: { id: string; name: string } }[] }[]
}
async function fetchOptions(url: string): Promise<Options> {
  const response = await fetch(url, { cache: "no-store" })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Unable to load assignments")
  return data
}

export function ProctorAssignments({ isAdmin, onChanged }: { isAdmin: boolean; onChanged: () => void }) {
  const { data, error, mutate, isLoading } = useSWR<Options>("/api/proctor/assignments", fetchOptions, { refreshInterval: 30000 })
  const [proctorId, setProctorId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [groupId, setGroupId] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [removeId, setRemoveId] = useState<string | null>(null)
  const groups = data?.courses.find(course => course.id === courseId)?.groups ?? []
  const change = async (method: "POST" | "DELETE", body: object) => {
    setBusy(true); setMessage("")
    try {
      const response = await fetch("/api/proctor/assignments", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Assignment change failed")
      setMessage(method === "POST" ? "Assignment saved" : "Assignment removed; exam records were preserved")
      setRemoveId(null)
      await mutate()
      onChanged()
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : "Unable to change assignment") }
    finally { setBusy(false) }
  }
  return (
    <details className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm" open={!isAdmin}>
      <summary className="cursor-pointer text-sm font-bold text-[#105C2E]">{isAdmin ? "Manage proctor assignments" : "My monitoring assignments"}</summary>
      <p className="mt-2 text-xs text-slate-500">{isAdmin ? "Admins see every session. Assign proctors to a course, optionally limited to a linked group." : "Only sessions in your assigned courses and groups are available. Ask an admin to update your coverage."}</p>
      {isLoading && <p role="status" className="mt-3 text-xs">Loading assignments…</p>}
      {error && <p role="alert" className="mt-3 text-xs text-rose-700">{error.message} <button onClick={() => void mutate()} className="underline">Retry</button></p>}
      {isAdmin && data && <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={event => { event.preventDefault(); void change("POST", { proctorId, courseId, groupId: groupId || null }) }}>
        <label className="text-xs font-semibold text-slate-600">Proctor<select required value={proctorId} onChange={event => setProctorId(event.target.value)} className="mt-1 block w-full rounded-lg border p-2"><option value="">Choose proctor</option>{data.proctors.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Course<select required value={courseId} onChange={event => { setCourseId(event.target.value); setGroupId("") }} className="mt-1 block w-full rounded-lg border p-2"><option value="">Choose course</option>{data.courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Group<select value={groupId} onChange={event => setGroupId(event.target.value)} className="mt-1 block w-full rounded-lg border p-2"><option value="">All course examinees</option>{groups.map(({ group }) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
        <Button type="submit" disabled={busy || !proctorId || !courseId} className="self-end bg-[#105C2E] text-white">{busy ? "Saving…" : "Assign proctor"}</Button>
      </form>}
      {message && <p role="status" className="mt-3 text-xs text-slate-700">{message}</p>}
      {data && <div className="mt-3 space-y-2">{data.assignments.length ? data.assignments.map(assignment => <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
        <p><span className="font-semibold">{assignment.proctor.firstName} {assignment.proctor.lastName}</span> · {assignment.course.title} · {assignment.group?.name ?? "All examinees"}</p>
        {isAdmin && (removeId === assignment.id ? <div className="flex gap-2"><button disabled={busy} onClick={() => void change("DELETE", { id: assignment.id })} className="font-semibold text-rose-700">Confirm removal</button><button disabled={busy} onClick={() => setRemoveId(null)}>Cancel</button></div> : <button disabled={busy} onClick={() => setRemoveId(assignment.id)} className="text-rose-700">Remove</button>)}
      </div>) : <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">No proctor assignments yet. {isAdmin ? "Add coverage above before proctors start monitoring." : "Real sessions will appear after an admin assigns you. Simulation is still available."}</p>}</div>}
    </details>
  )
}
